import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Fabric AI API")
allowed_origins = ["http://localhost:5173"]
frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    allowed_origins.append(frontend_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Model setup
# -----------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "model" / "fabric_model.keras"

CLASS_NAMES = [
    "Abaca",
    "Cotton",
    "Hessian",
    "Linen",
    "Silk",
    "Wool",
]

IMAGE_SIZE = (224, 224)


# Load the trained model once when the backend starts
model = tf.keras.models.load_model(MODEL_PATH)


# -----------------------------
# Routes
# -----------------------------

@app.get("/")
def root():
    return {"message": "Fabric AI backend is running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Check that a file was uploaded
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        # Read uploaded image
        image_data = await file.read()

        # Open image and convert to RGB
        image = Image.open(
            __import__("io").BytesIO(image_data)
        ).convert("RGB")

        # Resize to the size used during training
        image = image.resize(IMAGE_SIZE)

        # Convert image to NumPy array
        image_array = np.array(image, dtype=np.float32)

        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)

        # Make prediction
        predictions = model.predict(image_array, verbose=0)

        # Find class with highest probability
        predicted_index = int(np.argmax(predictions[0]))
        predicted_class = CLASS_NAMES[predicted_index]
        confidence = float(predictions[0][predicted_index])

        return {
            "fabric": predicted_class,
            "confidence": round(confidence * 100, 2),
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process image: {str(e)}"
        )