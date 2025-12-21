import io
from flask import Flask, render_template, request, send_file, abort

from pixel_snapper import process_rgba_bytes

app = Flask(__name__)

@app.get("/")
def index():
    return render_template("index.html")

@app.post("/process")
def process():
    if "image" not in request.files:
        abort(400, "Missing file field: image")

    f = request.files["image"]
    if not f or not f.filename:
        abort(400, "No file uploaded")

    try:
        k_colors = int(request.form.get("k_colors", "16"))
        if k_colors <= 0 or k_colors > 256:
            abort(400, "k_colors must be between 1 and 256")
    except ValueError:
        abort(400, "k_colors must be an integer")

    # Optional: let users tweak seed for deterministic variety
    try:
        k_seed = int(request.form.get("k_seed", "42"))
        if k_seed < 0:
            abort(400, "k_seed must be >= 0")
    except ValueError:
        abort(400, "k_seed must be an integer")

    input_bytes = f.read()
    if not input_bytes:
        abort(400, "Empty upload")

    output_png = process_rgba_bytes(input_bytes, k_colors=k_colors, k_seed=k_seed)

    # Return bytes as a file response so the frontend can render the PNG blob.
    return send_file(
        io.BytesIO(output_png),
        mimetype="image/png",
        as_attachment=False,
        download_name="snapped.png",
        max_age=0,
    )

if __name__ == "__main__":
    # Debug server. For real use: gunicorn.
    app.run(host="0.0.0.0", port=8000, debug=True)
