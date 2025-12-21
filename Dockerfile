FROM node:20-slim AS frontend

WORKDIR /app

COPY package.json ./
RUN npm install

COPY vite.config.js index.html ./
COPY src ./src
COPY templates ./templates

RUN npm run build


FROM python:3.12-slim

WORKDIR /app

# Faster installs + smaller image
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./
COPY --from=frontend /app/static/dist ./static/dist

EXPOSE 8000

# Debug server is okay locally. Swap to gunicorn for “real”.
CMD ["python", "app.py"]
