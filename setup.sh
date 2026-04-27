#!/bin/bash
set -e

echo "=== Satisfactory Save Parser — Setup ==="

# Clone the sat_sav_parse library
if [ ! -d "backend/lib/sat_sav_parse" ]; then
  echo "Cloning sat_sav_parse library..."
  git clone https://github.com/GreyHak/sat_sav_parse backend/lib/sat_sav_parse
else
  echo "sat_sav_parse already present, pulling latest..."
  git -C backend/lib/sat_sav_parse pull
fi

# Python backend
echo ""
echo "Installing Python dependencies..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "=== Setup complete ==="
echo ""
echo "To run the app:"
echo "  Terminal 1 (backend):  cd backend && source .venv/bin/activate && uvicorn main:app --reload --reload-dir ."
echo "  Terminal 2 (frontend): cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:5173"
