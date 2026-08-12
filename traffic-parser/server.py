import asyncio
import json
import logging
import subprocess
import sys
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="API Sentinel Live Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def read_subprocess_stdout(proc):
    """Read from the subprocess stdout asynchronously and broadcast to websockets."""
    loop = asyncio.get_running_loop()
    while True:
        line = await loop.run_in_executor(None, proc.stdout.readline)
        if not line:
            break
        line_str = line.decode('utf-8').strip()
        if not line_str:
            continue
        try:
            # main.py outputs JSON dictionaries for each transaction
            txn_data = json.loads(line_str)
            await manager.broadcast(txn_data)
        except json.JSONDecodeError:
            # Might be a log line or print from main.py
            logger.info(f"Backend log: {line_str}")
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")

@app.on_event("startup")
async def startup_event():
    import os
    
    # Check if we are being piped into
    is_piped = not sys.stdin.isatty()
    
    cmd = [sys.executable, "main.py"]
    cmd.extend(sys.argv[1:])
    if "--spec" not in cmd:
        cmd.extend(["--spec", "../mock-service/openapi.json"])
    
    logger.info(f"Starting subprocess: {' '.join(cmd)}")
    proc = subprocess.Popen(
        cmd,
        stdin=sys.stdin if is_piped else subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    
    asyncio.create_task(read_subprocess_stdout(proc))

if __name__ == "__main__":
    # If there are arguments meant for main.py, we shouldn't pass them to uvicorn.
    # Uvicorn doesn't parse sys.argv if we use uvicorn.run() programmatically like this.
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
