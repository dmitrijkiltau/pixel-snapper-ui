# Pixel Snapper

TSX frontend built with Vite + Tailwind. Image snapping runs on the Python backend (no Flask).

## Local
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Terminal 1:
```bash
python app.py
```

Terminal 2:
```bash
npm install
npm run dev
```

Vite proxies `/process` to the Python server on port 8000. Set `VITE_PROXY_TARGET` if needed.

## Build
```bash
npm run build
python app.py
```

## Docker
```bash
docker build -t pixel-snapper-web .
docker run --rm -p 8000:8000 pixel-snapper-web
```

Access the web app at `http://localhost:8000`.

## Docker Compose (development)
```bash
docker compose up --build
```

Vite is available at `http://localhost:5173` and proxies `/process` to the Python server.

## Docker Compose (production)
```bash
docker compose -f docker-compose.prod.yml up --build
```
