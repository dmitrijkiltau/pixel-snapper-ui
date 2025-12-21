# Pixel Snapper

## Local
```bash
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  python app.py
```

## Docker
```bash
  docker build -t pixel-snapper-web .
  docker run --rm -p 8000:8000 pixel-snapper-web
```

Access the web app at `http://localhost:8000`.
