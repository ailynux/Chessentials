# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Stockfish (Linux version)
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://github.com/official-stockfish/Stockfish/releases/download/sf_15.1/stockfish-ubuntu.zip && \
    unzip stockfish-ubuntu.zip && \
    chmod +x stockfish-ubuntu && \
    mv stockfish-ubuntu /usr/local/bin/stockfish

# Expose the port the Flask app will run on
EXPOSE 5000

# Command to run the app
CMD ["python", "app.py"]
