var board = null;
var game = new Chess();

var $board = $('#board');
var squareClass = 'square-55d63';
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

// Use the variables passed from HTML for the audio file paths
var moveSound = new Audio(moveSoundPath);
var captureSound = new Audio(captureSoundPath);


// Track AI difficulty (default to Easy)
var aiDifficulty = 1; // 1 = Easy, 2 = Medium, 3 = Hard

// Track player color
var playerColor = 'w'; // Default to white

// Highlight the last move made
var lastMoveSquares = [];

// Initialize the chessboard configuration
function initBoard() {
    board = Chessboard('board', {
        draggable: true,
        position: 'start',
        orientation: playerColor === 'w' ? 'white' : 'black',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoverSquare: onMouseoverSquare,
        onMouseoutSquare: onMouseoutSquare,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    });
    updateStatus();

    // If the player is black, let the AI (white) make the first move
    if (playerColor === 'b') {
        makeAIMove();
    }
}

// Add a function to toggle between white and black
document.getElementById('color-toggle').addEventListener('click', function () {
    playerColor = playerColor === 'w' ? 'b' : 'w'; // Switch the color
    board.orientation(playerColor === 'w' ? 'white' : 'black'); // Set board orientation
    resetGame(); // Reset game with the new color
});

function removeGreySquares() {
    $board.find('.' + squareClass).css('background', '');
    clearHighlight();
}

function clearHighlight() {
    lastMoveSquares.forEach(square => {
        $board.find('.square-' + square).removeClass('highlight');
    });
    lastMoveSquares = [];
}

function highlightMove(from, to) {
    clearHighlight();
    $board.find('.square-' + from).addClass('highlight');
    $board.find('.square-' + to).addClass('highlight');
    lastMoveSquares = [from, to];
}

function greySquare(square) {
    var $square = $board.find('.square-' + square);
    var background = whiteSquareGrey;
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey;
    }
    $square.css('background', background);
}

function onDragStart(source, piece, position, orientation) {
    // Prevent dragging if it's the opponent's turn or the game is over
    if (game.game_over()) return false;

    // Allow dragging only if it's the player's turn and they are dragging their own pieces
    if ((game.turn() === 'w' && playerColor === 'w' && piece.search(/^w/) === -1) ||
        (game.turn() === 'b' && playerColor === 'b' && piece.search(/^b/) === -1)) {
        return false;
    }
}

async function onDrop(source, target) {
    removeGreySquares();

    // Check if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });

    // If the move is illegal, revert the piece to its original position
    if (move === null) return 'snapback';

    highlightMove(source, target);

    // Play move sound
    moveSound.play();

    updateMoveHistory(move);
    updateStatus();

    // AI makes its move if it's the AI's turn (depends on player color)
    if (game.turn() !== playerColor) {
        await makeAIMove();
    }
}

function onMouseoverSquare(square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
}

function onMouseoutSquare(square, piece) {
    removeGreySquares();
}

function onSnapEnd() {
    board.position(game.fen());
}

async function makeAIMove() {
    if (game.game_over()) return;

    const fen = game.fen(); // Get the current game state in FEN notation

    const response = await fetch('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: fen, difficulty: aiDifficulty })
    });

    const data = await response.json();
    const aiMove = data.best_move; // AI's move in UCI notation

    const from = aiMove.substring(0, 2);
    const to = aiMove.substring(2, 4);
    const promotion = aiMove.length > 4 ? aiMove[4] : undefined;

    const move = game.move({
        from: from,
        to: to,
        promotion: promotion || 'q'
    });

    if (move === null) {
        alert('Invalid move from AI: ' + aiMove);
        return;
    }

    highlightMove(from, to);

    if (move.captured) {
        captureSound.play();
    } else {
        moveSound.play();
    }

    board.position(game.fen());
    updateMoveHistory(move);
    updateStatus();
}

function updateMoveHistory(move) {
    var historyElement = document.getElementById('move-history');
    var moveText = move.san;

    if (game.history().length % 2 === 0) {
        var lastListItem = historyElement.lastElementChild;
        if (lastListItem) {
            lastListItem.innerHTML += ' ' + moveText;
        }
    } else {
        var listItem = document.createElement('li');
        listItem.textContent = moveText;
        historyElement.appendChild(listItem);
    }
}

function updateStatus() {
    var status = '';

    if (game.in_checkmate()) {
        status = 'Game over - ' + (game.turn() === 'b' ? 'White' : 'Black') + ' wins by checkmate.';
    } else if (game.in_draw()) {
        status = 'Game over - Draw';
    } else {
        status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';

        if (game.in_check()) {
            status += ' - Check!';
        }
    }

    document.getElementById('game-status').textContent = status;
}

function resetGame() {
    game.reset();
    board.start();
    document.getElementById('move-history').innerHTML = '';
    updateStatus();
    removeGreySquares();
    board.orientation(playerColor === 'w' ? 'white' : 'black'); // Ensure board orientation is updated after reset

    // If player is black, let AI (white) start the game
    if (playerColor === 'b') {
        makeAIMove();
    }
}

document.getElementById('reset-btn').addEventListener('click', resetGame);

document.getElementById('undo-btn').addEventListener('click', function () {
    if (game.history().length < 2) return;

    game.undo();
    game.undo();
    board.position(game.fen());

    var historyElement = document.getElementById('move-history');
    if (historyElement.lastElementChild) {
        historyElement.removeChild(historyElement.lastElementChild);
    }

    updateStatus();
    removeGreySquares();
});

// Initialize the board when the script loads
initBoard();
