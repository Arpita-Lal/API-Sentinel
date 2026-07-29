from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "ok", "message": "hello world"}')

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        response = {
            "status": "received",
            "data": json.loads(post_data.decode('utf-8'))
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

httpd = HTTPServer(('127.0.0.1', 8080), SimpleHTTPRequestHandler)
print("Serving on port 8080...")
httpd.serve_forever()
