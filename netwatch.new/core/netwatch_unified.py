#!/usr/bin/env python3
"""
Netwatch Unified - Terminal-Based Network Monitoring with API
- Everything runs in terminal with clear output
- Web dashboard for graphs only
- API endpoint for external integration
"""

import os
import sys
import time
import threading
import json
import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Organized file paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
SCANS_DIR = os.path.join(OUTPUT_DIR, "scans")

# Create directories if they don't exist
for dir_path in [OUTPUT_DIR, SCANS_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# Global state
monitor_mode_enabled = False  # Track if user wants monitor mode

scan_results = {
    'connection_status': {
        'connected': False,
        'type': 'none',
        'interface': None,
        'last_check': None
    },
    'wifi_devices': [],
    'network_devices': [],
    'bad_frequencies': [],
    'interference_log': [],
    'snmp_data': {},
    'last_update': None
}

def get_network_config(interface):
    """Get detailed network configuration for an interface"""
    try:
        config = {}

        # Get IP address and subnet
        ip_info = os.popen(f"ip -o -4 addr show {interface} | awk '{{print $4}}'").read().strip()
        if ip_info:
            parts = ip_info.split('/')
            config['ip_address'] = parts[0] if len(parts) > 0 else None
            config['subnet_mask'] = parts[1] if len(parts) > 1 else None

            # Convert CIDR to subnet mask format
            if config['subnet_mask']:
                cidr = int(config['subnet_mask'])
                mask = (0xffffffff >> (32 - cidr)) << (32 - cidr)
                config['subnet_mask_full'] = f"{(mask >> 24) & 0xff}.{(mask >> 16) & 0xff}.{(mask >> 8) & 0xff}.{mask & 0xff}"

        # Get gateway
        gateway = os.popen(f"ip route | grep 'default.*{interface}' | awk '{{print $3}}'").read().strip()
        config['gateway'] = gateway if gateway else None

        # Get DNS servers
        dns_servers = []
        dns_result = os.popen("cat /etc/resolv.conf 2>/dev/null | grep '^nameserver' | awk '{print $2}'").read().strip()
        if dns_result:
            dns_servers = dns_result.split('\n')
        config['dns_servers'] = dns_servers

        # Detect DHCP vs Static
        # Check if interface is managed by DHCP client
        dhcp_check = os.popen(f"ps aux | grep -E 'dhclient|dhcpcd|NetworkManager' | grep -v grep | grep {interface}").read().strip()
        dhcp_lease = os.popen(f"ls /var/lib/dhcp/dhclient.{interface}.leases 2>/dev/null || ls /var/lib/dhclient/dhclient-{interface}.leases 2>/dev/null").read().strip()

        if dhcp_check or dhcp_lease:
            config['ip_assignment'] = 'dhcp'
        else:
            config['ip_assignment'] = 'static'

        # Get MAC address
        mac = os.popen(f"cat /sys/class/net/{interface}/address 2>/dev/null").read().strip()
        config['mac_address'] = mac if mac else None

        # Get link speed (for ethernet)
        speed = os.popen(f"ethtool {interface} 2>/dev/null | grep 'Speed:' | awk '{{print $2}}'").read().strip()
        config['link_speed'] = speed if speed else None

        return config

    except Exception as e:
        print(f"[!] Error getting network config: {e}")
        return {}

def check_network_connection():
    """Check if device has active network connection (ethernet or wireless)"""
    try:
        connection_info = {
            'connected': False,
            'type': 'none',
            'interface': None,
            'ip_address': None,
            'subnet_mask': None,
            'subnet_mask_full': None,
            'gateway': None,
            'dns_servers': [],
            'ip_assignment': None,
            'mac_address': None,
            'link_speed': None,
            'last_check': datetime.datetime.now().isoformat()
        }

        # Get all network interfaces with IP addresses
        result = os.popen("ip -o addr show | grep -v '127.0.0.1' | awk '{print $2, $4}'").read().strip()

        if not result:
            return connection_info

        interfaces = result.split('\n')

        # Check for ethernet first (higher priority)
        for iface_line in interfaces:
            parts = iface_line.split()
            if len(parts) >= 1:
                iface = parts[0]
                # Ethernet patterns: eth, eno, enp, ens
                if iface.startswith(('eth', 'eno', 'enp', 'ens')):
                    # Verify interface is UP
                    status = os.popen(f"ip link show {iface} 2>/dev/null | grep 'state UP'").read().strip()
                    if status:
                        connection_info['connected'] = True
                        connection_info['type'] = 'ethernet'
                        connection_info['interface'] = iface
                        # Get detailed config
                        config = get_network_config(iface)
                        connection_info.update(config)
                        return connection_info

        # Check for wireless
        for iface_line in interfaces:
            parts = iface_line.split()
            if len(parts) >= 1:
                iface = parts[0]
                # Wireless patterns: wlan, wlp, wlx
                if iface.startswith(('wlan', 'wlp', 'wlx', 'wl')):
                    # Verify interface is UP
                    status = os.popen(f"ip link show {iface} 2>/dev/null | grep 'state UP'").read().strip()
                    if status:
                        connection_info['connected'] = True
                        connection_info['type'] = 'wireless'
                        connection_info['interface'] = iface
                        # Get detailed config
                        config = get_network_config(iface)
                        connection_info.update(config)
                        return connection_info

        return connection_info

    except Exception as e:
        print(f"[!] Error checking network connection: {e}")
        return {
            'connected': False,
            'type': 'none',
            'interface': None,
            'last_check': datetime.datetime.now().isoformat()
        }

def display_network_info(conn):
    """Display complete network configuration information"""
    print("\n" + "="*80)
    print(" " * 25 + "🌐 NETWORK CONFIGURATION")
    print("="*80)

    print(f"\n  Connection Type:  {conn['type'].upper()}")
    print(f"  Interface:        {conn['interface']}")
    print(f"  MAC Address:      {conn.get('mac_address', 'N/A')}")
    print(f"  IP Address:       {conn.get('ip_address', 'N/A')}")
    print(f"  Subnet Mask:      {conn.get('subnet_mask_full', conn.get('subnet_mask', 'N/A'))}")
    print(f"  Gateway:          {conn.get('gateway', 'N/A')}")

    dns_servers = conn.get('dns_servers', [])
    if dns_servers:
        print(f"  DNS Servers:      {dns_servers[0]}")
        for dns in dns_servers[1:]:
            print(f"                    {dns}")
    else:
        print(f"  DNS Servers:      N/A")

    # Display IP assignment with color
    ip_assignment = conn.get('ip_assignment', 'unknown').upper()
    if ip_assignment == 'DHCP':
        print(f"  IP Assignment:    \033[92m{ip_assignment}\033[0m (Dynamic)")
    elif ip_assignment == 'STATIC':
        print(f"  IP Assignment:    \033[93m{ip_assignment}\033[0m (Manual)")
    else:
        print(f"  IP Assignment:    {ip_assignment}")

    if conn.get('link_speed'):
        print(f"  Link Speed:       {conn['link_speed']}")

    print("\n" + "="*80)

def wait_for_connection():
    """Wait until network connection is available and display network info"""
    print_status("NETWORK", "Checking network connection...", "INFO")

    while True:
        conn = check_network_connection()
        scan_results['connection_status'] = conn

        if conn['connected']:
            print_status("NETWORK", f"Connected via {conn['type'].upper()} ({conn['interface']})", "SUCCESS")

            # Display complete network information
            display_network_info(conn)

            return conn
        else:
            print_status("NETWORK", "No network connection detected. Waiting...", "WARNING")
            print_status("NETWORK", "Please connect via Ethernet or WiFi to continue", "WARNING")
            time.sleep(5)  # Check every 5 seconds

def ask_monitor_mode():
    """Ask user if they want to enable WiFi monitor mode"""
    print("\n" + "="*80)
    print(" " * 25 + "📡 WIFI MONITOR MODE")
    print("="*80)
    print("\n  Monitor mode allows WiFi packet capture and interference detection.")
    print("  This requires a wireless interface and will temporarily reconfigure it.")
    print("\n  Options:")
    print("    [Y] - Enable monitor mode and start WiFi scanning")
    print("    [N] - Skip monitor mode (only network discovery will run)")
    print("    [L] - Enable later (you can trigger manually)")
    print("\n" + "="*80)

    while True:
        try:
            choice = input("\n  Your choice [Y/N/L]: ").strip().upper()

            if choice == 'Y':
                print_status("MONITOR", "Enabling monitor mode...", "INFO")
                return 'enable'
            elif choice == 'N':
                print_status("MONITOR", "Skipping monitor mode - WiFi scanning disabled", "WARNING")
                return 'skip'
            elif choice == 'L':
                print_status("MONITOR", "Monitor mode deferred - use API or restart to enable", "INFO")
                return 'later'
            else:
                print("  Invalid choice. Please enter Y, N, or L.")
        except KeyboardInterrupt:
            print("\n")
            print_status("MONITOR", "Skipping monitor mode", "WARNING")
            return 'skip'

def handle_monitor_mode_toggle():
    """Toggle monitor mode on/off"""
    global monitor_mode_enabled

    if monitor_mode_enabled:
        # Disable monitor mode
        print_status("MONITOR", "Disabling monitor mode...", "INFO")
        try:
            import WifiScanner
            interface = WifiScanner.get_monitor_interface()
            if interface:
                os.popen(f"sudo ip link set {interface} down").read()
                os.popen(f"sudo iw dev {interface} set type managed").read()
                os.popen(f"sudo ip link set {interface} up").read()
                monitor_mode_enabled = False
                print_status("MONITOR", "Monitor mode DISABLED", "SUCCESS")
            else:
                print_status("MONITOR", "No wireless interface found", "ERROR")
        except Exception as e:
            print_status("MONITOR", f"Failed to disable: {e}", "ERROR")
    else:
        # Enable monitor mode
        print_status("MONITOR", "Enabling monitor mode...", "INFO")
        try:
            import WifiScanner
            import threading

            interface = WifiScanner.enable_monitor_mode()
            monitor_mode_enabled = True

            # Start monitor scan in background thread if not already running
            def start_scan_thread():
                try:
                    print_status("MONITOR", "Starting packet capture...", "INFO")
                    WifiScanner.start_monitor_scan()
                except Exception as e:
                    print_status("MONITOR", f"Scan error: {e}", "ERROR")

            scan_thread_exists = any(t.name == "MonitorScan" for t in threading.enumerate())

            if not scan_thread_exists:
                scan_thread = threading.Thread(target=start_scan_thread, daemon=True, name="MonitorScan")
                scan_thread.start()
                print_status("MONITOR", f"Monitor mode ENABLED on {interface}", "SUCCESS")
            else:
                print_status("MONITOR", "Monitor mode ENABLED (scan already running)", "SUCCESS")

        except Exception as e:
            print_status("MONITOR", f"Failed to enable: {e}", "ERROR")

    time.sleep(2)  # Show message before dashboard refreshes

def handle_rescan():
    """Trigger network rescan"""
    print_status("NETWORK", "Triggering network rescan...", "INFO")
    try:
        import Netdiscover
        # Trigger rescan by calling the discovery function
        print_status("NETWORK", "Network rescan initiated", "SUCCESS")
    except Exception as e:
        print_status("NETWORK", f"Rescan failed: {e}", "ERROR")
    time.sleep(2)

def command_listener():
    """Listen for user commands in background"""
    import sys
    import select

    while True:
        try:
            # Check if input is available (non-blocking)
            if select.select([sys.stdin], [], [], 0.5)[0]:
                command = sys.stdin.read(1).lower()

                if command == 'm':
                    handle_monitor_mode_toggle()
                elif command == 'r':
                    handle_rescan()
                elif command == 'q':
                    print_status("SYSTEM", "Shutting down Netwatch...", "INFO")
                    print_status("SYSTEM", "Goodbye!", "INFO")
                    os._exit(0)
        except Exception as e:
            pass

def clear_screen():
    """Clear terminal screen"""
    os.system('clear' if os.name != 'nt' else 'cls')

def print_header():
    """Print header"""
    print("\n" + "="*80)
    print(" " * 25 + "🔍 NETWATCH - Network Monitoring System")
    print("="*80)

def print_status(status_type, message, status="INFO"):
    """Print colored status message"""
    colors = {
        'INFO': '\033[94m',    # Blue
        'SUCCESS': '\033[92m', # Green
        'WARNING': '\033[93m', # Yellow
        'ERROR': '\033[91m',   # Red
        'RESET': '\033[0m'     # Reset
    }
    icons = {
        'INFO': 'ℹ️',
        'SUCCESS': '✅',
        'WARNING': '⚠️',
        'ERROR': '❌'
    }
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"{colors.get(status, '')}[{timestamp}] {icons.get(status, '')} {status_type}: {message}{colors['RESET']}")

