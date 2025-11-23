#!/usr/bin/env python3
"""
Direct Data Injector
Simulates dongle button press by injecting data directly into the gateway's
processing pipeline (SQLite, MQTT, Cloud API) without needing serial connection.
"""

import os
import sys
import json
import time
import random
import sqlite3
import logging
from datetime import datetime, timezone
from pathlib import Path

# Add gateway directory to path
sys.path.insert(0, str(Path(__file__).parent / 'host' / 'python-gateway'))

try:
    import paho.mqtt.client as mqtt
    import requests
    from dotenv import load_dotenv
except ImportError:
    print("Error: Required packages not installed. Run:")
    print("  pip install paho-mqtt requests python-dotenv")
    sys.exit(1)

# Load environment from gateway directory
gateway_dir = Path(__file__).parent / 'host' / 'python-gateway'
env_file = gateway_dir / '.env'
if env_file.exists():
    load_dotenv(env_file)

# Configuration
SQLITE_DB = os.getenv('SQLITE_DB', str(gateway_dir / 'airguard.db'))
CLOUD_POST_URL = os.getenv('CLOUD_POST_URL', '')
CLOUD_AUTH_TOKEN = os.getenv('CLOUD_AUTH_TOKEN', '')
MQTT_BROKER = os.getenv('MQTT_BROKER', '127.0.0.1')
MQTT_PORT = int(os.getenv('MQTT_PORT', '1883'))
MQTT_TOPIC = os.getenv('MQTT_TOPIC', 'espnow/samples')
MQTT_USERNAME = os.getenv('MQTT_USERNAME', '')
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', '')
MQTT_QOS = int(os.getenv('MQTT_QOS', '1'))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('data-injector')


def generate_test_data(duration_ms=10000, samples=200):
    """Generate realistic test sensor data"""

    batch_id = f"{random.randint(0, 0xFFFFFFFF):08X}"

    # GPS coordinates (modify as needed)
    lat = 33.888630 + random.uniform(-0.001, 0.001)
    lon = 35.495480 + random.uniform(-0.001, 0.001)
    alt = 79.20 + random.uniform(-5, 5)

    # Current timestamp
    now = datetime.now(timezone.utc)

    data = {
        'batchId': batch_id,
        'sessionMs': duration_ms,
        'samples': samples,
        'dateYMD': int(now.strftime("%Y%m%d")),
        'timeHMS': int(now.strftime("%H%M%S")),
        'msec': now.microsecond // 1000,
        'lat': round(lat, 6),
        'lon': round(lon, 6),
        'alt': round(alt, 2),
        'gpsFix': 1,
        'sats': random.randint(5, 10),
        'ax': round(random.uniform(-0.5, 0.5), 2),
        'ay': round(random.uniform(-0.5, 0.5), 2),
        'az': round(9.8 + random.uniform(-0.3, 0.3), 2),
        'gx': round(random.uniform(-0.1, 0.1), 2),
        'gy': round(random.uniform(-0.1, 0.1), 2),
        'gz': round(random.uniform(-0.1, 0.1), 2),
        'tempC': round(25.0 + random.uniform(-3, 3), 2),
        'receivedTs': now.isoformat()
    }

    return data


