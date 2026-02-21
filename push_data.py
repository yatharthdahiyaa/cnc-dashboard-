"""
CNC Dashboard — Direct Data Push Example
=========================================
This script sends CNC machine data directly to the dashboard server
using the secure REST API (no Google Sheets needed).

Requirements:
    pip install requests

Usage:
    python push_data.py
"""

import requests
import time
import math
import random

# ─── Configuration ─────────────────────────────────────────────────────────────
SERVER_URL = "http://localhost:3002"
ACCESS_TOKEN = "cnc-dashboard-secret-token-change-me"  # Must match API_ACCESS_TOKEN in server/.env

HEADERS = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json",
}

# ─── Helper: simulate realistic CNC data ──────────────────────────────────────
def make_machine_data(machine_id: str, t: float) -> dict:
    """Generate a realistic CNC data payload. Replace with your real sensor reads."""
    base_speed = 12000 if machine_id == "machine1" else 8500
    is_running = random.random() > 0.1  # 90% chance running

    return {
        "status": "RUNNING" if is_running else "IDLE",
        "spindle": {
            "speed": round(base_speed + math.sin(t) * 500) if is_running else 0,
            "load": round(65 + math.sin(t * 0.7) * 10, 1) if is_running else 0,
            "temperature": round(42 + math.sin(t * 0.3) * 5, 1),
        },
        "axis": {
            "x": round(150 + math.sin(t * 0.5) * 50, 2),
            "y": round(75 + math.cos(t * 0.4) * 30, 2),
            "z": round(-25 + math.sin(t * 0.8) * 10, 2),
        },
        "production": {
            "partsCompleted": int(t * 0.5) % 300,
            "partsTarget": 300,
            "cycleTime": 100,
        },
        "runtime": {
            "total": 50000 + int(t),
            "today": 15000 + int(t),
            "lastJob": 120,
        },
        "alarms": [],
    }


# ─── Option A: Push both machines at once ─────────────────────────────────────
def push_both(t: float):
    payload = {
        "machine1": make_machine_data("machine1", t),
        "machine2": make_machine_data("machine2", t + 1),
    }
    resp = requests.post(f"{SERVER_URL}/api/data/push", json=payload, headers=HEADERS, timeout=5)
    resp.raise_for_status()
    return resp.json()


# ─── Option B: Push a single machine ──────────────────────────────────────────
def push_single(machine_id: str, t: float):
    payload = make_machine_data(machine_id, t)
    resp = requests.post(
        f"{SERVER_URL}/api/machines/{machine_id}/data",
        json=payload,
        headers=HEADERS,
        timeout=5,
    )
    resp.raise_for_status()
    return resp.json()


# ─── Main loop ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"🚀 Pushing CNC data to {SERVER_URL} every 2 seconds...")
    print(f"   Press Ctrl+C to stop.\n")

    t = 0.0
    while True:
        try:
            result = push_both(t)
            print(f"[t={t:.1f}s] ✅ Pushed — clients: {result.get('clients', '?')}")
        except requests.exceptions.ConnectionError:
            print(f"[t={t:.1f}s] ❌ Cannot connect to server. Is it running?")
        except requests.exceptions.HTTPError as e:
            print(f"[t={t:.1f}s] ❌ HTTP {e.response.status_code}: {e.response.text}")
        except Exception as e:
            print(f"[t={t:.1f}s] ❌ Error: {e}")

        t += 2.0
        time.sleep(2)