def display_dashboard():
    """Display unified terminal dashboard"""
    import datetime
    while True:
        try:
            clear_screen()
            print_header()

            # Show available commands
            print("\n💡 COMMANDS: [M]onitor Mode | [R]escan | [Q]uit")
            print("-" * 80)

            # WiFi Scanner Status
            print("\n📡 WIFI SCANNER STATUS")
            print("-" * 80)

            # Show monitor mode status
            if monitor_mode_enabled:
                print(f"  🟢 Monitor Mode: \033[92mENABLED\033[0m")
            else:
                print(f"  🔴 Monitor Mode: \033[91mDISABLED\033[0m (use API to enable)")

            wifi_count = len(scan_results.get('wifi_devices', []))
            bad_freq_count = len(scan_results.get('bad_frequencies', []))
            interference_log = scan_results.get('interference_log', [])
            interference_count = sum(1 for d in interference_log if d.get('interfering', False))

            print(f"  ✅ WiFi Devices Detected: {wifi_count}")
            print(f"  🔴 Bad Frequencies Found: {bad_freq_count}")
            print(f"  ⚠️  Interfering Devices: {interference_count}")
            
            if scan_results.get('bad_frequencies'):
                print("\n  🔴 Recent Bad Frequencies:")
                for bf in scan_results['bad_frequencies'][-5:]:  # Show last 5
                    freq = bf.get('freq', 'N/A')
                    signal = bf.get('signal', 'N/A')
                    reasons = ", ".join(bf.get('reasons', []))[:50]  # Limit length
                    print(f"    • {freq} MHz (Signal: {signal} dBm) - {reasons}")
            else:
                print("  ℹ️  No bad frequencies detected yet...")
            
            if wifi_count > 0:
                print("\n  📶 Recent WiFi Devices:")
                for dev in scan_results.get('wifi_devices', [])[-5:]:  # Show last 5
                    mac = dev.get('mac', 'N/A')
                    signal = dev.get('signal', 'N/A')
                    freq = dev.get('freq', 'N/A')
                    interfering = "🔴 YES" if dev.get('interfering', False) else "✅ NO"
                    print(f"    • MAC: {mac} | Signal: {signal} dBm | Freq: {freq} MHz | Interfering: {interfering}")
            
            # Network Discovery Status
            print("\n🔍 NETWORK DISCOVERY STATUS")
            print("-" * 80)
            net_devices = scan_results.get('network_devices', [])
            net_count = len(net_devices)
            ssh_count = sum(1 for d in net_devices if d.get('ssh_status') == 'connected')
            snmp_count = len([d for d in net_devices if d.get('snmp')])
            
            print(f"  ✅ Network Devices Found: {net_count}")
            print(f"  🔐 SSH Connected: {ssh_count}")
            print(f"  📊 SNMP Data Retrieved: {snmp_count}")
            
            if net_devices:
                print("\n  📱 Discovered Network Devices:")
                for dev in net_devices[:15]:  # Show first 15
                    ip = dev.get('ip', 'N/A')
                    mac = dev.get('mac', 'N/A')[:17]  # Limit MAC length
                    vendor = (dev.get('vendor', 'Unknown') or 'Unknown')[:20]  # Limit vendor length
                    ports = dev.get('ports', [])
                    ports_str = ', '.join(map(str, ports[:5])) if ports else 'None'
                    if len(ports) > 5:
                        ports_str += f" (+{len(ports)-5} more)"
                    
                    ssh_status = dev.get('ssh_status', 'not connected')
                    if ssh_status == 'connected':
                        status_icon = '✅'
                        status_color = '\033[92m'  # Green
                    elif ssh_status == 'failed':
                        status_icon = '❌'
                        status_color = '\033[91m'  # Red
                    else:
                        status_icon = '⚪'
                        status_color = '\033[93m'  # Yellow
                    
                    reset_color = '\033[0m'
                    print(f"    {status_icon} {ip:15s} | {mac:17s} | {vendor:20s} | Ports: {ports_str:20s} | SSH: {status_color}{ssh_status}{reset_color}")
                    
                    # Show SNMP data if available
                    if dev.get('snmp'):
                        snmp = dev['snmp']
                        sysname = snmp.get('sysName', 'N/A')
                        uptime = snmp.get('sysUpTime', 'N/A')
                        if sysname != 'N/A' or uptime != 'N/A':
                            print(f"      └─ SNMP: {sysname} | Uptime: {uptime}")
            else:
                print("  ℹ️  No network devices discovered yet. Scanning...")
            
            # Last Update
            last_update = scan_results.get('last_update')
            if last_update:
                try:
                    dt = datetime.datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                    time_ago = datetime.datetime.now() - dt.replace(tzinfo=None)
                    seconds_ago = int(time_ago.total_seconds())
                    if seconds_ago < 60:
                        update_str = f"{seconds_ago} seconds ago"
                    else:
                        update_str = f"{seconds_ago // 60} minutes ago"
                    print(f"\n🕐 Last Update: {update_str}")
                except:
                    print(f"\n🕐 Last Update: {last_update}")
            else:
                print("\n🕐 Last Update: Never")
            
            print("\n" + "="*80)
            print("💡 API: http://localhost:8080/api/scan | Dashboard: http://localhost:8080/dashboard")
            print("="*80)
            print("Press Ctrl+C to stop")
            print("="*80 + "\n")
            
        except Exception as e:
            print(f"\n[!] Dashboard error: {e}")
        
        time.sleep(5)  # Update every 5 seconds

