# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Make the Stockfish binary executable
RUN chmod +x /app/stockfish/stockfish-ubuntu-x86-64-avx2

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the Flask app will run on
EXPOSE 5000

# Command to run the app
CMD ["python", "app.py"]
