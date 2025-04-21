#!/bin/bash
set -e

cd "$(dirname "$0")"

# 0. Create and activate Python venv if not exists
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

# 0b. Install Python dependencies
pip install --upgrade pip > /dev/null
pip install -r etl/requirements.txt -r model/requirements.txt -r api/requirements.txt

# 1. Seed the database FOR TESTING
python seed_db.py

# 2. Train the model
python model/train.py

# 3. Start the FastAPI backend (in background)
nohup .venv/bin/uvicorn api.main:app --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "Started FastAPI backend with PID $BACKEND_PID (http://localhost:8000)"

# 4. Start the React frontend (in background)
cd ui
npm install > /dev/null
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Started React frontend with PID $FRONTEND_PID (http://localhost:5173)"
cd ..

# 5. Wait for user to terminate
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "---"
echo "Open http://localhost:5173 to view the UI."
echo "FastAPI backend running at http://localhost:8000"
echo "Press Ctrl+C to stop everything."
wait
