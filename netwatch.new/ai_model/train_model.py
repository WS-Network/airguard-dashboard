import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Get script directory for relative paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
INPUT_FILE = os.path.join(BASE_DIR, "logs", "wifi_log.csv")

# Save to organized models directory
MODELS_DIR = os.path.join(BASE_DIR, "output", "models")
os.makedirs(MODELS_DIR, exist_ok=True)
MODEL_OUT = os.path.join(MODELS_DIR, "wifi_rf_model.joblib")

# Load data
try:
    df = pd.read_csv(INPUT_FILE)
except FileNotFoundError:
    print(f"[!] File {INPUT_FILE} not found.")
    exit()

# Basic validation
if df.empty or not all(col in df.columns for col in ["Source MAC", "RSSI"]):
    print("[!] Invalid or incomplete CSV file.")
    exit()

# Encode MAC address (source MAC)
le = LabelEncoder()
df["MAC_encoded"] = le.fit_transform(df["Source MAC"])

# Simulate Channel as a dummy value (since it's missing)
df["Channel"] = 1  # Or assign random/fixed values if needed

# Select features
X = df[["MAC_encoded", "RSSI", "Channel"]]

# Train model
print("[*] Training Isolation Forest model...")
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(X)

# Save model
joblib.dump(model, MODEL_OUT)
print(f"[✓] Model saved to {MODEL_OUT}")
print(f"[✓] Model will be automatically loaded by WifiScanner from output/models/")
