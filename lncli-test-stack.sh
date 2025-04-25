#!/bin/bash
set -e

# lncli-test-stack.sh
# Usage: Set the following environment variables before running:
#   LND_DIR=~/.lnd
#   NETWORK=mainnet|testnet|regtest|simnet
#   LND_RPC=localhost:10009
#   LND_TLSCERT=~/.lnd/tls.cert
#   LND_MACAROON=~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon
#   LNCLI=lncli (or path to lncli binary)

: "${LND_DIR:?Set LND_DIR to your lnd directory}"
: "${NETWORK:?Set NETWORK to your lnd network}"
: "${LND_RPC:?Set LND_RPC to your lnd grpc address}"
: "${LND_TLSCERT:?Set LND_TLSCERT to your tls.cert path}"
: "${LND_MACAROON:?Set LND_MACAROON to your macaroon path}"
: "${LNCLI:?Set LNCLI to your lncli binary or alias}"

export LND_DIR LND_RPC LND_TLSCERT LND_MACAROON NETWORK

echo "[PREP] Ensuring storage directory exists..."
mkdir -p storage
if [ $? -ne 0 ]; then
  echo "[ERROR] Failed to create storage directory."
  exit 1
fi

echo "[STEP 1] Checking lncli connectivity..."
if ! $LNCLI --network=$NETWORK --rpcserver=$LND_RPC --macaroonpath=$LND_MACAROON --tlscertpath=$LND_TLSCERT getinfo > /dev/null; then
  echo "[ERROR] lncli connectivity failed. Check your LND credentials and environment variables."
  exit 1
fi
echo "[STEP 1] lncli connectivity OK."

echo "[STEP 2] Querying a sample channel or node..."
if ! $LNCLI --network=$NETWORK --rpcserver=$LND_RPC --macaroonpath=$LND_MACAROON --tlscertpath=$LND_TLSCERT listchannels; then
  echo "[ERROR] lncli listchannels failed."
  exit 1
fi
echo "[STEP 2] listchannels OK."

echo "[STEP 3] Querying mission control (if available)..."
if ! $LNCLI --network=$NETWORK --rpcserver=$LND_RPC --macaroonpath=$LND_MACAROON --tlscertpath=$LND_TLSCERT querymc; then
  echo "[WARNING] lncli querymc failed (may not be available on all networks)."
else
  echo "[STEP 3] querymc OK."
fi

echo "[STEP 4] Building Go collector..."
if ! (cd collector && go build -o collector); then
  echo "[ERROR] Failed to build Go collector."
  exit 1
fi
if [ -x collector/collector ]; then
  echo "[STEP 4] Starting Go collector..."
  collector/collector &
  COLLECTOR_PID=$!
  sleep 5
  if ps -p $COLLECTOR_PID > /dev/null; then
    echo "[STEP 4] Collector started with PID $COLLECTOR_PID."
  else
    echo "[ERROR] Go collector failed to start."
    exit 1
  fi
else
  echo "[ERROR] Go collector binary not found after build."
  exit 1
fi

echo "[STEP 5] Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
  if ! python3 -m venv .venv; then
    echo "[ERROR] Failed to create Python venv."
    exit 1
  fi
  echo "[STEP 5] Created new venv."
else
  echo "[STEP 5] venv already exists."
fi
if ! source .venv/bin/activate; then
  echo "[ERROR] Failed to activate Python venv."
  exit 1
fi

pip install --upgrade pip > /dev/null
if ! pip install -r etl/requirements.txt -r model/requirements.txt -r api/requirements.txt; then
  echo "[ERROR] pip install failed."
  exit 1
fi

echo "[STEP 6] Training the ML model..."
if ! python model/train.py; then
  echo "[ERROR] Model training failed."
  exit 1
fi

echo "[STEP 7] Starting FastAPI backend..."
nohup .venv/bin/uvicorn api.main:app --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
sleep 2
if ps -p $BACKEND_PID > /dev/null; then
  echo "[STEP 7] FastAPI backend started with PID $BACKEND_PID (http://localhost:8000)"
else
  echo "[ERROR] FastAPI backend failed to start. See backend.log."
  exit 1
fi

echo "[STEP 8] Starting React frontend..."
cd ui
npm install > /dev/null
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2
if ps -p $FRONTEND_PID > /dev/null; then
  echo "[STEP 8] React frontend started with PID $FRONTEND_PID (http://localhost:5173)"
else
  echo "[ERROR] React frontend failed to start. See ui/frontend.log."
  exit 1
fi
cd ..

echo "[STEP 9] All services started. Trap set to stop all on exit."
trap "echo 'Stopping servers...'; kill $COLLECTOR_PID $BACKEND_PID $FRONTEND_PID" EXIT
echo "---"
echo "Open http://localhost:5173 to view the UI."
echo "FastAPI backend running at http://localhost:8000"
echo "Press Ctrl+C to stop everything."
wait
