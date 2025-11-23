import time
import threading
import socket
import os
import platform
import re
import json
import csv
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
from concurrent.futures import ThreadPoolExecutor
import random

# Import dependencies with error handling
try:
    import nmap
except ImportError:
    print("[!] ERROR: python-nmap not installed. Install with: pip3 install python-nmap")
    print("[!] Network discovery will not work without this module.")
    nmap = None

try:
    import paramiko
except ImportError:
    print("[!] ERROR: paramiko not installed. Install with: pip3 install paramiko")
    print("[!] SSH login will not work without this module.")
    paramiko = None

try:
    import requests
except ImportError:
    print("[!] WARNING: requests not installed. MAC vendor lookup will not work.")
    requests = None

try:
    from pysnmp.hlapi import *
except ImportError:
    print("[!] WARNING: pysnmp not installed. SNMP queries will use system snmpget command.")
    pysnmp = None

try:
    from tabulate import tabulate
except ImportError:
    tabulate = None

# telnetlib was removed in Python 3.13, not needed for this code

PORT_SCAN_TIMEOUT = 1.0
SSH_RETRY_SECONDS = 15
SSH_RETRY_MAX_ATTEMPTS = 8

credential_store = {}
devices_cache = []
http_ready = threading.Event()

MAC_VENDOR_API = "https://api.macvendors.com/"

mikrotik_oids = {
    "sysDescr": "1.3.6.1.2.1.1.1.0",
    "sysUpTime": "1.3.6.1.2.1.1.3.0",
    "sysName": "1.3.6.1.2.1.1.5.0",
    "cpuLoad": "1.3.6.1.4.1.14988.1.1.3.10.0",
    "freeMemory": "1.3.6.1.4.1.14988.1.1.3.8.0",
    "boardModel": "1.3.6.1.4.1.14988.1.1.7.1.1.0",
    "temperature": "1.3.6.1.4.1.14988.1.1.3.11.0",
    "interfaces": "1.3.6.1.2.1.2.2.1.2",
    "ifInOctets": "1.3.6.1.2.1.2.2.1.10",
    "ifOutOctets": "1.3.6.1.2.1.2.2.1.16"
}

saved_logs = {}

def get_vendor(mac):
    try:
        if mac == 'N/A':
            return "Unknown"
        if requests is None:
            return "Unknown (requests not installed)"
        response = requests.get(MAC_VENDOR_API + mac, timeout=3)
        return response.text if response.status_code == 200 else "Unknown"
    except:
        return "Unknown"

def detect_subnet():
    try:
        iface = os.popen("ip route | grep default").read().split()[4]
        ip_info = os.popen(f"ip addr show {iface} | grep 'inet ' | awk '{{print $2}}'").read().strip()
        if '/' not in ip_info:
            raise ValueError("Invalid subnet format")
        return ip_info
    except Exception:
        print("[!] Failed to auto-detect subnet. Defaulting to 192.168.1.0/24")
        return "192.168.1.0/24"

def scan_network():
    """Scan network for devices - both wired and wireless"""
    if nmap is None:
        print("[!] ERROR: Cannot scan network - python-nmap not installed")
        print("[!] Install with: pip3 install python-nmap")
        return []
    
    subnet = detect_subnet()
    print(f"[*] Scanning network: {subnet}")
    print(f"[*] This will discover both wired (LAN) and wireless devices on the network")
    
    try:
        nm = nmap.PortScanner()
        # Use -sn for ping scan (no port scan), faster discovery
        nm.scan(hosts=subnet, arguments="-sn --max-retries 2 --host-timeout 5s")
        devices = []
        
        for host in nm.all_hosts():
            try:
                mac = nm[host]['addresses'].get('mac', 'N/A')
                vendor = get_vendor(mac) if mac != 'N/A' else 'Unknown'
                devices.append({
                    "ip": host,
                    "mac": mac,
                    "vendor": vendor,
                    "hostname": nm[host].get('hostnames', [{}])[0].get('name', 'N/A') if nm[host].get('hostnames') else 'N/A'
                })
            except Exception as e:
                # Skip devices that cause errors
                continue
        
        if devices:
            print(f"[+] Successfully discovered {len(devices)} devices on network")
        else:
            print("[!] No devices found. This could mean:")
            print("    - Network is not accessible")
            print("    - Firewall is blocking scans")
            print("    - No devices are responding to ping")
            print("    - Wrong subnet detected")
        
        return devices
        
    except Exception as e:
        print(f"[!] Network scan error: {e}")
        import traceback
        traceback.print_exc()
        return []

