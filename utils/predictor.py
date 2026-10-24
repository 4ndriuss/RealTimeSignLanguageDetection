"""Model loading, validation and per-frame prediction shared by inference scripts."""
import collections
import os
from dataclasses import dataclass
from typing import Optional

import numpy as np

from utils.config import ACTIONS_PATH, CONFIDENCE_THRESHOLD, WEIGHTS_PATH
from utils.features import NUM_FEATURES

def _softmax(h):
    e = np.exp(h - h.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)


_ACTIVATIONS = {
    'relu': lambda h: np.maximum(h, 0),
    'linear': lambda h: h,
    'softmax': _softmax,
}


@dataclass(frozen=True)
class Prediction:
    """Result of classifying one feature vector.

    `label` is None when the top class is below the confidence threshold.
    """
    label: Optional[str]
    confidence: float


class SignPredictor:
    """Runs the trained MLP on its exported NumPy weights (see utils/export.py).

    TensorFlow is not needed at inference: a NumPy forward pass of this small
    network takes ~0.06 ms, versus ~10 ms for an eager Keras call.
    """

    def __init__(self, weights_path=WEIGHTS_PATH, actions_path=ACTIONS_PATH,
                 threshold=CONFIDENCE_THRESHOLD):
        if not os.path.exists(actions_path):
            raise FileNotFoundError(
                "Actions file not found. Run '1_preprocess_dataset.py' and "
                "'2_train_model.py' first."
            )
        if not os.path.exists(weights_path):
            raise FileNotFoundError(
                f"Model weights '{weights_path}' not found. Run '2_train_model.py', "
                "or 'python -m utils.export' to convert an existing .keras model."
            )

        with np.load(weights_path) as data:
            activations = [str(a) for a in data['activations']]
            self.layers = [(data[f'W{i}'], data[f'b{i}'], _ACTIVATIONS[act])
                           for i, act in enumerate(activations)]
        self.actions = [str(a) for a in np.load(actions_path)]
        self.threshold = threshold

        # Fail fast with a clear message if the model was trained on an older
        # feature format (e.g. the previous 126-feature version) instead of
        # crashing later with a cryptic shape-mismatch error.
        expected = self.layers[0][0].shape[0]
        if expected != NUM_FEATURES:
            raise ValueError(
                f"Model expects {expected} features, but the extractor produces "
                f"{NUM_FEATURES}. Re-run '1_preprocess_dataset.py' and "
                "'2_train_model.py' to retrain the model."
            )

    def predict_proba(self, features):
        """Return class probabilities for a (NUM_FEATURES,) or (N, NUM_FEATURES) input."""
        h = np.asarray(features, dtype=np.float32)
        for W, b, activation in self.layers:
            h = activation(h @ W + b)
        return h

    def predict(self, features):
        """Classify one NUM_FEATURES-long feature vector."""
        probs = self.predict_proba(np.reshape(features, NUM_FEATURES))

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
