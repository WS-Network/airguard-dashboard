#!/usr/bin/env python3
"""
Netwatch Web Dashboard Server
Serves the modern UI dashboard
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

class NetwatchHTTPHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler for Netwatch dashboard"""

    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Serve dashboard.html for root path
        if self.path == '/' or self.path == '/dashboard':
            self.path = '/dashboard.html'
        return super().do_GET()

    def log_message(self, format, *args):
        # Custom logging
        print(f"[Web Server] {format % args}")


def run_server(port=8081):
    """Run the web dashboard server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, NetwatchHTTPHandler)

    print(f"\n{'='*60}")
    print(f"🌐 Netwatch Dashboard Server Starting...")
    print(f"{'='*60}")
    print(f"📊 Dashboard URL: http://localhost:{port}")
    print(f"🔗 API URL: http://localhost:8080/api/scan")
    print(f"{'='*60}\n")
    print("Press Ctrl+C to stop the server\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down web server...")
        httpd.shutdown()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    run_server(port)
