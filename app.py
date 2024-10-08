import os
import logging
from flask import Flask, render_template, request, jsonify
from stockfish import Stockfish

# Initialize Flask app
app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Path to Stockfish executable (use your local stockfish binary)
stockfish_path = os.path.join(os.path.dirname(__file__), 'stockfish', 'stockfish-ubuntu-x86-64-sse41-popcnt')

# Ensure Stockfish executable is available
if not os.path.exists(stockfish_path):
    logging.error(f"Stockfish executable not found at: {stockfish_path}")
    raise FileNotFoundError(f"Stockfish executable not found at: {stockfish_path}")

# Initialize Stockfish engine
try:
    stockfish = Stockfish(stockfish_path)
    stockfish.set_skill_level(1)  # Set default AI difficulty (1-20)
except Exception as e:
    logging.error(f"Error initializing Stockfish: {e}")
    raise

# Track game state and moves
move_history = []

@app.route('/', endpoint='home')
def index():
    """Render the index.html page."""
    return render_template('index.html')

@app.route('/move', methods=['POST'])
def make_move():
    """
    Handles POST request to make a move based on FEN string.
    - Expects a JSON object with the 'fen' key.
    - Returns the Stockfish engine's best move and move history in JSON format.
    """
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({'error': 'No FEN provided'}), 400

    fen = data['fen']

    # Set the current position in Stockfish using FEN
    try:
        stockfish.set_fen_position(fen)
        best_move = stockfish.get_best_move()
    except Exception as e:
        logging.error(f"Error processing FEN: {e}")
        return jsonify({'error': 'Error processing FEN'}), 500

    if best_move is None:
        return jsonify({'error': 'No valid move found'}), 500

    # Update move history
    move_history.append(fen)

    # Return the best move and move history to the frontend
    return jsonify({'best_move': best_move, 'move_history': move_history})

@app.route('/set_skill_level', methods=['POST'])
def set_skill_level():
    """
    Allows users to set the skill level of Stockfish dynamically.
    - Expects a JSON object with 'skill_level' (1-20).
    """
    data = request.get_json()
    
    if not data or 'skill_level' not in data:
        return jsonify({'error': 'No skill level provided'}), 400

    skill_level = data['skill_level']

    if not (1 <= skill_level <= 20):
        return jsonify({'error': 'Skill level must be between 1 and 20'}), 400

    stockfish.set_skill_level(skill_level)

    return jsonify({'success': f'Skill level set to {skill_level}'})

@app.route('/evaluate', methods=['POST'])
def evaluate():
    """
    Returns Stockfish's evaluation of the current board.
    - Expects a JSON object with the 'fen' key.
    """
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({'error': 'No FEN provided'}), 400

    fen = data['fen']
    stockfish.set_fen_position(fen)

    evaluation = stockfish.get_evaluation()

    return jsonify({'evaluation': evaluation})

@app.route('/reset', methods=['POST'])
def reset_game():
    """
    Resets the move history and starts a new game.
    """
    global move_history
    move_history = []
    stockfish.set_fen_position("startpos")  # Resets Stockfish to the starting position

    return jsonify({'success': 'Game has been reset', 'move_history': move_history})

@app.route('/contact', endpoint='contact')
def contact():
    """Render the contact.html page."""
    return render_template('contact.html')

if __name__ == '__main__':
    # Bind to '0.0.0.0' to ensure the app is accessible in Railway or other cloud environments
    app.run(host='0.0.0.0', port=5000, debug=True)
