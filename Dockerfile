# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Install necessary system utilities and libraries
RUN apt-get update && \
    apt-get install -y libstdc++6 tzdata && \
    rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container
COPY . /app

# Ensure Stockfish binary is executable
RUN chmod +x /app/stockfish/stockfish-ubuntu-x86-64-sse41-popcnt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the Flask app will run on
EXPOSE 5000

# Command to run Gunicorn instead of the Flask development server
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
