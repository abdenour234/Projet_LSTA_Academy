FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    requests \
    locust \
    faker \
    python-dateutil \
    colorama

# Copy test files
COPY . .

CMD ["locust", "-f", "locustfile.py", "--headless"]
