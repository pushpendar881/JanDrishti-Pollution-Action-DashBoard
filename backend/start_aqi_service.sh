#!/bin/bash
# Script to start the AQI data collection service
# This can be used with systemd, launchd, or run manually

cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Start the server
python3 run_server.py
