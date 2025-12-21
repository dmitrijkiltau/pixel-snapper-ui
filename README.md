# Pixel Snapper

## Local
```bash
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  npm install
  npm run build
  python app.py
```

## Frontend dev (Vite)
```bash
  python app.py
  npm run dev
```
Vite proxies `/process` to the Flask server on port 8000.

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
Vite is available at `http://localhost:5173` and proxies `/process` to the Flask app on port 8000.

## Docker Compose (production)
```bash
  docker compose -f docker-compose.prod.yml up --build
```
