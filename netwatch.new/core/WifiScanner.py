import os


import time


import json


import threading


import joblib


import datetime


import subprocess


import socket


import numpy as np


import matplotlib.pyplot as plt


import matplotlib


from http.server import BaseHTTPRequestHandler, HTTPServer


from urllib.parse import urlparse


from scapy.all import sniff, Dot11, conf





matplotlib.use('Agg')  # Headless rendering





# Constants - Organized file paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)  # netwatch directory
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
SCANS_DIR = os.path.join(OUTPUT_DIR, "scans")
STATIC_DIR = os.path.join(OUTPUT_DIR, "static")
MODELS_DIR = os.path.join(OUTPUT_DIR, "models")

# Create directories if they don't exist
for dir_path in [OUTPUT_DIR, SCANS_DIR, STATIC_DIR, MODELS_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# File paths
SCAN_EXPORT_FILE = os.path.join(SCANS_DIR, "interference_scan.json")
SPECTRAL_SCAN_FILE = os.path.join(SCANS_DIR, "spectral_scan.json")
SPECTRAL_HISTORY_FILE = os.path.join(SCANS_DIR, "spectral_history.json")
BAD_FREQUENCIES_FILE = os.path.join(SCANS_DIR, "bad_frequencies.json")

# Model path
MODEL_PATH = os.path.join(MODELS_DIR, "wifi_rf_model.joblib")
# Fallback paths
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(SCRIPT_DIR, "wifi_rf_model.joblib")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(BASE_DIR, "logs", "ai_model", "wifi_rf_model.joblib")


FREQ_START = 4600


FREQ_END = 6500


FREQ_STEP = 10


MAX_HISTORY = 50





# Globals


http_ready = threading.Event()


interference_log = []


latest_spectral_data = []


freq_bins = np.arange(FREQ_START, FREQ_END + FREQ_STEP, FREQ_STEP)


spectrum_history = []





# Load model
model = None
try:
    # Check if model file exists before trying to load
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"[+] AI model loaded from: {MODEL_PATH}")
    else:
        print(f"[!] AI model file not found at: {MODEL_PATH}")
        print("[!] Running without AI interference detection")
except FileNotFoundError:
    print(f"[!] AI model file not found at: {MODEL_PATH}")
    print("[!] Running without AI interference detection")
except Exception as e:
    print(f"[!] Failed to load AI model: {e}")
    print("[!] This may be due to missing dependencies (scikit-learn) or incompatible model format")
    print("[!] Running without AI interference detection")
    model = None





# Monitor setup


def get_monitor_interface():
    """Auto-detect wireless interface - improved detection"""
    try:
        # Method 1: Use iw dev to list wireless interfaces
        result = os.popen("iw dev 2>/dev/null | awk '$1==\"Interface\"{print $2}'").read().strip()
        interfaces = [iface for iface in result.split('\n') if iface]
        
        if interfaces:
            print(f"[+] Auto-detected wireless interfaces: {', '.join(interfaces)}")
            # Return first available interface
            return interfaces[0]
        
        # Method 2: Check common wireless interface names
        common_interfaces = ['wlan0', 'wlan1', 'wlx', 'wlp', 'wlP']
        for pattern in common_interfaces:
            result = os.popen(f"ip link show | grep -oE '{pattern}[^:]*' | head -1").read().strip()
            if result:
                print(f"[+] Auto-detected wireless interface: {result}")
                return result
        
        # Method 3: Check for wireless interfaces via sys/class/net
        result = os.popen("ls /sys/class/net/ | grep -E '^wl|^wifi' | head -1").read().strip()
        if result:
            print(f"[+] Auto-detected wireless interface: {result}")
            return result
        
        raise RuntimeError("No wireless interface found.")
        
    except Exception as e:
        print(f"[!] Failed to auto-detect wireless interface: {e}")
        print("[!] Please specify interface manually or ensure wireless adapter is connected")
        # Don't return a hardcoded default, let it fail gracefully
        return None





