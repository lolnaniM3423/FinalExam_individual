"""
Test script to verify the Fire Detection API is working correctly
"""

import requests
import json
from pathlib import Path
import time
import sys

API_BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def test_health():
    """Test health check endpoint"""
    print_info("Testing health check...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Health check passed")
            print(f"  Model loaded: {data.get('model_loaded', 'Unknown')}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to API. Is the backend running?")
        print_info("Start backend with: python -m uvicorn backend.main:app --reload --port 8000")
        return False
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False

def test_root():
    """Test root endpoint"""
    print_info("Testing root endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Root endpoint works")
            print(f"  Version: {data.get('version', 'Unknown')}")
            return True
        else:
            print_error(f"Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Root endpoint error: {e}")
        return False

def test_camera_status():
    """Test camera status endpoint"""
    print_info("Testing camera status endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/camera-status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Camera status retrieved: {len(data)} cameras")
            for camera in data:
                status_color = Colors.RED if camera['status'] == 'fire' else Colors.GREEN
                print(f"  {status_color}{camera['camera_id']}: {camera['status']} ({camera['confidence']:.2%}){Colors.END}")
            return True
        else:
            print_error(f"Camera status failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Camera status error: {e}")
        return False

def test_detect_fire(video_path):
    """Test fire detection endpoint"""
    print_info(f"Testing fire detection on: {video_path}")
    try:
        payload = {"video_path": video_path}
        response = requests.post(
            f"{API_BASE_URL}/detect-fire",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Fire detection completed")
            print(f"  Camera ID: {data['camera_id']}")
            print(f"  Fire detected: {data['fire_detected']}")
            print(f"  Accuracy: {data['accuracy']:.2%}")
            print(f"  Frames analyzed: {data['frame_count']}")
            
            if data['fire_detected'] and data['detection_details']['detections']:
                print_info("Detections found:")
                for det in data['detection_details']['detections']:
                    print(f"    - {det['class']}: {det['confidence']:.2%}")
            
            return True
        else:
            print_error(f"Fire detection failed: {response.status_code}")
            if response.text:
                print_info(f"Response: {response.text}")
            return False
    except requests.exceptions.Timeout:
        print_warning("Fire detection timed out (processing large video)")
        return False
    except Exception as e:
        print_error(f"Fire detection error: {e}")
        return False

def test_scan_all():
    """Test scan all endpoint"""
    print_info("Testing scan all endpoint (this may take a while)...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/scan-all",
            timeout=300  # 5 minute timeout for scanning all videos
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Scan all completed")
            print(f"  Total cameras: {data['total_cameras']}")
            print(f"  Fire detected: {data['fire_detected_count']}")
            
            for camera in data['cameras']:
                status_color = Colors.RED if camera['status'] == 'fire' else Colors.GREEN
                print(f"  {status_color}{camera['camera_id']}: {camera['status']}{Colors.END}")
            
            return True
        else:
            print_error(f"Scan all failed: {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print_warning("Scan all timed out (videos are large)")
        return False
    except Exception as e:
        print_error(f"Scan all error: {e}")
        return False

def list_videos():
    """List available videos"""
    print_info("Checking for video files...")
    public_dir = Path("public")
    
    if not public_dir.exists():
        print_warning("public/ directory not found")
        return []
    
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'}
    videos = [f for f in public_dir.glob('*') if f.suffix.lower() in video_extensions]
    
    if videos:
        print_success(f"Found {len(videos)} video files:")
        for video in videos:
            print(f"  - {video.name}")
        return videos
    else:
        print_warning("No video files found in public/ directory")
        print_info("Add *.mp4 files to the public/ folder to test fire detection")
        return []

def main():
    """Run all tests"""
    print("")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║      Fire Detection API - Test Suite                      ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print("")
    
    # Check videos first
    videos = list_videos()
    print("")
    
    # Test connectivity
    print("Testing API Connectivity:")
    print("-" * 60)
    if not test_health():
        sys.exit(1)
    print("")
    
    # Test root endpoint
    if not test_root():
        print_warning("Root endpoint test failed")
    print("")
    
    # Test camera status
    test_camera_status()
    print("")
    
    # Test fire detection if videos exist
    if videos:
        print("Testing Fire Detection:")
        print("-" * 60)
        # Test with first video
        video_path = f"/{videos[0].name}"
        test_detect_fire(video_path)
        print("")
    
    # Summary
    print("╔════════════════════════════════════════════════════════════╗")
    print("║                    Test Summary                            ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print("")
    print("✓ Basic API connectivity: OK")
    
    if not videos:
        print_warning("No videos found for testing fire detection")
        print_info("Add video files to public/ folder to test detection")
    else:
        print("✓ Fire detection endpoint: Available")
    
    print("")
    print("API Documentation: http://localhost:8000/docs")
    print("Frontend: http://localhost:3000")
    print("")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
