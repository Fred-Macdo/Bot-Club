# Use Python 3.11 slim for better package compatibility
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python packages
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy the rest of the application code
COPY . /app

# Make port 8001 available to the world outside this container
EXPOSE 8001

# Define the command to run your app
CMD ["python", "src/main.py"]