# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install required system packages (wget, unzip, ca-certificates)
RUN apt-get update && \
    apt-get install -y wget unzip && \
    apt-get install -y ca-certificates

# Download Stockfish Linux binary from the correct link
RUN wget https://stockfishchess.org/files/stockfish_15.1_linux_x64.zip -O stockfish.zip || \
    (echo "Failed to download Stockfish binary" && exit 1)

# Unzip and install Stockfish
RUN unzip stockfish.zip && \
    chmod +x stockfish_15.1_linux_x64/stockfish && \
    mv stockfish_15.1_linux_x64/stockfish /usr/local/bin/stockfish && \
    rm -rf stockfish.zip stockfish_15.1_linux_x64

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the Flask app will run on
EXPOSE 5000

# Command to run the app
CMD ["python", "app.py"]
