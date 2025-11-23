#!/usr/bin/env python3
"""
Test script for dongle gateway - Simulates serial data without ESP32 hardware
Usage: python test-gateway.py
"""

import json
import time
import redis

# Test data matching ESP32 format
test_data = {
    "batchId": "TESTABCD",
    "sessionMs": 10000,
    "samples": 200,
    "dateYMD": 20251117,
    "timeHMS": 123045,
    "msec": 456,
    "lat": 33.888630,
    "lon": 35.495480,
    "alt": 79.20,
    "gpsFix": 1,
    "sats": 7,
    "ax": 0.15,
    "ay": -0.08,
    "az": 9.82,
    "gx": 0.02,
    "gy": -0.01,
    "gz": 0.00,
    "tempC": 25.3,
    "receivedTs": "2025-11-17T12:30:45.456Z"
}

def main():
    print("🧪 Dongle Gateway Test Script")
    print("Connecting to Redis...")

    try:
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        r.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        print("   Make sure Redis is running: docker-compose up -d redis")
        return

    print(f"\n📡 Publishing test dongle data to channel: dongle:data")
    print(f"   Batch ID: {test_data['batchId']}")

    message = json.dumps(test_data)
    subscribers = r.publish('dongle:data', message)

    print(f"\n✅ Message published!")
    print(f"   {subscribers} subscriber(s) received the message")

    if subscribers == 0:
        print("\n⚠️  No subscribers listening to dongle:data channel")
        print("   Start the backend with: docker-compose up -d backend")
        print("   Or subscribe manually: redis-cli SUBSCRIBE dongle:data")
    else:
        print("\n✅ Backend is listening and should process this data")

    print("\n📦 Published data:")
    print(json.dumps(test_data, indent=2))

if __name__ == '__main__':
    main()