def enable_monitor_mode():
    """Enable monitor mode on wireless interface"""
    iface = get_monitor_interface()
    
    if not iface:
        raise RuntimeError("No wireless interface available for monitor mode")
    
    try:
        print(f"[*] Enabling monitor mode on {iface}...")
        # Check current mode
        current_mode = os.popen(f"iw dev {iface} info 2>/dev/null | grep type | awk '{{print $2}}'").read().strip()
        
        if current_mode == "monitor":
            print(f"[+] Interface {iface} is already in monitor mode")
            return iface
        
        # Bring interface down
        os.system(f"sudo ip link set {iface} down 2>/dev/null")
        time.sleep(0.5)
        
        # Set monitor mode
        result = os.system(f"sudo iw dev {iface} set type monitor 2>/dev/null")
        if result != 0:
            raise Exception(f"Failed to set {iface} to monitor mode")
        
        # Bring interface up
        os.system(f"sudo ip link set {iface} up 2>/dev/null")
        time.sleep(0.5)
        
        # Verify monitor mode
        new_mode = os.popen(f"iw dev {iface} info 2>/dev/null | grep type | awk '{{print $2}}'").read().strip()
        if new_mode == "monitor":
            print(f"[+] Successfully enabled monitor mode on {iface}")
        else:
            print(f"[!] Warning: {iface} mode is {new_mode}, expected monitor")
        
    except Exception as e:
        print(f"[!] Failed to set monitor mode on {iface}: {e}")
        raise
    
    return iface





# Feature extraction


def extract_features(pkt):


    try:


        if pkt.haslayer(Dot11):


            mac = pkt.addr2 or "N/A"


            signal = pkt.dBm_AntSignal if hasattr(pkt, 'dBm_AntSignal') else -100


            freq = pkt.ChannelFrequency if hasattr(pkt, 'ChannelFrequency') else -1


            return {


                "mac": mac,


                "signal": signal,


                "freq": freq,


                "timestamp": datetime.datetime.now().isoformat()


            }


    except:


        pass


    return None


# Bad frequency detection - enhanced algorithm
BAD_FREQUENCY_THRESHOLDS = {
    'high_noise': -85,  # dBm - frequencies with noise above this are bad
    'high_interference': -70,  # dBm - strong signals causing interference
    'congested': 80,  # % utilization - frequencies with high utilization
}

bad_frequencies = []  # Global list of bad frequencies detected

def detect_bad_frequencies(features):
    """Enhanced bad frequency detection algorithm"""
    global bad_frequencies
    
    freq = features.get('freq', 0)
    signal = features.get('signal', -100)
    
    if freq <= 0:
        return False
    
    is_bad = False
    reasons = []
    
    # Check 1: High noise level (weak signal but high activity)
    if signal < BAD_FREQUENCY_THRESHOLDS['high_noise']:
        is_bad = True
        reasons.append(f"High noise ({signal} dBm)")
    
    # Check 2: Strong interference (very strong signal from non-WiFi sources)
    if signal > BAD_FREQUENCY_THRESHOLDS['high_interference']:
        is_bad = True
        reasons.append(f"Strong interference ({signal} dBm)")
    
    # Check 3: Frequency in known problematic ranges
    # 2.4GHz: Channels 1, 6, 11 are standard, others can cause interference
    if 2400 <= freq <= 2500:
        channel = int((freq - 2407) / 5) + 1
        if channel not in [1, 6, 11] and 1 <= channel <= 14:
            is_bad = True
            reasons.append(f"Non-standard 2.4GHz channel ({channel})")
    
    # Check 4: DFS channels (weather radar) - can cause issues
    dfs_channels_5ghz = [52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140]
    if 5000 <= freq <= 6000:
        channel = int((freq - 5000) / 5) + 36
        if channel in dfs_channels_5ghz:
            is_bad = True
            reasons.append(f"DFS channel ({channel}) - may have radar interference")
    
    if is_bad:
        bad_freq_entry = {
            'freq': freq,
            'signal': signal,
            'timestamp': features.get('timestamp', datetime.datetime.now().isoformat()),
            'reasons': reasons,
            'mac': features.get('mac', 'N/A')
        }
        
        # Add to bad frequencies list if not already there
        freq_exists = any(bf['freq'] == freq for bf in bad_frequencies)
        if not freq_exists:
            bad_frequencies.append(bad_freq_entry)
            print(f"[!] Bad frequency detected: {freq} MHz - {', '.join(reasons)}")
        
        # Keep only last 100 bad frequencies
        if len(bad_frequencies) > 100:
            bad_frequencies.pop(0)
    
    return is_bad

