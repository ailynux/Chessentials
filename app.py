from flask import Flask, render_template, request, jsonify
from stockfish import Stockfish
import os

# Initialize Flask app
app = Flask(__name__)

# Path to Stockfish executable (Adjust path for different environments if needed)
stockfish_path = os.path.join(os.path.dirname(__file__), 'stockfish', 'stockfish-windows-x86-64-avx2.exe')

# Ensure Stockfish executable is available
if not os.path.exists(stockfish_path):
    raise FileNotFoundError(f"Stockfish executable not found at: {stockfish_path}")

# Initialize Stockfish engine
stockfish = Stockfish(stockfish_path)
stockfish.set_skill_level(5)  # Set default AI difficulty (1-20)

# Track game state and moves
move_history = []

@app.route('/', endpoint='home')  # Explicitly name the endpoint 'home'
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
    stockfish.set_fen_position(fen)

    # Get the AI's best move
    best_move = stockfish.get_best_move()

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

@app.route('/contact', endpoint='contact')  # Define contact endpoint
def contact():
    """Render the contact.html page."""
    return render_template('contact.html')

if __name__ == '__main__':
    app.run(debug=True)
