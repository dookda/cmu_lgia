FROM python:3.12-slim

# System deps required by psycopg2-binary / GeoAlchemy2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port uvicorn will listen on
EXPOSE 8000

# Run with 1 worker in dev; scale workers / use gunicorn in production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
