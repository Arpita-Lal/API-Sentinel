from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/test':
            body = b'{"status": "ok", "message": "this is a shadow API"}'
        elif self.path.startswith('/api/documents/'):
            doc_id = self.path.split('/')[-1]
            body = f'{{"status": "ok", "document": "{doc_id}", "data": "confidential"}}'.encode('utf-8')
        else:
            body = b'{"status": "ok", "message": "hello world"}'
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        if self.path.startswith('/api/documents/'):
            doc_id = self.path.split('/')[-1]
            response_body = f'{{"status": "created", "document": "{doc_id}"}}'.encode('utf-8')
        else:
            response_body = b'{"status": "received", "data": ' + post_data + b'}'
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)

httpd = HTTPServer(('127.0.0.1', 8080), SimpleHTTPRequestHandler)
print("Serving on port 8080...")
httpd.serve_forever()
