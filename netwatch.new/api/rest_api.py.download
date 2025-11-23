#!/usr/bin/env python3
"""
Netwatch REST API Server
Complete API for external developers to access all netwatch functionality
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import threading

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class NetwatchAPIHandler(BaseHTTPRequestHandler):
    """
    Complete REST API Handler for Netwatch
    Provides access to all WiFi Scanner, Network Discovery, and System features
    """

    # Reference to global scan_results from netwatch_unified
    scan_results = None
    wifi_scanner = None
    netdiscover = None

    # Control state for packet capture
    packet_capture_running = False
    spectral_interval = 20  # Default 20 seconds

    def _set_headers(self, status=200, content_type='application/json'):
        """Set HTTP response headers"""
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_json(self, data, status=200):
        """Send JSON response"""
        self._set_headers(status)
        self.wfile.write(json.dumps(data, indent=2).encode())

    def _send_error(self, message, status=400):
        """Send error response"""
        self._send_json({'error': message, 'status': status}, status)

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self._set_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # ================== SYSTEM ENDPOINTS ==================

        if path == '/api':
            # API information and available endpoints
            self._send_json({
                'name': 'Netwatch REST API',
                'version': '2.0',
                'description': 'Complete network monitoring API',
                'endpoints': {
                    'system': [
                        'GET /api/status',
                        'GET /api/connection',
                        'GET /api/scan'
                    ],
                    'wifi': [
                        'GET /api/wifi',
                        'GET /api/wifi/devices',
                        'GET /api/wifi/devices/{mac}',
                        'GET /api/wifi/interfaces',
                        'GET /api/wifi/bad-frequencies',
                        'GET /api/wifi/interference',
                        'GET /api/wifi/spectral-scan',
                        'GET /api/wifi/spectral-history',
                        'GET /api/wifi/spectrum/data',
                        'GET /api/wifi/monitor/status',
                        'GET /api/wifi/capture/status',
                        'GET /api/wifi/spectral/interval',
                        'POST /api/wifi/monitor/enable',
                        'POST /api/wifi/monitor/disable',
                        'POST /api/wifi/capture/start',
                        'POST /api/wifi/capture/stop',
                        'POST /api/wifi/spectral/scan',
                        'POST /api/wifi/spectral/interval'
                    ],
                    'network': [
                        'GET /api/network',
                        'GET /api/network/devices',
                        'GET /api/network/devices/{ip}',
                        'GET /api/network/devices/{ip}/snmp',
                        'GET /api/network/devices/{ip}/snmp/{oid}',
                        'GET /api/network/devices/{ip}/ports',
                        'GET /api/network/devices/{ip}/config',
                        'GET /api/network/subnet',
                        'GET /api/network/vendor/{mac}',
                        'POST /api/network/rescan',
                        'POST /api/network/devices/{ip}/ssh',
                        'POST /api/network/devices/{ip}/ssh/disconnect'
                    ],
                    'ai': [
                        'GET /api/ai/model/status',
                        'GET /api/ai/model/info',
                        'POST /api/ai/model/train'
                    ],
                    'export': [
                        'GET /api/export/history',
                        'GET /api/export/wifi',
                        'GET /api/export/network',
                        'GET /api/export/all'
                    ]
                },
                'documentation': '/api/docs'
            })

        elif path == '/api/status':
            # System status and health
            self._send_json({
                'status': 'online',
                'components': {
                    'wifi_scanner': 'running' if self.scan_results else 'stopped',
                    'network_discovery': 'running' if self.scan_results else 'stopped',
                    'api_server': 'running'
                },
                'last_update': self.scan_results.get('last_update') if self.scan_results else None
            })

        elif path == '/api/connection':
            # Network connection status (enhanced with network config)
            if self.scan_results:
                conn = self.scan_results.get('connection_status', {})
                self._send_json(conn)
            else:
                self._send_error('System not initialized', 503)

        elif path == '/api/scan':
            # All scan results (unified)
            if self.scan_results:
                self._send_json(self.scan_results)
            else:
                self._send_error('No scan data available', 404)

        # ================== WIFI ENDPOINTS ==================

        elif path == '/api/wifi':
            # WiFi data only
            if self.scan_results:
                wifi_data = {
                    'devices': self.scan_results.get('wifi_devices', []),
                    'bad_frequencies': self.scan_results.get('bad_frequencies', []),
                    'interference': self.scan_results.get('interference_log', []),
                    'last_update': self.scan_results.get('last_update')
                }
                self._send_json(wifi_data)
            else:
                self._send_error('WiFi scanner not initialized', 503)

        elif path == '/api/wifi/devices':
            # List all WiFi devices
            if self.scan_results:
                devices = self.scan_results.get('wifi_devices', [])
                self._send_json({
                    'count': len(devices),
                    'devices': devices
                })
            else:
                self._send_json({'count': 0, 'devices': []})

        elif path.startswith('/api/wifi/devices/'):
            # Get specific device by MAC
            mac = path.split('/')[-1]
            if self.scan_results:
                devices = self.scan_results.get('wifi_devices', [])
                device = next((d for d in devices if d.get('mac') == mac), None)
                if device:
                    self._send_json(device)
                else:
                    self._send_error(f'Device {mac} not found', 404)
            else:
                self._send_error('WiFi scanner not initialized', 503)

        elif path == '/api/wifi/interfaces':
            # List available wireless interfaces
            try:
                from core import WifiScanner
                interface = WifiScanner.get_monitor_interface()
                # Get all wireless interfaces
                result = os.popen("iw dev 2>/dev/null | awk '$1==\"Interface\"{print $2}'").read().strip()
                interfaces = [iface for iface in result.split('\n') if iface]

                self._send_json({
                    'interfaces': interfaces,
                    'current': interface,
                    'monitor_capable': True if interfaces else False
                })
            except Exception as e:
                self._send_error(f'Failed to get interfaces: {str(e)}', 500)

        elif path == '/api/wifi/bad-frequencies':
            # List bad frequencies detected
            if self.scan_results:
                bad_freqs = self.scan_results.get('bad_frequencies', [])
                self._send_json({
                    'count': len(bad_freqs),
                    'frequencies': bad_freqs
                })
            else:
                self._send_json({'count': 0, 'frequencies': []})

        elif path == '/api/wifi/interference':
            # Interference log
            if self.scan_results:
                interference = self.scan_results.get('interference_log', [])
                interfering_count = sum(1 for d in interference if d.get('interfering', False))
                self._send_json({
                    'total': len(interference),
                    'interfering': interfering_count,
                    'log': interference
                })
            else:
                self._send_json({'total': 0, 'interfering': 0, 'log': []})

        elif path == '/api/wifi/spectral-scan':
            # Latest spectral scan
            try:
                scan_file = os.path.join(os.path.dirname(__file__), '../output/scans/spectral_scan.json')
                if os.path.exists(scan_file):
                    with open(scan_file, 'r') as f:
                        data = json.load(f)
                    self._send_json(data)
                else:
                    self._send_error('No spectral scan data available', 404)
            except Exception as e:
                self._send_error(f'Failed to read spectral scan: {str(e)}', 500)

        elif path == '/api/wifi/spectral-history':
            # Spectral scan history
            try:
                history_file = os.path.join(os.path.dirname(__file__), '../output/scans/spectral_history.json')
                if os.path.exists(history_file):
                    with open(history_file, 'r') as f:
                        data = json.load(f)
                    self._send_json({'count': len(data), 'history': data})
                else:
                    self._send_error('No spectral history available', 404)
            except Exception as e:
                self._send_error(f'Failed to read spectral history: {str(e)}', 500)

        elif path == '/api/wifi/spectrum/data':
            # Spectrum time-series data
            try:
                interference_file = os.path.join(os.path.dirname(__file__), '../output/scans/interference_scan.json')
                if os.path.exists(interference_file):
                    with open(interference_file, 'r') as f:
                        data = json.load(f)
                    self._send_json({'count': len(data), 'data': data})
                else:
                    self._send_error('No spectrum data available', 404)
            except Exception as e:
                self._send_error(f'Failed to read spectrum data: {str(e)}', 500)

        elif path == '/api/wifi/monitor/status':
            # Get monitor mode status
            try:
                from core import WifiScanner
                interface = WifiScanner.get_monitor_interface()
                if interface:
                    # Check if interface is in monitor mode
                    mode_check = os.popen(f"iw dev {interface} info 2>/dev/null | grep 'type monitor'").read().strip()
                    is_monitor = bool(mode_check)
                    self._send_json({
                        'interface': interface,
                        'monitor_mode': is_monitor,
                        'status': 'enabled' if is_monitor else 'disabled'
                    })
                else:
                    self._send_json({
                        'interface': None,
                        'monitor_mode': False,
                        'status': 'no_interface'
                    })
            except Exception as e:
                self._send_error(f'Failed to get monitor status: {str(e)}', 500)

        elif path == '/api/wifi/capture/status':
            # Get packet capture status
            self._send_json({
                'running': self.packet_capture_running,
                'status': 'active' if self.packet_capture_running else 'stopped'
            })

        elif path == '/api/wifi/spectral/interval':
            # Get current spectral scan interval
            self._send_json({
                'interval': self.spectral_interval,
                'unit': 'seconds'
            })

        # ================== NETWORK ENDPOINTS ==================

        elif path == '/api/network':
            # Network discovery data only
            if self.scan_results:
                network_data = {
                    'devices': self.scan_results.get('network_devices', []),
                    'snmp_data': self.scan_results.get('snmp_data', {}),
                    'last_update': self.scan_results.get('last_update')
                }
                self._send_json(network_data)
            else:
                self._send_error('Network discovery not initialized', 503)

        elif path == '/api/network/devices':
            # List all network devices
            if self.scan_results:
                devices = self.scan_results.get('network_devices', [])
                self._send_json({
                    'count': len(devices),
                    'devices': devices
                })
            else:
                self._send_json({'count': 0, 'devices': []})

        elif path.startswith('/api/network/devices/') and '/snmp' in path:
            # Get SNMP data for specific device
            parts = path.split('/')
            if len(parts) >= 5:
                ip = parts[4]
                if self.scan_results:
                    snmp_data = self.scan_results.get('snmp_data', {}).get(ip)
                    if snmp_data:
                        self._send_json(snmp_data)
                    else:
                        self._send_error(f'No SNMP data for {ip}', 404)
                else:
                    self._send_error('System not initialized', 503)

        elif path.startswith('/api/network/devices/') and '/ports' in path:
            # Get ports for specific device
            parts = path.split('/')
            if len(parts) >= 5:
                ip = parts[4]
                if self.scan_results:
                    devices = self.scan_results.get('network_devices', [])
                    device = next((d for d in devices if d.get('ip') == ip), None)
                    if device:
                        self._send_json({
                            'ip': ip,
                            'ports': device.get('ports', []),
                            'ssh_status': device.get('ssh_status', 'not connected')
                        })
                    else:
                        self._send_error(f'Device {ip} not found', 404)
                else:
                    self._send_error('System not initialized', 503)

        elif path.startswith('/api/network/devices/') and path.count('/') == 4:
            # Get specific device by IP
            ip = path.split('/')[-1]
            if self.scan_results:
                devices = self.scan_results.get('network_devices', [])
                device = next((d for d in devices if d.get('ip') == ip), None)
                if device:
                    self._send_json(device)
                else:
                    self._send_error(f'Device {ip} not found', 404)
            else:
                self._send_error('System not initialized', 503)

        elif path == '/api/network/subnet':
            # Get detected subnet
            try:
                from core import Netdiscover
                subnet = Netdiscover.detect_subnet()
                self._send_json({'subnet': subnet})
            except Exception as e:
                self._send_error(f'Failed to detect subnet: {str(e)}', 500)

        elif path.startswith('/api/network/vendor/'):
            # Lookup MAC vendor
            mac = path.split('/')[-1]
            try:
                from core import Netdiscover
                vendor = Netdiscover.get_vendor(mac)
                self._send_json({'mac': mac, 'vendor': vendor})
            except Exception as e:
                self._send_error(f'Vendor lookup failed: {str(e)}', 500)

        elif path.startswith('/api/network/devices/') and '/snmp/' in path and path.count('/') == 6:
            # Get specific SNMP OID
            parts = path.split('/')
            if len(parts) >= 7:
                ip = parts[4]
                oid = parts[6]
                try:
                    from core import Netdiscover
                    # Run SNMP get for specific OID
                    result = os.popen(f"snmpget -v2c -c public {ip} {oid} 2>/dev/null").read().strip()
                    if result:
                        self._send_json({
                            'ip': ip,
                            'oid': oid,
                            'value': result
                        })
                    else:
                        self._send_error(f'No SNMP response from {ip} for OID {oid}', 404)
                except Exception as e:
                    self._send_error(f'SNMP query failed: {str(e)}', 500)

        elif path.startswith('/api/network/devices/') and '/config' in path:
            # Get device configuration export
            parts = path.split('/')
            if len(parts) >= 5:
                ip = parts[4]
                try:
                    export_file = os.path.join(os.path.dirname(__file__), f'../output/exports/export_output_{ip}.txt')
                    if os.path.exists(export_file):
                        with open(export_file, 'r') as f:
                            config = f.read()
                        self._send_json({
                            'ip': ip,
                            'config': config,
                            'format': 'mikrotik_export'
                        })
                    else:
                        self._send_error(f'No configuration export found for {ip}', 404)
                except Exception as e:
                    self._send_error(f'Failed to read config: {str(e)}', 500)

        # ================== AI MODEL ENDPOINTS ==================

        elif path == '/api/ai/model/status':
            # Get AI model status
            try:
                model_file = os.path.join(os.path.dirname(__file__), '../output/models/wifi_rf_model.joblib')
                model_exists = os.path.exists(model_file)

                if model_exists:
                    file_stat = os.stat(model_file)
                    import datetime
                    last_modified = datetime.datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                    size_kb = file_stat.st_size / 1024

                    self._send_json({
                        'status': 'trained',
                        'model_file': model_file,
                        'exists': True,
                        'last_modified': last_modified,
                        'size_kb': round(size_kb, 2),
                        'algorithm': 'Isolation Forest'
                    })
                else:
                    self._send_json({
                        'status': 'not_trained',
                        'model_file': model_file,
                        'exists': False,
                        'message': 'Model has not been trained yet'
                    })
            except Exception as e:
                self._send_error(f'Failed to get model status: {str(e)}', 500)

        elif path == '/api/ai/model/info':
            # Get AI model information
            self._send_json({
                'name': 'WiFi Interference Detection Model',
                'algorithm': 'Isolation Forest',
                'library': 'scikit-learn',
                'features': ['MAC (encoded)', 'RSSI', 'Channel'],
                'contamination': 0.05,
                'output': 'Binary classification (normal=1, anomaly=-1)',
                'training_data': 'logs/wifi_log.csv',
                'model_output': 'output/models/wifi_rf_model.joblib',
                'usage': 'Real-time interference detection in packet capture'
            })

        # ================== EXPORT/HISTORY ENDPOINTS ==================

        elif path == '/api/export/history':
            # Export historical data (spectral history)
            try:
                history_file = os.path.join(os.path.dirname(__file__), '../output/scans/spectral_history.json')
                if os.path.exists(history_file):
                    with open(history_file, 'r') as f:
                        data = json.load(f)
                    self._send_json({
                        'type': 'spectral_history',
                        'count': len(data),
                        'data': data,
                        'format': 'json'
                    })
                else:
                    self._send_error('No historical data available', 404)
            except Exception as e:
                self._send_error(f'Failed to export history: {str(e)}', 500)

        elif path == '/api/export/wifi':
            # Export all WiFi data
            try:
                wifi_data = {
                    'devices': self.scan_results.get('wifi_devices', []) if self.scan_results else [],
                    'bad_frequencies': self.scan_results.get('bad_frequencies', []) if self.scan_results else [],
                    'interference_log': self.scan_results.get('interference_log', []) if self.scan_results else []
                }

                # Add file-based data
                interference_file = os.path.join(os.path.dirname(__file__), '../output/scans/interference_scan.json')
                if os.path.exists(interference_file):
                    with open(interference_file, 'r') as f:
                        wifi_data['interference_scan'] = json.load(f)

                self._send_json({
                    'type': 'wifi_export',
                    'timestamp': datetime.datetime.now().isoformat(),
                    'data': wifi_data
                })
            except Exception as e:
                self._send_error(f'Failed to export WiFi data: {str(e)}', 500)

        elif path == '/api/export/network':
            # Export all network data
            try:
                network_data = {
                    'devices': self.scan_results.get('network_devices', []) if self.scan_results else [],
                    'snmp_data': self.scan_results.get('snmp_data', {}) if self.scan_results else {}
                }

                # Add subnet info
                try:
                    from core import Netdiscover
                    network_data['subnet'] = Netdiscover.detect_subnet()
                except:
                    pass

                self._send_json({
                    'type': 'network_export',
                    'timestamp': datetime.datetime.now().isoformat(),
                    'data': network_data
                })
            except Exception as e:
                self._send_error(f'Failed to export network data: {str(e)}', 500)

        elif path == '/api/export/all':
            # Export everything
            try:
                import datetime
                export_data = {
                    'timestamp': datetime.datetime.now().isoformat(),
                    'connection': self.scan_results.get('connection_status', {}) if self.scan_results else {},
                    'wifi': {
                        'devices': self.scan_results.get('wifi_devices', []) if self.scan_results else [],
                        'bad_frequencies': self.scan_results.get('bad_frequencies', []) if self.scan_results else [],
                        'interference_log': self.scan_results.get('interference_log', []) if self.scan_results else []
                    },
                    'network': {
                        'devices': self.scan_results.get('network_devices', []) if self.scan_results else [],
                        'snmp_data': self.scan_results.get('snmp_data', {}) if self.scan_results else {}
                    }
                }

                # Add file-based data
                try:
                    spectral_file = os.path.join(os.path.dirname(__file__), '../output/scans/spectral_scan.json')
                    if os.path.exists(spectral_file):
                        with open(spectral_file, 'r') as f:
                            export_data['spectral_scan'] = json.load(f)

                    history_file = os.path.join(os.path.dirname(__file__), '../output/scans/spectral_history.json')
                    if os.path.exists(history_file):
                        with open(history_file, 'r') as f:
                            export_data['spectral_history'] = json.load(f)
                except:
                    pass

                self._send_json(export_data)
            except Exception as e:
                self._send_error(f'Failed to export all data: {str(e)}', 500)

        # ================== DASHBOARD & DOCS ==================

        elif path.startswith('/dashboard') or path.startswith('/graph'):
            # Serve dashboard HTML
            dashboard_path = os.path.join(os.path.dirname(__file__), '../core/dashboard.html')
            if os.path.exists(dashboard_path):
                self._set_headers(200, 'text/html')
                with open(dashboard_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self._send_error('Dashboard not found', 404)

        elif path.startswith('/static/'):
            # Serve static files
            file_name = path.split('/')[-1]
            static_path = os.path.join(os.path.dirname(__file__), '../output/static', file_name)
            if os.path.exists(static_path):
                if file_name.endswith('.png'):
                    self._set_headers(200, 'image/png')
                elif file_name.endswith('.json'):
                    self._set_headers(200, 'application/json')
                with open(static_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self._send_error('File not found', 404)

        elif path == '/api/docs':
            # API documentation
            self._serve_api_docs()

        else:
            self._send_error('Endpoint not found', 404)

    def do_POST(self):
        """Handle POST requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            data = json.loads(body) if body else {}
        except:
            data = {}

        # ================== WIFI POST ENDPOINTS ==================

        if path == '/api/wifi/monitor/enable':
            # Enable monitor mode
            try:
                from core import WifiScanner
                import threading
                import core.netwatch_unified as netwatch

                # Enable monitor mode on interface
                interface = WifiScanner.enable_monitor_mode()

                # Update global monitor mode state
                netwatch.monitor_mode_enabled = True

                # Start monitor scan in background thread if not already running
                def start_scan_thread():
                    try:
                        print("[*] API: Starting monitor scan thread...")
                        WifiScanner.start_monitor_scan()
                    except Exception as e:
                        print(f"[!] API: Error in monitor scan thread: {e}")
                        import traceback
                        traceback.print_exc()

                # Check if scan thread is already running
                scan_thread_exists = any(t.name == "MonitorScan" for t in threading.enumerate())

                if not scan_thread_exists:
                    scan_thread = threading.Thread(target=start_scan_thread, daemon=True, name="MonitorScan")
                    scan_thread.start()
                    message = 'Monitor mode enabled and scanning started'
                else:
                    message = 'Monitor mode re-enabled (scan already running)'

                self._send_json({
                    'status': 'success',
                    'interface': interface,
                    'mode': 'monitor',
                    'message': message
                })
            except Exception as e:
                import traceback
                error_detail = traceback.format_exc()
                print(f"[!] Monitor enable error: {error_detail}")
                self._send_error(f'Failed to enable monitor mode: {str(e)}', 500)

        elif path == '/api/wifi/monitor/disable':
            # Disable monitor mode (set to managed)
            try:
                from core import WifiScanner
                import core.netwatch_unified as netwatch

                interface = WifiScanner.get_monitor_interface()
                if interface:
                    os.popen(f"sudo ip link set {interface} down").read()
                    os.popen(f"sudo iw dev {interface} set type managed").read()
                    os.popen(f"sudo ip link set {interface} up").read()

                    # Update global monitor mode state
                    netwatch.monitor_mode_enabled = False

                    self._send_json({
                        'status': 'success',
                        'interface': interface,
                        'mode': 'managed',
                        'message': 'Monitor mode disabled'
                    })
                else:
                    self._send_error('No wireless interface found', 404)
            except Exception as e:
                self._send_error(f'Failed to disable monitor mode: {str(e)}', 500)

        elif path == '/api/wifi/capture/start':
            # Start packet capture
            try:
                self.packet_capture_running = True
                self._send_json({'status': 'success', 'message': 'Packet capture started', 'running': True})
            except Exception as e:
                self._send_error(f'Failed to start capture: {str(e)}', 500)

        elif path == '/api/wifi/capture/stop':
            # Stop packet capture
            try:
                self.packet_capture_running = False
                self._send_json({'status': 'success', 'message': 'Packet capture stopped', 'running': False})
            except Exception as e:
                self._send_error(f'Failed to stop capture: {str(e)}', 500)

        elif path == '/api/wifi/spectral/scan':
            # Trigger spectral scan
            try:
                from core import WifiScanner
                WifiScanner.trigger_spectral_scan()
                self._send_json({'status': 'success', 'message': 'Spectral scan triggered'})
            except Exception as e:
                self._send_error(f'Spectral scan failed: {str(e)}', 500)

        elif path == '/api/wifi/spectral/interval':
            # Set spectral scan interval
            try:
                interval = data.get('interval', 20)
                if not isinstance(interval, (int, float)) or interval < 5:
                    self._send_error('Interval must be a number >= 5 seconds', 400)
                    return
                self.spectral_interval = interval
                self._send_json({
                    'status': 'success',
                    'message': f'Spectral scan interval set to {interval} seconds',
                    'interval': interval
                })
            except Exception as e:
                self._send_error(f'Failed to set interval: {str(e)}', 500)

        # ================== NETWORK POST ENDPOINTS ==================

        elif path == '/api/network/rescan':
            # Trigger network rescan
            try:
                from core import Netdiscover
                Netdiscover.rescan()
                self._send_json({'status': 'success', 'message': 'Network rescan started'})
            except Exception as e:
                self._send_error(f'Rescan failed: {str(e)}', 500)

        elif path.startswith('/api/network/devices/') and '/ssh/disconnect' in path:
            # SSH disconnect from device
            parts = path.split('/')
            if len(parts) >= 5:
                ip = parts[4]
                try:
                    from core import Netdiscover
                    # Clear credentials
                    if ip in Netdiscover.credential_store:
                        del Netdiscover.credential_store[ip]
                    self._send_json({'status': 'success', 'message': f'SSH disconnected from {ip}'})
                except Exception as e:
                    self._send_error(f'SSH disconnect failed: {str(e)}', 500)

        elif path.startswith('/api/network/devices/') and '/ssh' in path:
            # SSH login to device
            parts = path.split('/')
            if len(parts) >= 5:
                ip = parts[4]
                username = data.get('username')
                password = data.get('password')

                if not username or not password:
                    self._send_error('Username and password required', 400)
                    return

                try:
                    from core import Netdiscover
                    # Store credentials
                    Netdiscover.credential_store[ip] = {
                        'username': username,
                        'password': password
                    }
                    # Find device and try SSH
                    devices = self.scan_results.get('network_devices', [])
                    device = next((d for d in devices if d.get('ip') == ip), None)
                    if device:
                        Netdiscover.try_ssh(device)
                        self._send_json({'status': 'success', 'message': f'SSH login attempted for {ip}'})
                    else:
                        self._send_error(f'Device {ip} not found', 404)
                except Exception as e:
                    self._send_error(f'SSH login failed: {str(e)}', 500)
            else:
                self._send_error('Invalid endpoint', 400)

        # ================== AI MODEL POST ENDPOINTS ==================

        elif path == '/api/ai/model/train':
            # Train AI model
            try:
                import subprocess
                train_script = os.path.join(os.path.dirname(__file__), '../ai_model/train_model.py')
                if os.path.exists(train_script):
                    # Run training script in background
                    result = subprocess.Popen(['python3', train_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    self._send_json({
                        'status': 'training_started',
                        'message': 'AI model training initiated',
                        'script': train_script,
                        'note': 'Training runs in background, check /api/ai/model/status for completion'
                    })
                else:
                    self._send_error('Training script not found', 404)
            except Exception as e:
                self._send_error(f'Failed to start training: {str(e)}', 500)

        else:
            self._send_error('Endpoint not found', 404)

    def _serve_api_docs(self):
        """Serve API documentation"""
        docs = {
            'title': 'Netwatch REST API Documentation',
            'version': '2.0',
            'base_url': 'http://localhost:8080',
            'authentication': 'None (add if needed)',
            'endpoints': {
                'System': {
                    'GET /api': 'API information and available endpoints',
                    'GET /api/status': 'System status and health check',
                    'GET /api/connection': 'Network connection status (type, IP, subnet, gateway, DNS, DHCP/static)',
                    'GET /api/scan': 'All scan results (WiFi + Network unified)'
                },
                'WiFi Scanner': {
                    'GET /api/wifi': 'All WiFi data (devices, bad frequencies, interference)',
                    'GET /api/wifi/devices': 'List all detected WiFi devices',
                    'GET /api/wifi/devices/{mac}': 'Get specific device details',
                    'GET /api/wifi/interfaces': 'List available wireless interfaces',
                    'GET /api/wifi/bad-frequencies': 'List detected bad frequencies',
                    'GET /api/wifi/interference': 'Interference log with statistics',
                    'GET /api/wifi/spectral-scan': 'Latest spectral scan data',
                    'GET /api/wifi/spectral-history': 'Historical spectral scan data',
                    'GET /api/wifi/spectrum/data': 'Spectrum time-series data',
                    'POST /api/wifi/monitor/enable': 'Enable monitor mode on wireless interface',
                    'POST /api/wifi/spectral/scan': 'Trigger immediate spectral scan'
                },
                'Network Discovery': {
                    'GET /api/network': 'All network data (devices, SNMP)',
                    'GET /api/network/devices': 'List all discovered network devices',
                    'GET /api/network/devices/{ip}': 'Get specific device details',
                    'GET /api/network/devices/{ip}/snmp': 'Get SNMP data for device',
                    'GET /api/network/devices/{ip}/ports': 'Get open ports for device',
                    'GET /api/network/subnet': 'Get detected network subnet',
                    'GET /api/network/vendor/{mac}': 'Lookup MAC vendor',
                    'POST /api/network/rescan': 'Trigger full network rescan',
                    'POST /api/network/devices/{ip}/ssh': 'SSH login to device (body: {username, password})'
                },
                'Dashboard': {
                    'GET /dashboard': 'Web dashboard UI',
                    'GET /static/*': 'Static files (images, data files)'
                }
            },
            'response_format': 'JSON',
            'cors': 'Enabled (Access-Control-Allow-Origin: *)',
            'example_requests': {
                'Get all WiFi devices': 'curl http://localhost:8080/api/wifi/devices',
                'Get connection status': 'curl http://localhost:8080/api/connection',
                'SSH to device': 'curl -X POST http://localhost:8080/api/network/devices/192.168.1.1/ssh -H "Content-Type: application/json" -d \'{"username":"admin","password":"password"}\'',
                'Trigger rescan': 'curl -X POST http://localhost:8080/api/network/rescan'
            }
        }
        self._send_json(docs)

    def log_message(self, format, *args):
        """Suppress default request logging"""
        pass


def start_rest_api(host='0.0.0.0', port=8080, scan_results_ref=None):
    """
    Start the REST API server

    Args:
        host: Host to bind to (default: 0.0.0.0)
        port: Port to listen on (default: 8080)
        scan_results_ref: Reference to global scan_results dict
    """
    # Set global reference to scan_results
    NetwatchAPIHandler.scan_results = scan_results_ref

    try:
        server = HTTPServer((host, port), NetwatchAPIHandler)
        print(f'[+] Netwatch REST API started at http://{host}:{port}')
        print(f'[+] API Documentation: http://localhost:{port}/api/docs')
        print(f'[+] Dashboard: http://localhost:{port}/dashboard')
        server.serve_forever()
    except Exception as e:
        print(f'[!] Failed to start API server: {e}')


if __name__ == '__main__':
    # Standalone mode for testing
    print('Netwatch REST API Server')
    print('Starting in standalone mode...')
    start_rest_api()
