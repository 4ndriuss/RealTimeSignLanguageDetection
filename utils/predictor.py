"""Model loading, validation and per-frame prediction shared by inference scripts."""
import collections
import os
from dataclasses import dataclass
from typing import Optional

import numpy as np

from utils.config import ACTIONS_PATH, CONFIDENCE_THRESHOLD, MODEL_PATH
from utils.features import NUM_FEATURES


@dataclass(frozen=True)
class Prediction:
    """Result of classifying one feature vector.

    `label` is None when the top class is below the confidence threshold.
    """
    label: Optional[str]
    confidence: float


class SignPredictor:
    """Wraps the trained Keras model and its class labels."""

    def __init__(self, model_path=MODEL_PATH, actions_path=ACTIONS_PATH,
                 threshold=CONFIDENCE_THRESHOLD):
        if not os.path.exists(model_path) or not os.path.exists(actions_path):
            raise FileNotFoundError(
                "Model or actions file not found. Run '1_preprocess_dataset.py' "
                "and '2_train_model.py' first."
            )

        import tensorflow as tf  # Imported lazily: TensorFlow is slow to import.

        self.model = tf.keras.models.load_model(model_path)
        self.actions = [str(a) for a in np.load(actions_path)]
        self.threshold = threshold

        # Fail fast with a clear message if the model was trained on an older
        # feature format (e.g. the previous 126-feature version) instead of
        # crashing later with a cryptic shape-mismatch error.
        expected = self.model.input_shape[-1]
        if expected != NUM_FEATURES:
            raise ValueError(
                f"Model expects {expected} features, but the extractor produces "
                f"{NUM_FEATURES}. Re-run '1_preprocess_dataset.py' and "
                "'2_train_model.py' to retrain the model."
            )

        # Warm-up: the first call builds the graph and is much slower, so pay
        # that cost at startup instead of on the first real request/frame.
        self.predict(np.zeros(NUM_FEATURES))

    def predict(self, features):
        """Classify one NUM_FEATURES-long feature vector."""
        input_data = np.asarray(features, dtype=np.float32).reshape(1, NUM_FEATURES)
        # Calling the model directly avoids the per-call overhead of
        # model.predict(), which is significant when invoked every frame.
        probs = self.model(input_data, training=False).numpy()[0]

        index = int(np.argmax(probs))
        confidence = float(probs[index])
        label = self.actions[index] if confidence > self.threshold else None
        return Prediction(label=label, confidence=confidence)


class MajorityVoteSmoother:
    """Stabilizes per-frame predictions with a majority vote over recent frames.

    Only confident predictions vote. The history is cleared once the hand has
    been missing for more than `history` consecutive frames.
    """

    def __init__(self, history=15):
        self.history = history
        self._votes = collections.deque(maxlen=history)
        self._missing_frames = 0

    def update(self, prediction):
        """Register a frame with a detected hand; return (label, avg_conf) or None."""
        self._missing_frames = 0
        if prediction.label is not None:
            self._votes.append((prediction.label, prediction.confidence))
        if not self._votes:
            return None

        winner = collections.Counter(l for l, _ in self._votes).most_common(1)[0][0]
        # Average confidence of the frames that voted for the winner.
        avg_conf = float(np.mean([c for l, c in self._votes if l == winner]))
        return winner, avg_conf

    def mark_missing(self):
        """Register a frame without any detected hand."""
        self._missing_frames += 1
        if self._missing_frames > self.history:
            self._votes.clear()