# AI detection


def ai_detect_interference(features):


    try:
        # First check bad frequencies (rule-based)
        bad_freq_result = detect_bad_frequencies(features)
        
        if model is None:
            # Fallback to rule-based detection if no AI model
            return bad_freq_result

        # NOTE: Model was trained with [MAC_encoded, RSSI, Channel]
        # For real-time detection, we use [signal (RSSI), freq (frequency)]
        # This is a simplified version. For accurate detection, the model should be
        # retrained to use RSSI and frequency, or we need to save/load the LabelEncoder
        # and calculate channel from frequency
        
        # Convert frequency to approximate channel (simplified)
        freq = features.get('freq', 0)
        # Basic channel approximation (not precise)
        channel = 1
        if 2400 <= freq <= 2500:
            channel = int((freq - 2407) / 5) + 1
        elif 5000 <= freq <= 6000:
            channel = int((freq - 5000) / 5) + 36
        
        # Use signal (RSSI) and channel for prediction
        # Note: This doesn't match training exactly (missing MAC_encoded)
        # The model may not work perfectly until retrained with matching features
        signal = features.get('signal', -100)
        prediction = model.predict([[0, signal, channel]])  # Using 0 as dummy MAC_encoded

        # Isolation Forest returns -1 for anomalies, 1 for normal
        ai_result = prediction[0] == -1
        
        # Combine AI detection with bad frequency detection
        # Return True if either AI or bad frequency detection says it's interfering
        return ai_result or bad_freq_result

    except Exception as e:
        print(f"[!] AI detection error: {e}")
        # Fallback to rule-based detection
        return detect_bad_frequencies(features)





# Spectrum update and save


def update_spectrum_heatmap(feat):


    freq = feat.get("freq")


    signal = feat.get("signal")


    try:


        idx = int((freq - FREQ_START) / FREQ_STEP)


        if 0 <= idx < len(freq_bins):


            row = np.full(len(freq_bins), -100)


            row[idx] = signal


            spectrum_history.append(row)


            if len(spectrum_history) > MAX_HISTORY:


                spectrum_history.pop(0)


    except Exception as e:


        print(f"[!] Spectrum update error: {e}")





def save_heatmap_image():


    if not spectrum_history:


        return


    heatmap = np.array(spectrum_history).T


    plt.figure(figsize=(12, 5))


    plt.imshow(heatmap, aspect='auto', cmap='jet', origin='lower',


               extent=[0, MAX_HISTORY, FREQ_START, FREQ_END])


    plt.xlabel("Time")


    plt.ylabel("Frequency (MHz)")


    plt.colorbar(label="Signal Strength (dBm)")


    plt.title("Real-Time Spectrum Analyzer")


    plt.tight_layout()


    os.makedirs(STATIC_DIR, exist_ok=True)
    plt.savefig(os.path.join(STATIC_DIR, "spectrum_heatmap.png"))


    plt.close()





# Packet handler


def packet_handler(pkt):


    feat = extract_features(pkt)


    if feat and feat["mac"] != "N/A":


        is_interfering = ai_detect_interference(feat)


        feat["interfering"] = is_interfering


        interference_log.append(feat)


        with open(SCAN_EXPORT_FILE, "w") as f:
            json.dump(interference_log[-100:], f, indent=2)
        
        # Save bad frequencies
        with open(BAD_FREQUENCIES_FILE, "w") as f:
            json.dump(bad_frequencies, f, indent=2)

        update_spectrum_heatmap(feat)
        save_heatmap_image()





# Spectral scan


