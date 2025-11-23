FROM python:3.11-slim

# Install system dependencies for serial port access
RUN apt-get update && apt-get install -y \
    udev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy gateway script
COPY gateway.py .
RUN chmod +x gateway.py

# Environment defaults (can be overridden)
ENV SERIAL_PORT=/dev/ttyUSB0 \
    SERIAL_BAUD=115200 \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    REDIS_CHANNEL=dongle:data \
    LOG_LEVEL=INFO

# Run gateway
CMD ["python", "-u", "gateway.py"]
