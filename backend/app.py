from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io
import base64
from tensorflow.keras.applications.efficientnet import preprocess_input

app = FastAPI()

# =========================
# CORS (React Safe)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LOAD TRAINED MODEL
# =========================
MODEL_PATH = "brain_tumor_model.h5"   # MUST match training save path
model = tf.keras.models.load_model(MODEL_PATH)

class_names = ['glioma', 'meningioma', 'notumor', 'pituitary']
IMG_SIZE = 224

# =========================
# GET LAST CONV LAYER (EfficientNetB0)
# =========================
last_conv_layer = model.get_layer("top_conv")

grad_model = tf.keras.models.Model(
    inputs=model.input,
    outputs=[last_conv_layer.output, model.output]
)

# =========================
# PREDICTION API
# =========================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        # =========================
        # IMAGE PREPROCESSING
        # =========================
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE))

        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        # =========================
        # PREDICTION
        # =========================
        predictions = model.predict(img_array)
        class_idx = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))

        # =========================
        # GRAD-CAM
        # =========================
        with tf.GradientTape() as tape:
            conv_outputs, preds = grad_model(img_array)
            loss = preds[:, class_idx]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # Safe normalization
        heatmap = tf.maximum(heatmap, 0)
        max_val = tf.reduce_max(heatmap)
        heatmap /= (max_val + 1e-8)
        heatmap = heatmap.numpy()

        # =========================
        # OVERLAY HEATMAP
        # =========================
        heatmap = cv2.resize(heatmap, (IMG_SIZE, IMG_SIZE))
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        original = np.array(img)
        overlay = cv2.addWeighted(original, 0.6, heatmap, 0.4, 0)

        _, buffer = cv2.imencode(".jpg", overlay)
        heatmap_base64 = base64.b64encode(buffer).decode("utf-8")

        # =========================
        # RESPONSE (DO NOT CHANGE)
        # =========================
        return {
            "tumor_type": class_names[class_idx],
            "confidence": round(confidence * 100, 2),
            "heatmap": heatmap_base64
        }

    except Exception as e:
        return {"error": str(e)}