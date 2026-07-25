from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)  # Allow requests from the mobile app

def validate_oral_image(img_array):
    """
    Validates if the image is a histopathology (H&E stained) tissue slide.
    H&E staining creates BOTH purple nuclei AND pink cytoplasm together.
    
    Returns (is_valid, error_message)
    """
    pixels = img_array.astype(np.uint8)
    total_pixels = pixels.shape[0] * pixels.shape[1]
    
    # Count pixels with specific H&E staining patterns
    purple_pixels = 0   # Nuclei: B > R, B > G (relaxed thresholds)
    pink_pixels = 0     # Cytoplasm: R > G by margin
    
    for y in range(pixels.shape[0]):
        for x in range(pixels.shape[1]):
            r = int(pixels[y, x, 0])
            g = int(pixels[y, x, 1])
            b = int(pixels[y, x, 2])
            
            # Purple nuclei: B dominates R and G (relaxed from strict b >= 80)
            if b > r and b > g and b >= 50:
                purple_pixels += 1
            # Pink cytoplasm: R dominates G with visible margin (relaxed from strict r >= 100)
            elif r > g and (r - g) >= 20 and r >= 80 and b < 180:
                pink_pixels += 1
    
    purple_ratio = purple_pixels / total_pixels if total_pixels > 0 else 0
    pink_ratio = pink_pixels / total_pixels if total_pixels > 0 else 0
    
    print(f"[VALIDATION DEBUG] Purple ratio: {purple_ratio:.4f}, Pink ratio: {pink_ratio:.4f}")
    
    # BALANCED: Require BOTH purple nuclei AND pink tissue to be present
    # Relaxed thresholds to accept dataset images
    has_nuclei = purple_ratio >= 0.003   # At least 0.3% purple nuclei
    has_cytoplasm = pink_ratio >= 0.005  # At least 0.5% pink tissue
    
    if not (has_nuclei and has_cytoplasm):
        return False, "Image does not appear to be a histopathology tissue slide. Please upload a microscopy image of the tissue sample."
    
    return True, None

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
        
        # Validate that this is an oral cavity image BEFORE running prediction
        is_valid, error_msg = validate_oral_image(img_array)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        
        # Normalize for model input
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