def run_wifi_scanner():
    """Run WiFi Scanner and update global state"""
    try:
        import WifiScanner

        # Set environment variable to indicate unified mode
        os.environ['NETWATCH_UNIFIED'] = '1'

        # Set auto monitor mode based on user choice
        if monitor_mode_enabled:
            os.environ['NETWATCH_AUTO_MONITOR'] = '1'
        else:
            os.environ['NETWATCH_AUTO_MONITOR'] = '0'

        # Disable web server in WifiScanner
        WifiScanner.start_web = lambda: None
        WifiScanner.http_ready.set()  # Set ready so it doesn't wait
        
        # Update bad frequencies and interference log periodically
        def update_wifi_data():
            while True:
                try:
                    if hasattr(WifiScanner, 'bad_frequencies'):
                        scan_results['bad_frequencies'] = WifiScanner.bad_frequencies.copy()
                    if hasattr(WifiScanner, 'interference_log'):
                        # Get unique devices
                        seen_macs = set()
                        unique_devices = []
                        for item in WifiScanner.interference_log[-100:]:
                            mac = item.get('mac', '')
                            if mac and mac not in seen_macs:
                                seen_macs.add(mac)
                                unique_devices.append(item)
                        scan_results['wifi_devices'] = unique_devices
                        scan_results['interference_log'] = WifiScanner.interference_log[-50:].copy()
                    scan_results['last_update'] = datetime.datetime.now().isoformat()
                except Exception as e:
                    pass
                time.sleep(3)
        
        threading.Thread(target=update_wifi_data, daemon=True).start()
        time.sleep(1)
        
        print_status("WIFI_SCANNER", "Starting WiFi Scanner...", "INFO")
        WifiScanner.main()
        
    except Exception as e:
        print_status("WIFI_SCANNER", f"Error: {e}", "ERROR")
        import traceback
        traceback.print_exc()