def trigger_spectral_scan():


    print("[*] Spectral scan triggered...")


    timestamp = datetime.datetime.now().isoformat()


    # Auto-detect interface or use default
    iface = get_monitor_interface()
    iw_output = os.popen(f"iw dev {iface} survey dump").read()


    noise = -90


    utilization = 0


    active = 1


    busy = 0


    for line in iw_output.splitlines():


        if 'noise:' in line:


            try:


                noise = int(line.split('noise:')[1].split()[0])


            except:


                pass


        if 'channel active time:' in line:


            try:


                active = int(line.split('channel active time:')[1].strip().split()[0])


            except:


                active = 1


        if 'channel busy time:' in line:


            try:


                busy = int(line.split('channel busy time:')[1].strip().split()[0])


                utilization = int((busy / active) * 100) if active else 0


            except:


                pass





    scan_result = {


        "timestamp": timestamp,


        "scan": [


            {"freq": "2.4GHz", "value": 60},


            {"freq": "5GHz", "value": 75},


            {"freq": "Noise", "value": noise},


            {"freq": "Utilization", "value": utilization}


        ]


    }


    with open(SPECTRAL_SCAN_FILE, "w") as f:


        json.dump(scan_result, f, indent=2)


    if os.path.exists(SPECTRAL_HISTORY_FILE):


        with open(SPECTRAL_HISTORY_FILE, "r") as f:


            hist = json.load(f)


    else:


        hist = []


    hist.append(scan_result)


    with open(SPECTRAL_HISTORY_FILE, "w") as f:


        json.dump(hist[-100:], f, indent=2)





# Spectral background





def background_spectral_loop(interval=20):


    def loop():


        while True:


            trigger_spectral_scan()


            time.sleep(interval)


    threading.Thread(target=loop, daemon=True).start()





# Web UI


class WebUI(BaseHTTPRequestHandler):


    def do_GET(self):


        parsed = urlparse(self.path)


        if parsed.path == "/dashboard":


            try:


                with open(SCAN_EXPORT_FILE) as f:


                    data = json.load(f)


            except:


                data = []


            rows = "".join([


                f"<tr><td>{d['mac']}</td><td>{d['signal']}</td><td>{d['freq']}</td><td>{d['interfering']}</td></tr>"


                for d in data[-30:]


            ])


            html = f"""


            <html><head><meta http-equiv='refresh' content='15'>


            <style>table {{ border-collapse: collapse; width: 100%; }} th, td {{ border: 1px solid #ccc; padding: 5px; }}</style></head><body>


            <h2>AI Interference Dashboard</h2>


            <form method='get' action='/spectral'><button>Run Spectral Scan</button></form>


            <form method='get' action='/history'><button>View Spectral History</button></form>
            <form method='get' action='/spectrum'><button>Live Spectrum Graph</button></form>
            <form method='get' action='/badfreq'><button>View Bad Frequencies</button></form>
            <table><tr><th>MAC</th><th>Signal</th><th>Frequency</th><th>Interfering</th></tr>{rows}</table>


            </body></html>


            """


            self.send_response(200)


            self.send_header('Content-type', 'text/html')


            self.end_headers()


            self.wfile.write(html.encode())





        elif parsed.path == "/spectral":


            trigger_spectral_scan()


            with open(SPECTRAL_SCAN_FILE) as f:


                result = json.load(f)


            labels = [s['freq'] for s in result['scan']]


            values = [s['value'] for s in result['scan']]


            label_count = len(labels)


            html = f"""


            <html><head>


            <script src='https://cdn.jsdelivr.net/npm/chart.js'></script></head><body>


            <h2>Spectral Scan - Bar Chart</h2>


            <canvas id='waterfallChart' width='800' height='400'></canvas>


            <script>


            const ctx = document.getElementById('waterfallChart').getContext('2d');


            new Chart(ctx, {{


                type: 'bar',


                data: {{ labels: {labels}, datasets: [{{


                    label: 'Signal Strength / Activity',


                    data: {values},


                    backgroundColor: {json.dumps([f"rgba(0, 123, 255, {(i+1)/label_count})" for i in range(label_count)])},


                    borderWidth: 1


                }}] }},


                options: {{


                    responsive: true,


                    plugins: {{ legend: {{ display: false }} }},


                    scales: {{ y: {{ beginAtZero: true }} }}


                }}


            }});


            </script>


            <br><a href='/dashboard'>Back to Dashboard</a></body></html>


            """


            self.send_response(200)


            self.send_header('Content-type', 'text/html')


            self.end_headers()


            self.wfile.write(html.encode())





        elif parsed.path == "/spectrum":


            html = f"""


            <html><head><meta http-equiv='refresh' content='10'>


            <style>img {{ max-width: 100%; }}</style></head><body>


            <h2>Real-Time Spectrum Analyzer</h2>


            <img src='/static/spectrum_heatmap.png'>


            <br><a href='/dashboard'>Back to Dashboard</a>


            </body></html>


            """


            self.send_response(200)


            self.send_header('Content-type', 'text/html')


            self.end_headers()


            self.wfile.write(html.encode())





        elif parsed.path == "/history":


            try:


                with open(SPECTRAL_HISTORY_FILE) as f:


                    results = json.load(f)


            except:


                results = []


            labels = [entry['timestamp'] for entry in results[-20:]]


            colors = ['blue', 'green', 'red', 'orange']


            datasets = []


            for i, key in enumerate(['2.4GHz', '5GHz', 'Noise', 'Utilization']):


                values = []


                for entry in results[-20:]:


                    if isinstance(entry.get('scan'), list):


                        values.append(next((x['value'] for x in entry['scan'] if x['freq'] == key), 0))


                    else:


                        values.append(0)


                datasets.append({


                    'label': key,


                    'data': values,


                    'borderColor': colors[i],


                    'fill': False,


                    'tension': 0.1


                })


            html = f"""


            <html><head><script src='https://cdn.jsdelivr.net/npm/chart.js'></script></head><body>


            <h2>Spectral History - Time Series</h2>


            <canvas id='historyChart' width='800' height='400'></canvas>


            <script>


            const ctx = document.getElementById('historyChart').getContext('2d');


            new Chart(ctx, {{


                type: 'line',


                data: {{ labels: {labels}, datasets: {json.dumps(datasets)} }},


                options: {{ responsive: true }}


            }});


            </script>


            <br><a href='/dashboard'>Back</a></body></html>


            """


            self.send_response(200)


            self.send_header('Content-type', 'text/html')


            self.end_headers()


            self.wfile.write(html.encode())