def store_to_sqlite(data, db_path):
    """Store data directly to SQLite database"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Ensure table exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT UNIQUE NOT NULL,
                session_ms INTEGER,
                samples INTEGER,
                date_ymd INTEGER,
                time_hms INTEGER,
                msec INTEGER,
                lat REAL,
                lon REAL,
                alt REAL,
                gps_fix INTEGER,
                sats INTEGER,
                ax REAL,
                ay REAL,
                az REAL,
                gx REAL,
                gy REAL,
                gz REAL,
                temp_c REAL,
                received_ts TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            INSERT OR REPLACE INTO samples (
                batch_id, session_ms, samples, date_ymd, time_hms, msec,
                lat, lon, alt, gps_fix, sats,
                ax, ay, az, gx, gy, gz, temp_c, received_ts
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['batchId'],
            data['sessionMs'],
            data['samples'],
            data['dateYMD'],
            data['timeHMS'],
            data['msec'],
            data['lat'],
            data['lon'],
            data['alt'],
            data['gpsFix'],
            data['sats'],
            data['ax'],
            data['ay'],
            data['az'],
            data['gx'],
            data['gy'],
            data['gz'],
            data['tempC'],
            data['receivedTs']
        ))

        conn.commit()
        conn.close()

        logger.info(f"✓ SQLite: Stored batch {data['batchId']} to {db_path}")
        return True

    except Exception as e:
        logger.error(f"✗ SQLite error: {e}")
        return False


def publish_to_mqtt(data):
    """Publish data to MQTT broker"""
    if not MQTT_BROKER:
        logger.info("  MQTT: Not configured, skipping")
        return True

    try:
        client = mqtt.Client(client_id=f"test-injector-{int(time.time())}")

        if MQTT_USERNAME and MQTT_PASSWORD:
            client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

        client.connect(MQTT_BROKER, MQTT_PORT, 60)

        payload = json.dumps(data)
        result = client.publish(MQTT_TOPIC, payload, qos=MQTT_QOS)

        client.disconnect()

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            logger.info(f"✓ MQTT: Published batch {data['batchId']} to {MQTT_BROKER}:{MQTT_PORT}")
            return True
        else:
            logger.error(f"✗ MQTT publish failed: {result.rc}")
            return False

    except Exception as e:
        logger.error(f"✗ MQTT error: {e}")
        return False


def post_to_cloud(data):
    """POST data to cloud REST API"""
    if not CLOUD_POST_URL:
        logger.info("  Cloud API: Not configured, skipping")
        return True

    try:
        headers = {'Content-Type': 'application/json'}
        if CLOUD_AUTH_TOKEN:
            headers['Authorization'] = f'Bearer {CLOUD_AUTH_TOKEN}'

        response = requests.post(
            CLOUD_POST_URL,
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code in (200, 201):
            logger.info(f"✓ Cloud API: Posted batch {data['batchId']} to {CLOUD_POST_URL}")
            return True
        else:
            logger.error(f"✗ Cloud API failed [{response.status_code}]: {response.text}")
            return False

    except Exception as e:
        logger.error(f"✗ Cloud API error: {e}")
        return False


def inject_data(duration_ms=10000, samples=200, targets=['sqlite', 'mqtt', 'cloud']):
    """Inject test data into specified targets"""

    logger.info("=" * 60)
    logger.info("SIMULATING DONGLE BUTTON PRESS")
    logger.info("=" * 60)

    # Generate test data
    data = generate_test_data(duration_ms, samples)

    logger.info(f"Batch ID: 0x{data['batchId']}")
    logger.info(f"Duration: {data['sessionMs']}ms, Samples: {data['samples']}")
    logger.info(f"GPS: ({data['lat']:.6f}, {data['lon']:.6f}), Sats: {data['sats']}")
    logger.info(f"Timestamp: {data['receivedTs']}")
    logger.info("")
    logger.info("Injecting data to:")

    results = {}

    # Store to SQLite
    if 'sqlite' in targets:
        results['sqlite'] = store_to_sqlite(data, SQLITE_DB)

    # Publish to MQTT
    if 'mqtt' in targets:
        results['mqtt'] = publish_to_mqtt(data)

    # POST to Cloud API
    if 'cloud' in targets:
        results['cloud'] = post_to_cloud(data)

    logger.info("")
    logger.info("=" * 60)
    success = all(results.values())
    if success:
        logger.info("✓ SIMULATION SUCCESSFUL - All targets updated")
    else:
        logger.warning("⚠ SIMULATION COMPLETED WITH ERRORS")
    logger.info("=" * 60)

    return success, data


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Inject test data directly into gateway pipeline (SQLite/MQTT/Cloud)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Inject single test packet to all targets
  python inject-test-data.py

  # Inject with custom duration and samples
  python inject-test-data.py --duration 15000 --samples 300

  # Inject only to SQLite
  python inject-test-data.py --targets sqlite

  # Inject to SQLite and MQTT only
  python inject-test-data.py --targets sqlite mqtt

  # Continuous mode - inject every 5 seconds
  python inject-test-data.py --continuous --interval 5

  # Show generated JSON
  python inject-test-data.py --json
        """
    )

    parser.add_argument(
        '--duration',
        type=int,
        default=10000,
        help='Simulated press duration in ms (default: 10000)'
    )

    parser.add_argument(
        '--samples',
        type=int,
        default=200,
        help='Number of samples (default: 200)'
    )

    parser.add_argument(
        '--targets',
        nargs='+',
        choices=['sqlite', 'mqtt', 'cloud'],
        default=['sqlite', 'mqtt', 'cloud'],
        help='Target systems to inject data into (default: all)'
    )

    parser.add_argument(
        '--continuous',
        action='store_true',
        help='Continuously inject data'
    )

    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Seconds between injections in continuous mode (default: 5)'
    )

    parser.add_argument(
        '--json',
        action='store_true',
        help='Print generated JSON and exit'
    )

    args = parser.parse_args()

    # JSON only mode
    if args.json:
        data = generate_test_data(args.duration, args.samples)
        print(json.dumps(data, indent=2))
        return

    # Injection mode
    try:
        count = 0
        while True:
            count += 1

            if args.continuous:
                logger.info(f"\n>>> Injection #{count}")

            success, data = inject_data(
                duration_ms=args.duration,
                samples=args.samples,
                targets=args.targets
            )

            if not args.continuous:
                sys.exit(0 if success else 1)

            time.sleep(args.interval)

    except KeyboardInterrupt:
        logger.info("\n\nStopped by user")
        sys.exit(0)


if __name__ == '__main__':
    main()
