import os
import numpy as np
import tensorflow as tf
import cv2
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input

# =========================
# CONFIG
# =========================
IMG_SIZE = 224
IMAGE_PATH = "test_image.jpg"  # Make sure this image exists in project root

# =========================
# LOAD MODEL (AUTO DETECT)
# =========================
if os.path.exists("models/brain_tumor_model.keras"):
    MODEL_PATH = "models/brain_tumor_model.keras"
elif os.path.exists("models/brain_tumor_model.h5"):
    MODEL_PATH = "models/brain_tumor_model.h5"
else:
    raise FileNotFoundError("Model file not found in models folder")

print("Loading model from:", MODEL_PATH)
model = load_model(MODEL_PATH)

# =========================
# LOAD IMAGE
# =========================
if not os.path.exists(IMAGE_PATH):
    raise FileNotFoundError(f"Image not found at: {IMAGE_PATH}")

img = cv2.imread(IMAGE_PATH)
if img is None:
    raise ValueError("Image file is corrupted or unreadable.")

original_img = img.copy()
img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
img_array = np.expand_dims(img, axis=0)
img_array = preprocess_input(img_array)

# =========================
# PREDICT CLASS
# =========================
predictions = model.predict(img_array)
predicted_class = np.argmax(predictions[0])
confidence = np.max(predictions[0])

print("Predicted class index:", predicted_class)
print("Confidence:", round(float(confidence), 4))

# =========================
# FIND LAST CONV LAYER
# =========================
last_conv_layer = None
for layer in reversed(model.layers):
    if "conv" in layer.name:
        last_conv_layer = layer.name
        break

if last_conv_layer is None:
    raise ValueError("No convolutional layer found in model")

print("Using last conv layer:", last_conv_layer)

grad_model = tf.keras.models.Model(
    [model.inputs],
    [model.get_layer(last_conv_layer).output, model.output]
)

# =========================
# COMPUTE GRADIENTS
# =========================
with tf.GradientTape() as tape:
    conv_outputs, predictions = grad_model(img_array)
    loss = predictions[:, predicted_class]

grads = tape.gradient(loss, conv_outputs)
pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

conv_outputs = conv_outputs[0]
heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
heatmap = tf.squeeze(heatmap)

# =========================
# NORMALIZE HEATMAP
# =========================
heatmap = np.maximum(heatmap, 0)
heatmap = heatmap / np.max(heatmap)

# Resize to match original image
heatmap = cv2.resize(heatmap, (original_img.shape[1], original_img.shape[0]))

# Convert to 0-255
heatmap = np.uint8(255 * heatmap)

# Apply color map
heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

# Overlay heatmap on original image
superimposed_img = cv2.addWeighted(original_img, 0.6, heatmap, 0.4, 0)

# =========================
# DISPLAY RESULT
# =========================
plt.figure(figsize=(8, 6))
plt.imshow(cv2.cvtColor(superimposed_img, cv2.COLOR_BGR2RGB))
plt.axis("off")
plt.title(f"Prediction: Class {predicted_class} | Confidence: {confidence:.2f}")
plt.show()