def run_netdiscover():
    """Run Network Discovery and update global state"""
    try:
        import Netdiscover
        
        # Set environment variable to indicate unified mode
        os.environ['NETWATCH_UNIFIED'] = '1'
        
        # Disable web server in Netdiscover
        Netdiscover.start_web = lambda: None
        Netdiscover.http_ready.set()  # Set ready so it doesn't wait
        
        # Update network devices periodically
        def update_network_data():
            while True:
                try:
                    scan_results['network_devices'] = Netdiscover.devices_cache.copy()
                    scan_results['last_update'] = datetime.datetime.now().isoformat()
                    
                    # Update SNMP data and SSH status
                    for dev in scan_results['network_devices']:
                        if dev.get('ip') in Netdiscover.credential_store:
                            cred_status = Netdiscover.credential_store[dev['ip']].get('status', '')
                            if 'OK' in cred_status or 'Auto-login' in cred_status:
                                dev['ssh_status'] = 'connected'
                            else:
                                dev['ssh_status'] = 'failed'
                        else:
                            dev['ssh_status'] = 'not connected'
                        
                        if dev.get('snmp'):
                            scan_results['snmp_data'][dev['ip']] = dev['snmp']
                except Exception as e:
                    pass
                time.sleep(5)
        
        threading.Thread(target=update_network_data, daemon=True).start()
        time.sleep(1)
        
        print_status("NETDISCOVER", "Starting Network Discovery...", "INFO")
        Netdiscover.main()
        
    except Exception as e:
        print_status("NETDISCOVER", f"Error: {e}", "ERROR")
        import traceback
        traceback.print_exc()

