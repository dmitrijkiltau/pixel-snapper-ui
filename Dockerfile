FROM node:20-slim AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY index.html vite.config.js tsconfig.json ./
COPY src ./src

RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py pixel_snapper.py ./
COPY --from=frontend /app/dist ./dist

EXPOSE 8000

CMD ["python", "app.py"]
