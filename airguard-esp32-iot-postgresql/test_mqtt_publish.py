import json
import time
import random
import paho.mqtt.client as mqtt
from datetime import datetime, timezone

# Configuration
MQTT_BROKER = 'localhost'
MQTT_PORT = 1883
MQTT_TOPIC = 'espnow/samples'

def generate_packet():
    batch_id = f"{random.randint(0, 0xFFFFFFFF):08X}"
    return {
        'batchId': batch_id,
        'sessionMs': 10000,
        'samples': 200,
        'dateYMD': int(datetime.now().strftime("%Y%m%d")),
        'timeHMS': int(datetime.now().strftime("%H%M%S")),
        'msec': datetime.now().microsecond // 1000,
        'lat': 33.888630,
        'lon': 35.495480,
        'alt': 79.20,
        'gpsFix': 1,
        'sats': 8,
        'ax': 0.01,
        'ay': 0.02,
        'az': 9.81,
        'gx': 0.0,
        'gy': 0.0,
        'gz': 0.0,
        'tempC': 25.5,
        'receivedTs': datetime.now(timezone.utc).isoformat()
    }

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    if rc == 0:
        packet = generate_packet()
        print(f"Publishing packet: {packet['batchId']}")
        client.publish(MQTT_TOPIC, json.dumps(packet))
        print("Published!")
        client.disconnect()
    else:
        print("Failed to connect")

client = mqtt.Client()
client.on_connect = on_connect

print(f"Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()
except Exception as e:
    print(f"Connection failed: {e}")