def scan_ports_on_device(device):
    if nmap is None:
        device["ports"] = []
        device["os"] = "Unknown"
        device["os_accuracy"] = "0%"
        device["ssh_telnet_missing"] = True
        return device
    scanner = nmap.PortScanner()
    try:
        scanner.scan(hosts=device["ip"], arguments="-T4 -F -O")
        device["ports"] = []
        open_ports = []
        for proto in scanner[device["ip"].lower()].all_protocols():
            for port in scanner[device["ip"].lower()][proto].keys():
                open_ports.append(port)
                device["ports"].append(port)
        os_match = scanner[device["ip"].lower()].get("osmatch", [])
        if os_match:
            device["os"] = os_match[0].get("name", "Unknown")
            device["os_accuracy"] = os_match[0].get("accuracy", "0") + "%"
        else:
            device["os"] = "Unknown"
            device["os_accuracy"] = "0%"
        device["ssh_telnet_missing"] = 22 not in open_ports and 23 not in open_ports
    except:
        device["ports"] = []
        device["os"] = "Unknown"
        device["os_accuracy"] = "0%"
        device["ssh_telnet_missing"] = True
    if device["ip"] in saved_logs:
        device["log"] = saved_logs[device["ip"]]
    return device

def scan_ports(devices):
    print("[*] Scanning ports and OS with multithreading...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(scan_ports_on_device, devices))
    for dev in results:
        dev["uptime"] = dev.get("snmp", {}).get("sysUpTime", "")
    
    # Save to organized output directory
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    BASE_DIR = os.path.dirname(SCRIPT_DIR)
    OUTPUT_DIR = os.path.join(BASE_DIR, "output", "scans")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    scan_results_file = os.path.join(OUTPUT_DIR, "scan_results.json")
    with open(scan_results_file, "w") as f:
        json.dump(results, f, indent=2)
    return results

def run_snmpwalk(ip, community="public"):
    result = {}
    for label, oid in mikrotik_oids.items():
        try:
            output = os.popen(f"snmpget -v 2c -c {community} {ip} {oid}").read().strip()
            if " = " in output:
                val = output.split(" = ", 1)[-1].strip()
                val = re.sub(r'^[A-Z]+:\s+', '', val)
                result[label] = val
            else:
                result[label] = "N/A"
        except:
            result[label] = "N/A"
    
    # Save to organized output directory (outside loop)
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    BASE_DIR = os.path.dirname(SCRIPT_DIR)
    OUTPUT_DIR = os.path.join(BASE_DIR, "output", "scans")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    snmp_file = os.path.join(OUTPUT_DIR, f"snmp_data_{ip}.json")
    with open(snmp_file, "w") as f:
        json.dump(result, f, indent=2)
    return result

def determine_os_type(device):
    vendor = device.get("vendor", "").lower()
    os_name = device.get("os", "").lower()
    if "mikrotik" in vendor or "routerboard" in vendor or "mikrotik" in os_name:
        return "mikrotik"
    elif "cisco" in vendor or "cisco" in os_name:
        return "cisco"
    elif "linux" in os_name:
        return "linux"
    else:
        return "unknown"

def try_ssh(device):
    if paramiko is None:
        print("[!] ERROR: Cannot connect via SSH - paramiko not installed")
        if device['ip'] in credential_store:
            credential_store[device['ip']]['status'] = "SSH Failed - paramiko not installed"
        return
    
    try:
        creds = credential_store.get(device['ip'])
        if not creds:
            print(f"[-] No credentials found for {device['ip']}")
            return
        
        print(f"[*] Attempting SSH connection to {device['ip']}...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Try SSH port 22 first, then telnet port 23
        ssh_port = 22
        if 22 not in device.get('ports', []) and 23 in device.get('ports', []):
            ssh_port = 23
            print(f"[*] SSH port 22 not open, trying telnet port 23...")
        
        client.connect(device['ip'], port=ssh_port, username=creds['username'], 
                      password=creds['password'], timeout=10, allow_agent=False, look_for_keys=False)
        print(f"[+] SSH successful: {device['ip']}:{ssh_port}")
        
        os_type = determine_os_type(device)
        print(f"[*] Detected OS type: {os_type}")

        export_output = ""
        if os_type == "mikrotik":
            print(f"[*] Enabling SNMP on MikroTik device {device['ip']}...")
            try:
                stdin, stdout, stderr = client.exec_command("/snmp set enabled=yes")
                time.sleep(2)  # Wait for SNMP to enable
                stdout.channel.recv_exit_status()
                print(f"[+] SNMP enabled on {device['ip']}")
            except Exception as e:
                print(f"[!] Warning: Could not enable SNMP: {e}")
            
            print(f"[*] Exporting configuration from {device['ip']}...")
            try:
                stdin, stdout, stderr = client.exec_command("export")
                export_chunks = []
                timeout_time = time.time() + 15
                while time.time() < timeout_time:
                    if stdout.channel.recv_ready():
                        chunk = stdout.channel.recv(4096).decode(errors="ignore")
                        if chunk:
                            export_chunks.append(chunk)
                    if stdout.channel.exit_status_ready():
                        break
                    time.sleep(0.3)
                export_output = ''.join(export_chunks).strip()
                if export_output:
                    print(f"[+] Configuration exported from {device['ip']} ({len(export_output)} chars)")
                    # Save to organized output directory
                    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
                    BASE_DIR = os.path.dirname(SCRIPT_DIR)
                    EXPORTS_DIR = os.path.join(BASE_DIR, "output", "exports")
                    os.makedirs(EXPORTS_DIR, exist_ok=True)
                    
                    export_file = os.path.join(EXPORTS_DIR, f"export_output_{device['ip']}.txt")
                    with open(export_file, "w") as f:
                        f.write(export_output)
                    device['export'] = export_output
            except Exception as e:
                print(f"[!] Warning: Could not export configuration: {e}")

        # Get SNMP data
        print(f"[*] Retrieving SNMP data from {device['ip']}...")
        output_data = run_snmpwalk(device['ip'])
        device['snmp'] = output_data
        
        # Count successful SNMP reads
        snmp_success = sum(1 for v in output_data.values() if v and v != "N/A")
        print(f"[+] Retrieved {snmp_success}/{len(output_data)} SNMP values from {device['ip']}")

        # Update device in cache
        for i, dev in enumerate(devices_cache):
            if dev['ip'] == device['ip']:
                devices_cache[i] = device
                break

        # Save to organized output directory
        SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
        BASE_DIR = os.path.dirname(SCRIPT_DIR)
        OUTPUT_DIR = os.path.join(BASE_DIR, "output", "scans")
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Save SNMP data
        snmp_file = os.path.join(OUTPUT_DIR, f"snmp_data_{device['ip']}.json")
        with open(snmp_file, "w") as f:
            json.dump({"snmp": output_data, "export": export_output}, f, indent=2)

        creds['status'] = "SSH OK"
        print(f"[✓] Successfully logged into {device['ip']} and retrieved SNMP data")
        client.close()

    except paramiko.AuthenticationException:
        error_msg = f"Authentication failed for {device['ip']}"
        print(f"[-] {error_msg}")
        if device['ip'] in credential_store:
            credential_store[device['ip']]['status'] = "SSH Failed - Authentication Error"
    except paramiko.SSHException as e:
        error_msg = f"SSH connection error for {device['ip']}: {e}"
        print(f"[-] {error_msg}")
        if device['ip'] in credential_store:
            credential_store[device['ip']]['status'] = "SSH Failed - Connection Error"
    except Exception as e:
        error_msg = f"SSH failed on {device['ip']}: {e}"
        print(f"[-] {error_msg}")
        if device['ip'] in credential_store:
            credential_store[device['ip']]['status'] = f"SSH Failed - {str(e)[:50]}"

# Web interface

def start_web():
    class WebUI(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urlparse(self.path)
            ip = parse_qs(parsed.query).get('ip', [None])[0]

            if parsed.path == "/dashboard":
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()

                rows = ""
                snmp_sections = ""
                for dev in devices_cache:
                    snmp_data = dev.get("snmp", {})
                    snmp_uptime = snmp_data.get("sysUpTime", "N/A")
                    
                    # Determine login button status
                    cred_status = credential_store.get(dev['ip'], {}).get('status', '')
                    if cred_status == "SSH OK":
                        btn = f"<span style='color: green;'>✓ Logged In</span>"
                    elif cred_status == "SSH Failed":
                        btn = f"<a href='/login?ip={dev['ip']}' style='color: red;'>✗ Retry Login</a>"
                    elif 22 in dev.get('ports', []) or 23 in dev.get('ports', []):
                        btn = f"<a href='/login?ip={dev['ip']}' style='color: blue;'>🔐 Login</a>"
                    else:
                        btn = f"<span style='color: gray;'>No SSH/Telnet</span>"
                    
                    rows += f"<tr><td>{dev['ip']}</td><td>{dev['mac']}</td><td>{dev.get('vendor', 'Unknown')}</td><td>{dev.get('os', 'Unknown')}</td><td>{','.join(map(str, dev.get('ports', []))) if dev.get('ports') else 'None'}</td><td>{snmp_uptime}</td><td>{btn}</td></tr>"
                    
                    # Display SNMP data prominently if available
                    if snmp_data and any(v != "N/A" for v in snmp_data.values()):
                        snmp_html = f"""
                        <div style='border: 2px solid #4CAF50; padding: 15px; margin: 10px 0; background-color: #f0fff0;'>
                            <h3 style='color: #2E7D32; margin-top: 0;'>📊 SNMP Data for {dev['ip']}</h3>
                            <table style='width: 100%; border-collapse: collapse;'>
                        """
                        for key, value in snmp_data.items():
                            if value and value != "N/A":
                                snmp_html += f"<tr><td style='padding: 5px; font-weight: bold;'>{key}:</td><td style='padding: 5px;'>{value}</td></tr>"
                        snmp_html += "</table>"
                        
                        # Add export data if available
                        if dev.get('export'):
                            snmp_html += f"""
                            <details style='margin-top: 10px;'>
                                <summary style='cursor: pointer; font-weight: bold; color: #1976D2;'>📄 RouterOS Export Configuration</summary>
                                <pre style='background-color: #fff; padding: 10px; border: 1px solid #ccc; overflow-x: auto;'>{dev['export']}</pre>
                            </details>
                            """
                        snmp_html += "</div>"
                        snmp_sections += snmp_html

                device_count = len(devices_cache)
                html = f"""
                <html><head><meta http-equiv='refresh' content='30'><style>
                body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 1400px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                h2 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
                table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; font-weight: bold; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
                tr:hover {{ background-color: #f1f1f1; }}
                button {{ background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }}
                button:hover {{ background-color: #45a049; }}
                .status-info {{ background-color: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }}
                a {{ text-decoration: none; color: #2196F3; }}
                a:hover {{ text-decoration: underline; }}
                </style></head><body>
                <div class='container'>
                    <h2>🔍 Network Device Discovery Dashboard</h2>
                    <div class='status-info'>
                        <strong>📡 Discovered Devices: {device_count}</strong> | 
                        <strong>🔄 Auto-refresh: Every 30 seconds</strong> |
                        <form action='/rescan' method='post' style='display: inline;'><button type='submit'>🔄 Manual Rescan Now</button></form>
                    </div>
                    <table>
                        <tr><th>IP Address</th><th>MAC Address</th><th>Vendor</th><th>OS</th><th>Open Ports</th><th>Uptime (SNMP)</th><th>Action</th></tr>
                        {rows if rows else '<tr><td colspan="7" style="text-align: center; color: gray;">No devices discovered yet. Click "Manual Rescan Now" to start discovery.</td></tr>'}
                    </table>
                    
                    {f'<h2>📊 SNMP Data & Device Information</h2>{snmp_sections}' if snmp_sections else ''}
                    
                    <div style='margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;'>
                        <strong>ℹ️ Instructions:</strong><br>
                        1. Click "🔐 Login" button next to a device with SSH/Telnet ports (22 or 23)<br>
                        2. Enter SSH credentials (username and password)<br>
                        3. After successful login, SNMP data will be automatically retrieved and displayed above<br>
                        4. For MikroTik devices, the router configuration will also be exported
                    </div>
                </div>
                </body></html>
                """
                self.wfile.write(html.encode())

            elif parsed.path == "/login":
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(f"""
                <html><head><style>
                body {{ font-family: Arial; }}
                input[type='text'], input[type='password'] {{ padding: 5px; width: 200px; }}
                input[type='submit'] {{ padding: 5px 10px; }}
                </style></head><body>
                <h2>Enter SSH Credentials for {ip}</h2>
                <form method='POST'>
                <input type='hidden' name='ip' value='{ip}'>
                Username: <input name='username' type='text'><br><br>
                Password: <input type='password' name='password'><br><br>
                <input type='submit' value='Submit'>
                </form></body></html>
                """.encode())

        def do_POST(self):
            parsed = urlparse(self.path)

            if parsed.path == "/rescan":
                rescan()
                self.send_response(302)
                self.send_header('Location', '/dashboard')
                self.end_headers()
                return

            length = int(self.headers['Content-Length'])
            data = self.rfile.read(length).decode()
            params = parse_qs(data)
            ip = params.get('ip', [''])[0]
            username = params.get('username', [''])[0]
            password = params.get('password', [''])[0]
            credential_store[ip] = {'username': username, 'password': password, 'status': 'Submitted'}
            for dev in devices_cache:
                if dev['ip'] == ip:
                    try_ssh(dev)
            self.send_response(302)
            self.send_header('Location', '/dashboard')
            self.end_headers()

    def run():
        # Use port 8081 for Netdiscover to avoid conflict with WifiScanner (8080)
        ports = list(range(8081, 8090))
        random.shuffle(ports)
        # Also try 8081 first for consistency
        ports.insert(0, 8081)
        for port in ports:
            try:
                server = HTTPServer(('0.0.0.0', port), WebUI)
                print(f"[+] Netdiscover web dashboard started at http://localhost:{port}/dashboard")
                break
            except OSError:
                continue
        else:
            print("[-] Failed to bind to any port in range 8081-8090")
            return

        http_ready.set()
        server.serve_forever()

    threading.Thread(target=run, daemon=True).start()

def auto_login_ssh_devices(devices):
    """Automatically attempt SSH login with admin/admin for devices with SSH ports"""
    print("\n[*] Attempting automatic SSH login with admin/admin...")
    auto_creds = [
        {'username': 'admin', 'password': 'admin'},
        {'username': 'admin', 'password': ''},
        {'username': 'root', 'password': 'admin'},
        {'username': 'root', 'password': 'root'},
        {'username': 'admin', 'password': 'password'},
    ]
    
    ssh_devices = [d for d in devices if (22 in d.get('ports', []) or 23 in d.get('ports', [])) 
                   and d['ip'] not in credential_store]
    
    if not ssh_devices:
        print("[*] No new devices with SSH ports found for auto-login")
        return
    
    print(f"[*] Found {len(ssh_devices)} devices with SSH ports, attempting auto-login...")
    
    for device in ssh_devices:
        for cred in auto_creds:
            try:
                if paramiko is None:
                    break
                    
                print(f"[*] Trying {cred['username']}/{cred['password'] or '(empty)'} on {device['ip']}...")
                client = paramiko.SSHClient()
                client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                
                ssh_port = 22 if 22 in device.get('ports', []) else 23
                client.connect(device['ip'], port=ssh_port, username=cred['username'],
                              password=cred['password'], timeout=5, allow_agent=False, look_for_keys=False)
                
                print(f"[+] Auto-login successful: {device['ip']} with {cred['username']}/{cred['password'] or '(empty)'}")
                credential_store[device['ip']] = {
                    'username': cred['username'],
                    'password': cred['password'],
                    'status': 'Auto-login OK'
                }
                
                # Immediately get SNMP data
                try_ssh(device)
                client.close()
                break  # Success, move to next device
                
            except paramiko.AuthenticationException:
                continue  # Try next credential
            except Exception as e:
                # Connection error, skip this device
                break
            finally:
                try:
                    client.close()
                except:
                    pass

def rescan():
    global devices_cache
    try:
        if nmap is None:
            print("[!] ERROR: Cannot scan network - python-nmap not installed")
            print("[!] Install with: pip3 install python-nmap")
            return
        
        devices = scan_network()
        if not devices:
            print("[!] No devices found on network. Check network connectivity.")
            devices_cache.clear()
            return
        
        print(f"[+] Found {len(devices)} devices, scanning ports...")
        devices = scan_ports(devices)
        print(f"[+] Port scanning completed for {len(devices)} devices")
        
        # Auto-login to devices with SSH ports using admin/admin
        auto_login_ssh_devices(devices)
        
        # Preserve existing SNMP data and SSH status
        existing_data = {dev['ip']: dev for dev in devices_cache}
        devices_cache.clear()
        
        for device in devices:
            # Preserve SNMP data and credentials if device was already logged into
            if device['ip'] in existing_data:
                existing_dev = existing_data[device['ip']]
                if 'snmp' in existing_dev:
                    device['snmp'] = existing_dev['snmp']
                if 'export' in existing_dev:
                    device['export'] = existing_dev['export']
                if 'log' in existing_dev:
                    device['log'] = existing_dev['log']
            
            devices_cache.append(device)
        
        # Save to organized output directory
        SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
        BASE_DIR = os.path.dirname(SCRIPT_DIR)
        OUTPUT_DIR = os.path.join(BASE_DIR, "output", "scans")
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        scan_results_file = os.path.join(OUTPUT_DIR, "scan_results.json")
        with open(scan_results_file, "w") as f:
            json.dump(devices_cache, f, indent=2)
        
        print(f"[✓] Device discovery complete: {len(devices_cache)} devices")
        return devices_cache
        
    except Exception as e:
        print(f"[!] Error during rescan: {e}")
        import traceback
        traceback.print_exc()
        return []

def main():
    global devices_cache
    # Check if running in unified mode
    unified_mode = os.environ.get('NETWATCH_UNIFIED', '0') == '1'
    
    if not unified_mode:
        # Standalone mode - start web server
        start_web()
        http_ready.wait()
        print("\n[+] Go to http://localhost:8081/dashboard to interact with devices")
    else:
        # Unified mode - web server disabled
        http_ready.set()
        print("[*] Network Discovery: Running in unified mode (web server disabled)")
    
    # Initial scan
    print("[*] Network Discovery: Starting initial scan...")
    rescan()
    
    # Auto-rescan loop
    while True:
        time.sleep(60)
        rescan()

if __name__ == '__main__':
    main()
