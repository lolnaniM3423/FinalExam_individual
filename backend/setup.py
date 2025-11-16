"""
Setup script to download YOLOv8 model and create necessary directories
"""

import os
from pathlib import Path
from ultralytics import YOLO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
MODELS_DIR = BACKEND_DIR / "models"
PUBLIC_DIR = BASE_DIR / "public"

def setup_directories():
    """Create necessary directories"""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created directories: {MODELS_DIR}, {PUBLIC_DIR}")

def download_model():
    """Download YOLOv8 model"""
    model_path = MODELS_DIR / "best.pt"
    
    if model_path.exists():
        logger.info(f"Model already exists at {model_path}")
        return
    
    logger.info("Downloading YOLOv8 nano model...")
    try:
        # Download YOLOv8n (nano) model
        model = YOLO("yolov8n.pt")
        # Save to models directory
        model.save(str(model_path))
        logger.info(f"Model saved to {model_path}")
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        logger.info("You may need to manually download the best.pt file from Ultralytics")
        raise

if __name__ == "__main__":
    logger.info("Starting setup...")
    setup_directories()
    download_model()
    logger.info("Setup complete!")
