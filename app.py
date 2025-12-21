import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles

from pixel_snapper import process_rgba_bytes

WEB_ROOT = os.environ.get("PIXEL_SNAPPER_WEB_ROOT", "dist")

app = FastAPI()


@app.post("/process")
async def process_image(
    image: UploadFile = File(...),
    k_colors: int = Form(default=16),
    k_seed: int = Form(default=42),
):
    if not image.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    input_bytes = await image.read()
    if not input_bytes:
        raise HTTPException(status_code=400, detail="Empty upload")

    if k_colors <= 0 or k_colors > 256:
        raise HTTPException(status_code=400, detail="k_colors must be between 1 and 256")

    if k_seed < 0:
        raise HTTPException(status_code=400, detail="k_seed must be >= 0")

    try:
        output_png = process_rgba_bytes(input_bytes, k_colors=k_colors, k_seed=k_seed)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")

    return Response(
        content=output_png,
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )


@app.get("/process")
async def process_not_allowed():
    return PlainTextResponse("Method not allowed", status_code=405)


# Mount static files last so API routes take precedence
if Path(WEB_ROOT).is_dir():
    app.mount("/", StaticFiles(directory=WEB_ROOT, html=True), name="static")


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
