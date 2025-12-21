FROM python:3.12-slim


WORKDIR /app


# Faster installs + smaller image
RUN pip install --no-cache-dir --upgrade pip


COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt


COPY . ./


EXPOSE 8000


# Debug server is okay locally. Swap to gunicorn for “real”.
CMD ["python", "app.py"]
