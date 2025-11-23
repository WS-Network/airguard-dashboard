#!/usr/bin/env python3
"""
Dongle Button Press Simulator
Simulates a button press on the ESP32 sender/dongle by:
1. Generating realistic sensor data
2. Outputting it in the receiver's format
3. Can be piped to the gateway or sent via virtual serial port
"""

import sys
import time
import random
from datetime import datetime

def generate_fake_packet(duration_ms=10000, samples=200):
    """Generate a fake sensor packet with realistic values"""

    # Generate batch ID (random hex)
    batch_id = f"{random.randint(0, 0xFFFFFFFF):08X}"

    # GPS data (example coordinates - modify as needed)
    lat = 33.888630 + random.uniform(-0.001, 0.001)
    lon = 35.495480 + random.uniform(-0.001, 0.001)
    alt = 79.20 + random.uniform(-5, 5)
    gps_fix = 1
    sats = random.randint(5, 10)

    # Current date/time
    now = datetime.now()
    date_ymd = int(now.strftime("%Y%m%d"))
    time_hms = int(now.strftime("%H%M%S"))
    msec = now.microsecond // 1000

    # Accelerometer data (m/s^2) - simulate mostly stable with gravity
    ax = random.uniform(-0.5, 0.5)
    ay = random.uniform(-0.5, 0.5)
    az = 9.8 + random.uniform(-0.3, 0.3)  # ~9.8 m/s^2 gravity

    # Gyroscope data (rad/s) - simulate mostly still
    gx = random.uniform(-0.1, 0.1)
    gy = random.uniform(-0.1, 0.1)
    gz = random.uniform(-0.1, 0.1)

    # Temperature (°C)
    temp_c = 25.0 + random.uniform(-3, 3)

    return {
        'batch_id': batch_id,
        'duration_ms': duration_ms,
        'samples': samples,
        'date_ymd': date_ymd,
        'time_hms': time_hms,
        'msec': msec,
        'lat': lat,
        'lon': lon,
        'alt': alt,
        'gps_fix': gps_fix,
        'sats': sats,
        'ax': ax,
        'ay': ay,
        'az': az,
        'gx': gx,
        'gy': gy,
        'gz': gz,
        'temp_c': temp_c
    }

def format_receiver_output(packet):
    """Format packet data as ESP32 receiver output"""
    output = f"""=== Received Data ===
Batch: 0x{packet['batch_id']} | Duration: {packet['duration_ms']} ms | Samples: {packet['samples']}
GPS Fix: {packet['gps_fix']}, Sats: {packet['sats']} | Date: {packet['date_ymd']:08d} | Time: {packet['time_hms']:06d}.{packet['msec']:03d}
Lat: {packet['lat']:.6f}  Lon: {packet['lon']:.6f}  Alt: {packet['alt']:.2f} m
Accel [m/s^2] X: {packet['ax']:.2f}  Y: {packet['ay']:.2f}  Z: {packet['az']:.2f}
Gyro  [rad/s] X: {packet['gx']:.2f}  Y: {packet['gy']:.2f}  Z: {packet['gz']:.2f}
Temp: {packet['temp_c']:.2f} °C
===================="""
    return output

def simulate_button_press(duration_ms=10000, samples=200, continuous=False, interval=5):
    """
    Simulate a dongle button press

    Args:
        duration_ms: Simulated button press duration
        samples: Number of sensor samples collected
        continuous: If True, keep generating packets
        interval: Seconds between packets (if continuous)
    """
    try:
        while True:
            # Generate and output packet
            packet = generate_fake_packet(duration_ms, samples)
            output = format_receiver_output(packet)

            print(output, flush=True)

            if not continuous:
                break

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n[Simulator] Stopped by user", file=sys.stderr)

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Simulate ESP32 dongle button press',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single button press simulation
  python simulate-dongle-press.py

  # Simulate with custom duration and samples
  python simulate-dongle-press.py --duration 15000 --samples 300

  # Continuous mode - generate packets every 5 seconds
  python simulate-dongle-press.py --continuous --interval 5

  # Pipe to gateway (if gateway is modified to read from stdin)
  python simulate-dongle-press.py | python host/python-gateway/gateway.py

  # Write to file for testing
  python simulate-dongle-press.py > test_data.txt
        """
    )

    parser.add_argument(
        '--duration',
        type=int,
        default=10000,
        help='Simulated button press duration in milliseconds (default: 10000)'
    )

    parser.add_argument(
        '--samples',
        type=int,
        default=200,
        help='Number of sensor samples (default: 200)'
    )

    parser.add_argument(
        '--continuous',
        action='store_true',
        help='Continuously generate packets'
    )

    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Seconds between packets in continuous mode (default: 5)'
    )

    args = parser.parse_args()

    # Validate duration (must be >= 10 seconds for real dongle)
    if args.duration < 10000:
        print(f"Warning: Duration {args.duration}ms is less than 10s minimum", file=sys.stderr)

    print(f"[Simulator] Starting...", file=sys.stderr)
    print(f"[Simulator] Duration: {args.duration}ms, Samples: {args.samples}", file=sys.stderr)
    if args.continuous:
        print(f"[Simulator] Continuous mode: packet every {args.interval}s", file=sys.stderr)
    print(f"[Simulator] Output format: ESP32 receiver serial format", file=sys.stderr)
    print("", file=sys.stderr)

    simulate_button_press(
        duration_ms=args.duration,
        samples=args.samples,
        continuous=args.continuous,
        interval=args.interval
    )

if __name__ == '__main__':
    main()
