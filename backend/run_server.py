#!/usr/bin/env python3
"""
Standalone script to run the FastAPI server with AQI scheduler
Use this to run the server as a background service
"""
import uvicorn
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False  # Set to False for production
    )