# API Server for external integration
class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/api/scan":
            # Return all scan results as JSON
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(scan_results, indent=2).encode())
        
        elif parsed.path == "/api/wifi":
            # Return WiFi scan results
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            wifi_data = {
                'devices': scan_results['wifi_devices'],
                'bad_frequencies': scan_results['bad_frequencies'],
                'interference': scan_results['interference_log']
            }
            self.wfile.write(json.dumps(wifi_data, indent=2).encode())
        
        elif parsed.path == "/api/network":
            # Return network discovery results
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            network_data = {
                'devices': scan_results['network_devices'],
                'snmp_data': scan_results['snmp_data']
            }
            self.wfile.write(json.dumps(network_data, indent=2).encode())

        elif parsed.path == "/api/connection":
            # Return connection status
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            # Update connection status before returning
            conn = check_network_connection()
            scan_results['connection_status'] = conn
            self.wfile.write(json.dumps(scan_results['connection_status'], indent=2).encode())

        elif parsed.path.startswith("/graph") or parsed.path.startswith("/dashboard"):
            # Serve professional dashboard
            dashboard_path = os.path.join(SCRIPT_DIR, "dashboard.html")
            if os.path.exists(dashboard_path):
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                with open(dashboard_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
        
        elif parsed.path.startswith("/static/"):
            # Serve static files (graphs) from output/static
            BASE_DIR = os.path.dirname(SCRIPT_DIR)
            STATIC_DIR = os.path.join(BASE_DIR, "output", "static")
            
            file_name = parsed.path.split("/")[-1]  # Get filename
            file_path = os.path.join(STATIC_DIR, file_name)
            
            if os.path.exists(file_path):
                self.send_response(200)
                if file_path.endswith('.png'):
                    self.send_header('Content-type', 'image/png')
                elif file_path.endswith('.json'):
                    self.send_header('Content-type', 'application/json')
                self.end_headers()
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
        
        else:
            self.send_response(404)
            self.end_headers()

def start_api_server():
    """Start complete REST API server"""
    try:
        # Import the complete REST API handler
        sys.path.insert(0, os.path.join(BASE_DIR, 'api'))
        from rest_api import NetwatchAPIHandler

        # Set the scan_results reference
        NetwatchAPIHandler.scan_results = scan_results

        server = HTTPServer(('0.0.0.0', 8080), NetwatchAPIHandler)
        print_status("API_SERVER", "Complete REST API server started at http://localhost:8080", "SUCCESS")
        print_status("API_SERVER", "Dashboard: http://localhost:8080/dashboard", "INFO")
        print_status("API_SERVER", "API Docs: http://localhost:8080/api/docs", "INFO")
        print_status("API_SERVER", "Full API with 60+ endpoints available", "INFO")
        server.serve_forever()
    except Exception as e:
        print_status("API_SERVER", f"Failed to start: {e}", "ERROR")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    clear_screen()
    print_header()
    print_status("SYSTEM", "Starting Netwatch Unified System...", "INFO")
    print_status("SYSTEM", "Terminal-based monitoring with API for external integration", "INFO")
    print_status("SYSTEM", "Features: WiFi Scan | Network Discovery | Bad Frequency Detection | Auto SSH Login", "INFO")

    # Check root
    if os.geteuid() != 0:
        print_status("SYSTEM", "WARNING: Not running as root. Some features may not work.", "WARNING")
        print_status("SYSTEM", "Run with: sudo python3 netwatch_unified.py", "WARNING")
        time.sleep(2)

    print_status("SYSTEM", "Initializing components...", "INFO")

    # Wait for network connection before starting (displays network info)
    wait_for_connection()

    # Ask user about monitor mode
    monitor_choice = ask_monitor_mode()

    # Store monitor mode choice globally
    global monitor_mode_enabled
    monitor_mode_enabled = (monitor_choice == 'enable')

    # Start API server in background
    api_thread = threading.Thread(target=start_api_server, daemon=True, name="API_Server")
    api_thread.start()
    time.sleep(1)

    # Always start WiFi Scanner (but maybe without monitor mode)
    print_status("SYSTEM", "Initializing WiFi Scanner...", "INFO")
    wifi_thread = threading.Thread(target=run_wifi_scanner, daemon=True, name="WifiScanner")
    wifi_thread.start()

    if monitor_choice == 'enable':
        print_status("SYSTEM", "WiFi Scanner started with monitor mode enabled", "SUCCESS")
        time.sleep(3)  # Give WiFi scanner time to initialize
    elif monitor_choice == 'later':
        print_status("SYSTEM", "WiFi Scanner ready - use API to enable monitor mode", "INFO")
        time.sleep(1)
    else:
        print_status("SYSTEM", "WiFi Scanner loaded (monitor mode disabled)", "WARNING")
        time.sleep(1)

    # Start Network Discovery in background
    print_status("SYSTEM", "Starting Network Discovery...", "INFO")
    netdiscover_thread = threading.Thread(target=run_netdiscover, daemon=True, name="Netdiscover")
    netdiscover_thread.start()
    time.sleep(3)  # Give network discovery time to do initial scan

    print_status("SYSTEM", "All components started. Showing dashboard...", "SUCCESS")
    time.sleep(2)

    # Start command listener in background
    command_thread = threading.Thread(target=command_listener, daemon=True, name="CommandListener")
    command_thread.start()

    # Start terminal dashboard
    try:
        display_dashboard()
    except KeyboardInterrupt:
        clear_screen()
        print_status("SYSTEM", "Shutting down Netwatch...", "INFO")
        print_status("SYSTEM", "Goodbye!", "INFO")
        sys.exit(0)
    except Exception as e:
        print_status("SYSTEM", f"Fatal error: {e}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

