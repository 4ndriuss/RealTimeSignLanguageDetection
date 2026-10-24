"""Export the trained Keras MLP to plain NumPy weights for inference.

Calling a Keras model eagerly costs ~10 ms per frame, while the same network
evaluated with NumPy takes ~0.06 ms. Each BatchNormalization layer is folded
into the Dense layer that follows it, so inference is just a chain of
`x @ W + b` with an activation in between.

Run `python -m utils.export` to convert an existing .keras model without
retraining; 2_train_model.py calls `export_weights` automatically.
"""
import numpy as np

from utils.config import MODEL_PATH, WEIGHTS_PATH

SUPPORTED_ACTIVATIONS = ('relu', 'softmax', 'linear')


def fold_layers(model):
    """Return the model as a list of (W, b, activation) Dense layers.

    Dropout is dropped (a no-op at inference). BatchNormalization computes
    `a * h + c` with per-feature `a` and `c`, so feeding it into the next Dense
    layer `x @ W + b` gives `h @ (a[:, None] * W) + (c @ W + b)`.
    """
    layers = []
    pending_bn = None
    for layer in model.layers:
        kind = type(layer).__name__
        if kind == 'Dense':
            W, b = layer.get_weights()
            if pending_bn is not None:
                a, c = pending_bn
                W, b = a[:, None] * W, c @ W + b
                pending_bn = None
            activation = layer.activation.__name__
            if activation not in SUPPORTED_ACTIVATIONS:
                raise ValueError(f"Unsupported activation '{activation}' in layer '{layer.name}'.")
            layers.append((W, b, activation))
        elif kind == 'BatchNormalization':
            gamma, beta, mean, var = layer.get_weights()
            a = gamma / np.sqrt(var + layer.epsilon)
            pending_bn = (a, beta - mean * a)
        elif kind != 'Dropout':
            raise ValueError(f"Cannot export layer '{layer.name}' of type {kind}.")

    if pending_bn is not None:
        raise ValueError("The last BatchNormalization layer has no Dense layer to fold into.")
    return layers


def export_weights(model, path=WEIGHTS_PATH):
    """Save the folded Dense layers of `model` to an .npz file."""
    layers = fold_layers(model)
    arrays = {}
    for i, (W, b, _) in enumerate(layers):
        arrays[f'W{i}'] = W.astype(np.float32)
        arrays[f'b{i}'] = b.astype(np.float32)
    np.savez(path, activations=np.array([act for _, _, act in layers]), **arrays)


if __name__ == '__main__':
    import tensorflow as tf

    export_weights(tf.keras.models.load_model(MODEL_PATH))
    print(f"Exported '{MODEL_PATH}' to '{WEIGHTS_PATH}'.")
