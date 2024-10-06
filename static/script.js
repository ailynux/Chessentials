var board = null;
var game = new Chess();

var $board = $('#board');
var squareClass = 'square-55d63';
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

// Add sounds for moves
var moveSound = new Audio('path-to-sound/move.mp3');
var captureSound = new Audio('path-to-sound/capture.mp3');
// Track AI difficulty (default to Easy)
var aiDifficulty = 1; // 1 = Easy, 2 = Medium, 3 = Hard
// Highlight the last move made
var lastMoveSquares = [];

function removeGreySquares() {
    $board.find('.' + squareClass).css('background', '');
    clearHighlight();
}

// Clear the highlights from previous move
function clearHighlight() {
    lastMoveSquares.forEach(square => {
        $board.find('.square-' + square).removeClass('highlight');
    });
    lastMoveSquares = [];
}

// Add a highlight for the move
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
    // Do not pick up pieces if the game is over or it's not the player's turn
    if (game.game_over() || game.turn() !== 'w' || piece.search(/^b/) !== -1) {
        return false;
    }
}

async function onDrop(source, target) {
    removeGreySquares();

    // See if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });

    // Illegal move
    if (move === null) return 'snapback';

    highlightMove(source, target);

    // Play move sound
    moveSound.play();

    updateMoveHistory(move);
    updateStatus();

    // AI to play
    await makeAIMove();
}

function onMouseoverSquare(square, piece) {
    // Get moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // Exit if there are no moves available for this square
    if (moves.length === 0) return;

    // Highlight the square they moused over
    greySquare(square);

    // Highlight the possible squares for this piece
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
    console.log('Sending FEN:', fen); // Debugging statement

    // Send the FEN and difficulty to the server
    const response = await fetch('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: fen, difficulty: aiDifficulty }) // Include difficulty
    });

    if (!response.ok) {
        alert('Server error: ' + response.statusText);
        return;
    }

    const data = await response.json();

    if (data.error) {
        alert('Error from server: ' + data.error);
        return;
    }

    // Apply the AI's move
    const aiMove = data.best_move; // AI's move in UCI notation (e.g., 'd7d5')
    const from = aiMove.substring(0, 2);
    const to = aiMove.substring(2, 4);
    const promotion = aiMove.length > 4 ? aiMove[4] : undefined;

    const move = game.move({
        from: from,
        to: to,
        promotion: promotion || 'q' // Default to queen promotion if undefined
    });

    if (move === null) {
        alert('Invalid move from AI: ' + aiMove);
        return;
    }

    // Highlight the move
    highlightMove(from, to);

    // Play capture sound if a piece was captured
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
        // Black move
        var lastListItem = historyElement.lastElementChild;
        if (lastListItem) {
            lastListItem.innerHTML += ' ' + moveText;
        }
    } else {
        // White move
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

document.getElementById('reset-btn').addEventListener('click', function() {
    game.reset();
    board.start();
    document.getElementById('move-history').innerHTML = '';
    updateStatus();
    removeGreySquares();
});

document.getElementById('undo-btn').addEventListener('click', function() {
    if (game.history().length < 2) return; // No moves to undo

    game.undo(); // Undo AI move
    game.undo(); // Undo player move
    board.position(game.fen());

    // Remove last move from move history
    var historyElement = document.getElementById('move-history');
    if (historyElement.lastElementChild) {
        historyElement.removeChild(historyElement.lastElementChild);
    }

    updateStatus();
    removeGreySquares();
});

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
};

board = Chessboard('board', config);

// Initial status update
updateStatus();
