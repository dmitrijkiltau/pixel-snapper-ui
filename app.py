import cgi
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from pixel_snapper import process_rgba_bytes

WEB_ROOT = os.environ.get("PIXEL_SNAPPER_WEB_ROOT", "dist")


class PixelSnapperHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def do_GET(self):
        if self.path.startswith("/process"):
            self.send_text(405, "Method not allowed")
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/process":
            self.send_text(404, "Not found")
            return

        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_text(400, "Expected multipart/form-data")
            return

        environ = {
            "REQUEST_METHOD": "POST",
            "CONTENT_TYPE": content_type,
        }
        content_length = self.headers.get("Content-Length")
        if content_length:
            environ["CONTENT_LENGTH"] = content_length

        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ=environ,
        )

        if "image" not in form:
            self.send_text(400, "Missing file field: image")
            return

        file_item = form["image"]
        if not getattr(file_item, "filename", None):
            self.send_text(400, "No file uploaded")
            return

        input_bytes = file_item.file.read()
        if not input_bytes:
            self.send_text(400, "Empty upload")
            return

        try:
            k_colors = int(form.getfirst("k_colors", "16"))
            if k_colors <= 0 or k_colors > 256:
                self.send_text(400, "k_colors must be between 1 and 256")
                return
        except ValueError:
            self.send_text(400, "k_colors must be an integer")
            return

        try:
            k_seed = int(form.getfirst("k_seed", "42"))
            if k_seed < 0:
                self.send_text(400, "k_seed must be >= 0")
                return
        except ValueError:
            self.send_text(400, "k_seed must be an integer")
            return

        try:
            output_png = process_rgba_bytes(
                input_bytes, k_colors=k_colors, k_seed=k_seed
            )
        except Exception as exc:
            self.send_text(500, f"Processing failed: {exc}")
            return

        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(output_png)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(output_png)

    def send_text(self, status, message):
        body = message.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), PixelSnapperHandler)
    print(f"Serving on http://{host}:{port}")
    server.serve_forever()
