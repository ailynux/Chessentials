// static/script.js

var board = null;
var game = new Chess();

function onDragStart(source, piece, position, orientation) {
    // Prevent moves if the game is over or if it's not the player's turn
    if (game.game_over() || game.turn() !== 'w' || piece.search(/^b/) !== -1) {
        return false;
    }
}

async function onDrop(source, target) {
    // See if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });

    // Illegal move
    if (move === null) return 'snapback';

    updateMoveHistory(move);
    updateStatus();

    // AI to play
    await makeAIMove();
}

function onSnapEnd() {
    board.position(game.fen());
}

async function makeAIMove() {
    if (game.game_over()) return;

    const fen = game.fen(); // Get the current game state in FEN notation
    console.log('Sending FEN:', fen); // Debugging statement

    // Send the FEN to the server
    const response = await fetch('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: fen })
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
    console.log('AI Move:', aiMove); // Debugging statement

    // Parse the AI's move to get 'from' and 'to' squares
    const from = aiMove.substring(0, 2);
    const to = aiMove.substring(2, 4);
    const promotion = aiMove.length > 4 ? aiMove[4] : undefined;

    // Construct the move object
    const move = game.move({
        from: from,
        to: to,
        promotion: promotion || 'q' // Default to queen promotion if undefined
    });

    if (move === null) {
        alert('Invalid move from AI: ' + aiMove);
        return;
    }

    board.position(game.fen());
    updateMoveHistory(move);
    updateStatus();
}


function updateMoveHistory(move) {
    var historyElement = document.getElementById('move-history');
    var moveText = '';

    if (typeof move === 'object') {
        moveText = move.san;
    } else {
        // For AI moves, move is in algebraic notation
        moveText = game.pgn({ max_width: 5 }).split(/\d+\./).pop().trim().split(' ').pop();
    }

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
});

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
};

board = Chessboard('board', config);

// Initial status update
updateStatus();
