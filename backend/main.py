"""
FastAPI Backend for AI Smart City Fire Detection System
Integrates YOLOv8 for real-time fire detection in CCTV feeds
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import cv2
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
from ultralytics import YOLO
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Smart City Fire Detection API",
    description="Real-time fire detection using YOLOv8",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define base paths
BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
MODEL_PATH = BASE_DIR / "backend" / "models" / "best.pt"

# Global YOLOv8 model instance
model = None

# Camera status tracking
camera_status: Dict[str, Dict] = {}


class DetectionRequest(BaseModel):
    """Request model for fire detection"""
    video_path: str


class DetectionResponse(BaseModel):
    """Response model for fire detection results"""
    camera_id: str
    fire_detected: bool
    accuracy: float
    timestamp: str
    frame_count: int
    detection_details: Optional[Dict] = None


class CameraStatusResponse(BaseModel):
    """Response model for camera status"""
    camera_id: str
    status: str  # "normal" or "fire"
    confidence: float
    last_updated: str


class ScanAllResponse(BaseModel):
    """Response model for scanning all cameras"""
    total_cameras: int
    fire_detected_count: int
    cameras: List[CameraStatusResponse]
    timestamp: str


def load_model():
    """Load YOLOv8 model from disk"""
    global model
    try:
        if MODEL_PATH.exists():
            logger.info(f"Loading YOLOv8 model from {MODEL_PATH}")
            model = YOLO(str(MODEL_PATH))
            logger.info("Model loaded successfully")
        else:
            logger.warning(f"Model not found at {MODEL_PATH}")
            logger.info("Attempting to load YOLOv8n (nano) from Ultralytics")
            # Download YOLOv8n if model file doesn't exist
            model = YOLO("yolov8n.pt")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise


def detect_fire_in_image(image_path: str) -> Dict:
    """
    Detect fire in an image file using YOLOv8
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Dictionary containing detection results
    """
    if model is None:
        raise RuntimeError("YOLOv8 model not loaded")
    
    # Resolve the actual file path
    full_image_path = PUBLIC_DIR / image_path.lstrip("/")
    
    if not full_image_path.exists():
        logger.error(f"Image file not found: {full_image_path}")
        raise FileNotFoundError(f"Image file not found: {full_image_path}")
    
    logger.info(f"Processing image: {full_image_path}")
    
    try:
        # Read image
        image = cv2.imread(str(full_image_path))
        if image is None:
            raise ValueError(f"Cannot open image file: {full_image_path}")
        
        fire_detected = False
        max_confidence = 0.0
        detections = []
        
        # Run YOLOv8 inference on the image
        results = model(image, verbose=False, conf=0.5)
        
        # Process detections
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    
                    # Check class names for fire-related labels
                    class_name = result.names[cls] if cls < len(result.names) else f"class_{cls}"
                    
                    # Look for fire-related detections
                    if "fire" in class_name.lower() or "flame" in class_name.lower():
                        fire_detected = True
                        max_confidence = max(max_confidence, conf)
                        
                        # Store bounding box details
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        detections.append({
                            "class": class_name,
                            "confidence": conf,
                            "bbox": [x1, y1, x2, y2]
                        })
        
        # Final confidence score
        final_confidence = max_confidence if detections else 0.0
        
        result = {
            "fire_detected": fire_detected,
            "accuracy": final_confidence,
            "detections": detections if detections else []
        }
        
        logger.info(f"Detection complete: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise


def get_camera_id_from_path(video_path: str) -> str:
    """Extract camera ID from video path"""
    # Extract filename without extension
    filename = Path(video_path).stem
    # Try to map known video filenames to camera IDs
    camera_mapping = {
        "city-street-downtown": "cam-1",
        "warehouse-industrial-area": "cam-2",
        "residential-street": "cam-3",
        "park-urban": "cam-4",
        "harbor-waterfront": "cam-5",
    }
    return camera_mapping.get(filename, f"camera_{filename}")


@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    logger.info("Starting up...")
    load_model()
    logger.info("Startup complete")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Smart City Fire Detection API",
        "version": "1.0.0",
        "status": "online"
    }


@app.post("/detect-fire", response_model=DetectionResponse)
async def detect_fire(request: DetectionRequest):
    """
    Run YOLOv8 fire detection on a specific CCTV video
    
    Args:
        request: DetectionRequest containing video_path
        
    Returns:
        DetectionResponse with detection results
    """
    try:
        camera_id = get_camera_id_from_path(request.video_path)
        
        # Run fire detection on image
        detection_result = detect_fire_in_image(request.video_path)
        
        # Update camera status
        camera_status[camera_id] = {
            "status": "fire" if detection_result["fire_detected"] else "normal",
            "confidence": detection_result["accuracy"],
            "last_updated": datetime.now().isoformat()
        }
        
        return DetectionResponse(
            camera_id=camera_id,
            fire_detected=detection_result["fire_detected"],
            accuracy=detection_result["accuracy"],
            timestamp=datetime.now().isoformat(),
            frame_count=detection_result["frame_count"],
            detection_details={
                "total_frames_sampled": detection_result["total_frames_sampled"],
                "detections": detection_result["detections"]
            }
        )
        
    except FileNotFoundError as e:
        logger.error(f"Video file not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in detect_fire: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/camera-status", response_model=List[CameraStatusResponse])
async def get_camera_status():
    """
    Get fire detection status for all registered cameras
    
    Returns:
        List of CameraStatusResponse objects
    """
    try:
        cameras = []
        for camera_id, status in camera_status.items():
            cameras.append(CameraStatusResponse(
                camera_id=camera_id,
                status=status["status"],
                confidence=status["confidence"],
                last_updated=status["last_updated"]
            ))
        return cameras
    except Exception as e:
        logger.error(f"Error in get_camera_status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scan-all", response_model=ScanAllResponse)
async def scan_all():
    """
    Scan all videos in the public directory and update camera status
    
    Returns:
        ScanAllResponse with overall fire detection status
    """
    try:
        if not PUBLIC_DIR.exists():
            raise FileNotFoundError(f"Public directory not found: {PUBLIC_DIR}")
        
        logger.info(f"Scanning all images in {PUBLIC_DIR}")
        
        # Find all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
        image_files = [
            f for f in PUBLIC_DIR.glob('*')
            if f.suffix.lower() in image_extensions
        ]
        
        logger.info(f"Found {len(image_files)} image files")
        
        fire_count = 0
        
        # Process each image
        for image_file in image_files:
            relative_path = f"/{image_file.name}"
            camera_id = get_camera_id_from_path(relative_path)
            
            try:
                logger.info(f"Processing {image_file.name}...")
                detection_result = detect_fire_in_image(relative_path)
                
                # Update camera status
                camera_status[camera_id] = {
                    "status": "fire" if detection_result["fire_detected"] else "normal",
                    "confidence": detection_result["accuracy"],
                    "last_updated": datetime.now().isoformat()
                }
                
                if detection_result["fire_detected"]:
                    fire_count += 1
                    logger.info(f"Fire detected in {camera_id}: {detection_result['accuracy']:.2%}")
                    
            except Exception as e:
                logger.error(f"Error processing {image_file.name}: {e}")
                camera_status[camera_id] = {
                    "status": "error",
                    "confidence": 0.0,
                    "last_updated": datetime.now().isoformat()
                }
        
        # Build response
        cameras = [
            CameraStatusResponse(
                camera_id=camera_id,
                status=status["status"],
                confidence=status["confidence"],
                last_updated=status["last_updated"]
            )
            for camera_id, status in camera_status.items()
        ]
        
        return ScanAllResponse(
            total_cameras=len(camera_status),
            fire_detected_count=fire_count,
            cameras=cameras,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in scan_all: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
