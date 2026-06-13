import os
import logging
import platform
import shutil
import threading
from flask import Flask, render_template, request, jsonify
from stockfish import Stockfish

# Initialize Flask app
app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

def resolve_stockfish_path():
    """Pick a Stockfish binary for the current OS/arch.

    Local macOS  -> bundled mac binary or Homebrew `stockfish`
    Render/Linux -> stockfish/stockfish-ubuntu-x86-64-sse41-popcnt
    Override either with STOCKFISH_PATH env var.
    """
    if env_path := os.environ.get('STOCKFISH_PATH'):
        return env_path

    stockfish_dir = os.path.join(os.path.dirname(__file__), 'stockfish')
    system = platform.system()
    machine = platform.machine().lower()

    if system == 'Darwin':
        candidates = [
            'stockfish-macos-m1-apple-silicon' if machine in ('arm64', 'aarch64') else None,
            'stockfish-macos-x86-64-sse41-popcnt',
        ]
    elif system == 'Windows':
        candidates = ['stockfish-windows-x86-64-avx2.exe']
    else:
        candidates = ['stockfish-ubuntu-x86-64-sse41-popcnt']

    for name in candidates:
        if name:
            path = os.path.join(stockfish_dir, name)
            if os.path.isfile(path):
                return path

    if brew_path := shutil.which('stockfish'):
        return brew_path

    raise FileNotFoundError(
        'Stockfish executable not found. Install with `brew install stockfish` '
        'or set STOCKFISH_PATH to your binary.'
    )

stockfish_path = resolve_stockfish_path()
logging.info(f'Using Stockfish at: {stockfish_path}')

# Initialize Stockfish engine with reduced memory usage
try:
    stockfish = Stockfish(stockfish_path, parameters={"Threads": 1, "Hash": 16})  # Reduce memory consumption
    stockfish.set_skill_level(1)  # Set default AI difficulty (1-20)
except Exception as e:
    logging.error(f"Error initializing Stockfish: {e}")
    raise

# Track game state and moves
move_history = []
_engine_lock = threading.Lock()


def _run_engine(fn):
    """Stockfish is one process — never call it from two threads at once."""
    with _engine_lock:
        return fn()


def _restart_engine():
    global stockfish
    logging.warning('Restarting Stockfish engine')
    try:
        del stockfish
    except Exception:
        pass
    stockfish = Stockfish(stockfish_path, parameters={"Threads": 1, "Hash": 16})
    stockfish.set_skill_level(1)


def _evaluate_position(fen):
    """Return Stockfish eval for a FEN (white-positive)."""
    def work():
        stockfish.set_fen_position(fen)
        return stockfish.get_evaluation()

    try:
        return _run_engine(work)
    except Exception:
        _restart_engine()
        return _run_engine(work)


@app.route('/', endpoint='home')
def index():
    """Render the index.html page."""
    return render_template('index.html')

@app.route('/strategy')
def strategy():
    """Render the strategy.html page."""
    return render_template('strategy.html')

@app.route('/tactics')
def tactics():
    """Render the tactics.html page."""
    return render_template('tactics.html')

@app.route('/endgame')
def endgame():
    """Render the endgame.html page."""
    return render_template('endgame.html')

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

    def work():
        stockfish.set_fen_position(fen)
        best_move = stockfish.get_best_move()
        evaluation = stockfish.get_evaluation()
        return best_move, evaluation

    try:
        best_move, evaluation = _run_engine(work)
    except Exception as e:
        logging.error(f"Error processing FEN: {e}")
        try:
            _restart_engine()
            best_move, evaluation = _run_engine(work)
        except Exception as retry_error:
            logging.error(f"Stockfish retry failed: {retry_error}")
            return jsonify({'error': 'Error processing FEN'}), 500

    if best_move is None:
        return jsonify({'error': 'No valid move found'}), 500

    # Update move history
    move_history.append(fen)

    return jsonify({
        'best_move': best_move,
        'evaluation': evaluation,
        'move_history': move_history,
    })

@app.route('/hint', methods=['POST'])
def hint():
    """Return Stockfish's best move for the current position without playing it."""
    data = request.get_json()

    if not data or 'fen' not in data:
        return jsonify({'error': 'No FEN provided'}), 400

    fen = data['fen']

    def work():
        stockfish.set_fen_position(fen)
        best_move = stockfish.get_best_move()
        evaluation = stockfish.get_evaluation()
        return best_move, evaluation

    try:
        best_move, evaluation = _run_engine(work)
    except Exception as e:
        logging.error(f"Error processing hint: {e}")
        try:
            _restart_engine()
            best_move, evaluation = _run_engine(work)
        except Exception as retry_error:
            logging.error(f"Stockfish hint retry failed: {retry_error}")
            return jsonify({'error': 'Error processing position'}), 500

    if best_move is None:
        return jsonify({'error': 'No valid move found'}), 500

    return jsonify({'best_move': best_move, 'evaluation': evaluation})

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

    def work():
        stockfish.set_skill_level(skill_level)

    try:
        _run_engine(work)
    except Exception as e:
        logging.error(f"Error setting skill level: {e}")
        return jsonify({'error': 'Could not set skill level'}), 500

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

    try:
        evaluation = _evaluate_position(fen)
    except Exception as e:
        logging.error(f"Error evaluating FEN: {e}")
        return jsonify({'error': 'Error evaluating position'}), 500

    return jsonify({'evaluation': evaluation})

@app.route('/reset', methods=['POST'])
def reset_game():
    """
    Resets the move history and starts a new game.
    """
    global move_history
    move_history = []

    def work():
        stockfish.set_fen_position("startpos")

    try:
        _run_engine(work)
    except Exception as e:
        logging.error(f"Error resetting engine: {e}")

    return jsonify({'success': 'Game has been reset', 'move_history': move_history})

@app.route('/contact', endpoint='contact')
def contact():
    """Render the contact.html page."""
    return render_template('contact.html')

if __name__ == '__main__':
    # Bind to '0.0.0.0' to ensure the app is accessible in Railway or other cloud environments
    app.run(host='0.0.0.0', port=5000, debug=True)
