#!/usr/bin/env python3
"""
ESP32 Dongle Gateway - Standalone Microservice
Reads data from ESP32 receiver via serial port and publishes to Redis
"""

import os
import sys
import json
import time
import logging
import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import serial
import redis
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configuration
SERIAL_PORT = os.getenv('SERIAL_PORT', '/dev/ttyUSB0')
SERIAL_BAUD = 115200
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_CHANNEL = os.getenv('REDIS_CHANNEL', 'dongle:data')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('dongle-gateway')


class DongleGateway:
    """Main gateway class handling serial parsing and Redis publishing"""

    def __init__(self):
        self.redis_client = None
        self.serial_port = None
        self.setup_redis()

    def setup_redis(self):
        """Initialize Redis client"""
        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"Redis connected: {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            sys.exit(1)

    def connect_serial(self):
        """Open serial port connection to ESP32"""
        try:
            self.serial_port = serial.Serial(
                port=SERIAL_PORT,
                baudrate=SERIAL_BAUD,
                timeout=1
            )
            logger.info(f"Serial port opened: {SERIAL_PORT} @ {SERIAL_BAUD}")
        except Exception as e:
            logger.error(f"Serial port failed: {e}")
            sys.exit(1)

    def parse_json_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse JSON format from receiver"""
        try:
            data = json.loads(line)
            # Validate required fields
            required = ['batchId', 'sessionMs', 'samples']
            if all(k in data for k in required):
                data['receivedTs'] = datetime.now(timezone.utc).isoformat()
                return data
            else:
                logger.warning(f"Incomplete JSON data: {data}")
                return None
        except json.JSONDecodeError:
            return None
        except Exception as e:
            logger.error(f"JSON parse error: {e}")
            return None

    def parse_fenced_block(self, lines: list) -> Optional[Dict[str, Any]]:
        """Parse fenced block format (legacy)"""
        try:
            data = {}

            for line in lines:
                line = line.strip()

                # Line 1: Batch ID
                if line.startswith('Batch:'):
                    m = re.search(r'Batch:\s*([A-F0-9]+)', line)
                    if m:
                        data['batchId'] = m.group(1)

                # Line 2: Session and samples
                elif 'Session:' in line:
                    m = re.search(r'Session:\s*(\d+)\s*ms.*Samples:\s*(\d+)', line)
                    if m:
                        data['sessionMs'] = int(m.group(1))
                        data['samples'] = int(m.group(2))

                # Line 3: Timestamp
                elif 'Timestamp:' in line:
                    m = re.search(r'(\d{8})\s+(\d{6})\.(\d{3})', line)
                    if m:
                        data['dateYMD'] = int(m.group(1))
                        data['timeHMS'] = int(m.group(2))
                        data['msec'] = int(m.group(3))

                # GPS data
                elif 'GPS:' in line or 'Lat:' in line:
                    # GPS: Lat=33.888630 Lon=35.495480 Alt=79.20 Fix=1 Sats=7
                    m = re.search(r'Lat=([-\d.]+)\s+Lon=([-\d.]+)\s+Alt=([-\d.]+)\s+Fix=(\d+)\s+Sats=(\d+)', line)
                    if m:
                        data['lat'] = float(m.group(1))
                        data['lon'] = float(m.group(2))
                        data['alt'] = float(m.group(3))
                        data['gpsFix'] = int(m.group(4))
                        data['sats'] = int(m.group(5))

                # Accelerometer
                elif 'Accel' in line:
                    m = re.search(r'X:\s*([-\d.]+)\s+Y:\s*([-\d.]+)\s+Z:\s*([-\d.]+)', line)
                    if m:
                        data['ax'] = float(m.group(1))
                        data['ay'] = float(m.group(2))
                        data['az'] = float(m.group(3))

                # Gyroscope
                elif 'Gyro' in line:
                    m = re.search(r'X:\s*([-\d.]+)\s+Y:\s*([-\d.]+)\s+Z:\s*([-\d.]+)', line)
                    if m:
                        data['gx'] = float(m.group(1))
                        data['gy'] = float(m.group(2))
                        data['gz'] = float(m.group(3))

                # Temperature
                elif 'Temp:' in line:
                    m = re.search(r'Temp:\s*([-\d.]+)', line)
                    if m:
                        data['tempC'] = float(m.group(1))

            # Validate required fields
            required = ['batchId', 'sessionMs', 'samples']
            if all(k in data for k in required):
                data['receivedTs'] = datetime.now(timezone.utc).isoformat()
                return data
            else:
                logger.warning(f"Incomplete fenced block data: {data}")
                return None

        except Exception as e:
            logger.error(f"Fenced block parse error: {e}")
            return None

    def publish_to_redis(self, data: Dict[str, Any]) -> bool:
        """Publish dongle data to Redis pub/sub channel"""
        try:
            message = json.dumps(data)
            self.redis_client.publish(REDIS_CHANNEL, message)
            logger.info(f"Published to Redis: {data['batchId']} -> {REDIS_CHANNEL}")
            return True
        except Exception as e:
            logger.error(f"Redis publish failed: {e}")
            return False

    def run(self):
        """Main event loop"""
        self.connect_serial()
        logger.info("Gateway started, listening for dongle data...")

        buffer = []
        in_fenced_block = False

        try:
            while True:
                if self.serial_port.in_waiting:
                    try:
                        line = self.serial_port.readline().decode('utf-8', errors='ignore').strip()

                        if not line:
                            continue

                        logger.debug(f"Serial: {line}")

                        # Try JSON first
                        if line.startswith('{'):
                            data = self.parse_json_line(line)
                            if data:
                                self.publish_to_redis(data)
                                continue

                        # Handle fenced block format
                        if line == '---':
                            if in_fenced_block:
                                # End of block - parse it
                                data = self.parse_fenced_block(buffer)
                                if data:
                                    self.publish_to_redis(data)
                                buffer = []
                                in_fenced_block = False
                            else:
                                # Start of block
                                in_fenced_block = True
                                buffer = []
                        elif in_fenced_block:
                            buffer.append(line)

                    except Exception as e:
                        logger.error(f"Parse error: {e}")
                        buffer = []
                        in_fenced_block = False

                else:
                    time.sleep(0.01)  # Small delay to prevent CPU spinning

        except KeyboardInterrupt:
            logger.info("Shutting down...")
        except Exception as e:
            logger.error(f"Fatal error: {e}")
        finally:
            if self.serial_port and self.serial_port.is_open:
                self.serial_port.close()
            if self.redis_client:
                self.redis_client.close()
            logger.info("Gateway stopped")


def main():
    """Entry point"""
    logger.info("ESP32 Dongle Gateway v1.0")
    logger.info(f"Serial: {SERIAL_PORT} @ {SERIAL_BAUD}")
    logger.info(f"Redis: {REDIS_HOST}:{REDIS_PORT}")
    logger.info(f"Channel: {REDIS_CHANNEL}")

    gateway = DongleGateway()
    gateway.run()


if __name__ == '__main__':
    main()