# Web server





def release_port(port):


    try:


        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)


        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)


        s.bind(("0.0.0.0", port))


        s.close()


        return True


    except OSError:


        print(f"[!] Port {port} already in use. Trying to kill the process...")


        os.system(f"fuser -k {port}/tcp")


        time.sleep(1)


        return True





def start_web():


    def run():


        release_port(8080)


        try:


            server = HTTPServer(('0.0.0.0', 8080), WebUI)


            http_ready.set()


            print("[+] Web dashboard started at http://localhost:8080/dashboard")


            server.serve_forever()


        except Exception as e:


            print(f"[!] Failed to start web server: {e}")


    threading.Thread(target=run, daemon=True).start()





def start_monitor_scan():


    iface = enable_monitor_mode()


    print(f"[*] Monitor mode enabled on interface: {iface}")


    try:


        conf.use_pcap = True


        while True:


            try:


                sniff(iface=iface, prn=packet_handler, store=0)


            except Exception as e:


                print(f"[!] Sniffing error: {e}, retrying in 10s...")


                time.sleep(10)


                iface = enable_monitor_mode()


    except Exception as e:


        print(f"[!] Monitor loop failed: {e}")





def main():
    # Check if running in unified mode
    unified_mode = os.environ.get('NETWATCH_UNIFIED', '0') == '1'

    # Check if auto monitor mode is disabled
    auto_monitor = os.environ.get('NETWATCH_AUTO_MONITOR', '1') == '1'

    if not unified_mode:
        # Standalone mode - start web server
        print("\n" + "="*60)
        print("📡 WiFi Scanner - Interference Detection System")
        print("="*60)
        start_web()
        http_ready.wait()
        print("[+] WiFi Scanner web dashboard: http://localhost:8080/dashboard")
    else:
        # Unified mode - web server disabled
        http_ready.set()
        print("[*] WiFi Scanner: Running in unified mode (web server disabled)")

    background_spectral_loop(20)

    # Only auto-enable monitor mode if requested
    if auto_monitor:
        print("[*] WiFi Scanner: Starting packet capture...")
        print("[*] WiFi Scanner: Detecting bad frequencies and interference...")
        start_monitor_scan()
    else:
        print("[*] WiFi Scanner: Monitor mode NOT enabled (waiting for manual trigger)")
        print("[*] WiFi Scanner: Use API /api/wifi/monitor/enable to start")





if __name__ == '__main__':
    # Check if running in unified mode
    unified_mode = os.environ.get('NETWATCH_UNIFIED', '0') == '1'
    if unified_mode:
        print("[*] Running in unified mode - web server disabled")
    main()



