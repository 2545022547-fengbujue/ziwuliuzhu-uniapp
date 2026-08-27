#!/usr/bin/env python3
"""HTTP server with no-cache headers for development."""
import http.server
import os

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # Allow eval for uni-app x web runtime
        self.send_header('Content-Security-Policy', "script-src 'self' 'unsafe-eval' 'unsafe-inline'")
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(__file__), 'dist', 'build', 'h5'))
    server = http.server.HTTPServer(('0.0.0.0', 8088), NoCacheHandler)
    print('Serving on http://localhost:8088 (no-cache)')
    server.serve_forever()
