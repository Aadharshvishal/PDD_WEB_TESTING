from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)  # Allow requests from the mobile app

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Load the trained OSCC .keras model
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MODEL_PATH = os.path.join(os.path.dirname(__file__), "OSCC_AI_Model.keras")

model = None

def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        print(f"Model file not found at: {MODEL_PATH}")
        return False
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("âœ… OSCC Model loaded successfully (Native Keras 3)!")
        return True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return False

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Health check endpoint
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "running",
        "model_loaded": model is not None,
        "message": "OSCC Detection API is active"
    })

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Prediction endpoint
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({
            "error": "Model not loaded. Please ensure OSCC_AI_Model.keras is present."
        }), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Use key 'image' in form-data."}), 400

    file = request.files["image"]

    try:
        # Read and preprocess image
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = img.resize((224, 224))
        
        img_array = np.array(img, dtype=np.float32)
        img_array = img_array / 255.0                        # Normalize [0, 1]
        img_array = np.expand_dims(img_array, axis=0)        # Shape: (1, 224, 224, 3)

        # Run prediction
        raw_score = float(model.predict(img_array)[0][0])

        # 3-Level Medical Decision Logic
        THRESHOLD_HIGH        = 0.85
        THRESHOLD_SUSPICIOUS  = 0.60

        if raw_score >= THRESHOLD_HIGH:
            risk_level      = "High Risk"
            confidence      = round(raw_score * 100, 2)
            recommendation  = "Immediate Medical Evaluation Advised"
            color_code      = "red"
        elif raw_score >= THRESHOLD_SUSPICIOUS:
            risk_level      = "Suspicious"
            confidence      = round(raw_score * 100, 2)
            recommendation  = "Further Clinical Examination Required"
            color_code      = "yellow"
        else:
            risk_level      = "Normal"
            confidence      = round((1 - raw_score) * 100, 2)
            recommendation  = "No immediate concern. Routine check-up advised."
            color_code      = "green"

        return jsonify({
            "risk_level":     risk_level,
            "confidence":     confidence,
            "recommendation": recommendation,
            "color_code":     color_code,
            "raw_score":      raw_score
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Run the server
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if __name__ == "__main__":
    if load_model():
        print("\n>> Starting OSCC Detection API on http://0.0.0.0:5000\n")
        app.run(host="0.0.0.0", port=5000, debug=False)
    else:
        print("\nWARNING  Server not started - model file missing or incompatible.")

