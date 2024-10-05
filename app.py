from flask import Flask, render_template, request, jsonify
from stockfish import Stockfish
import os

# Path to Stockfish executable
stockfish_path = os.path.join(os.path.dirname(__file__), 'stockfish', 'stockfish-windows-x86-64-avx2.exe')

# Ensure the Stockfish executable is available
if not os.path.exists(stockfish_path):
    raise FileNotFoundError("Stockfish executable not found at: " + stockfish_path)

# Initialize Stockfish engine
stockfish = Stockfish(stockfish_path)
stockfish.set_skill_level(5)  # Set default AI difficulty (1-20)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/move', methods=['POST'])
def make_move():
    data = request.get_json()
    print('Received data:', data)  # Debugging statement

    fen = data.get('fen')
    if fen is None:
        print('No FEN provided in the request.')  # Debugging statement
        return jsonify({'error': 'No FEN provided'}), 400

    # Set the current position in Stockfish
    stockfish.set_fen_position(fen)

    # Get AI's best move
    best_move = stockfish.get_best_move()

    if best_move is None:
        return jsonify({'error': 'No valid move found'}), 500

    # Return the AI's best move as a response
    return jsonify({'best_move': best_move})

if __name__ == '__main__':
    app.run(debug=True)
