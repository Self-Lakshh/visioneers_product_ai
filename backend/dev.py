"""
Visioneers Dev Launcher — Bulletproof Port 8000 Manager.
Optimized to handle Windows socket locks using 0.0.0.0 binding.
"""

import os
import subprocess
import sys
import time

def kill_port_8000():
    print("🔍 Sweeping port 8000 for zombie processes...")
    if sys.platform == "win32":
        try:
            # Enhanced PowerShell PID discovery
            pwsh_cmd = 'Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Get-Unique'
            pids = subprocess.check_output(['powershell', '-Command', pwsh_cmd]).decode().strip().split()
            
            for pid in pids:
                if pid and pid != '0':
                    print(f"💀 Force-killing process {pid}...")
                    subprocess.run(f"taskkill /F /PID {pid} /T", shell=True, capture_output=True)
                    time.sleep(0.5)
        except:
            pass

def start_server():
    # USABILITY FIX: Bind to 0.0.0.0 to bypass specific IPv4 loopback locks on Windows
    print("🚀 Starting Visioneers Backend on http://0.0.0.0:8000...")
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--host", "0.0.0.0", 
        "--port", "8000",
        "--log-level", "info"
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")
    except Exception as e:
        print(f"❌ Critical Error: {e}")

if __name__ == "__main__":
    kill_port_8000()
    start_server()
