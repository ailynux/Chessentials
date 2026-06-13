var board = null;
var game = new Chess();
var prefs = ChessPrefs.load();

var $board = $('#chessboard');
var hintSquares = [];

var moveSound = new Audio(moveSoundPath);
var captureSound = new Audio(captureSoundPath);

var aiDifficulty = prefs.difficulty;
var playerColor = prefs.playerColor;
var boardTheme = prefs.boardTheme;
var pieceSet = prefs.pieceSet;
var moveHints = prefs.moveHints !== false;

function savePrefs() {
  ChessPrefs.patch({
    difficulty: aiDifficulty,
    playerColor: playerColor,
    boardTheme: boardTheme,
    pieceSet: pieceSet,
    moveHints: moveHints
  });
}

function updateMoveHintsUI() {
  var tip = document.getElementById('board-tip');
  if (tip) tip.classList.toggle('hidden', !moveHints);
  var toggle = document.getElementById('move-hints-toggle');
  if (toggle) toggle.checked = moveHints;
  if (!moveHints) clearMoveHints();
}

var lastMoveSquares = [];
var aiThinking = false;
var pendingPromotion = null;
var lastWinRecorded = false;

function applySquareColors() {
  var wrap = document.getElementById('board-wrap');
  wrap.className = 'board-wrap theme-' + boardTheme;
}

function pieceThemeFn(piece) {
  return ChessPrefs.pieceUrl(pieceSet, piece);
}

function buildBoard(position) {
  if (board) board.destroy();
  board = Chessboard('chessboard', {
    draggable: true,
    position: position || 'start',
    orientation: playerColor === 'w' ? 'white' : 'black',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    onSnapEnd: onSnapEnd,
    pieceTheme: pieceThemeFn
  });
}

function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('toast-show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () {
    toast.classList.remove('toast-show');
    setTimeout(function () { toast.classList.add('hidden'); }, 300);
  }, 3200);
}

function updatePlayerStats() {
  var p = ChessPrefs.load();
  var parts = [];
  if (p.wins) parts.push(p.wins + ' win' + (p.wins === 1 ? '' : 's') + ' vs Stockfish');
  if (p.puzzleStreak) parts.push(p.puzzleStreak + ' puzzle streak');
  document.getElementById('player-stats').textContent = parts.join(' · ');
}

function initCustomizeUI() {
  var swatches = document.getElementById('theme-swatches');
  Object.keys(ChessPrefs.boardThemes).forEach(function (id) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-swatch' + (id === boardTheme ? ' active' : '');
    btn.title = ChessPrefs.boardThemes[id].label;
    btn.dataset.theme = id;
    btn.innerHTML = '<span class="swatch-light" style="background:' + ChessPrefs.boardThemes[id].light + '"></span><span class="swatch-dark" style="background:' + ChessPrefs.boardThemes[id].dark + '"></span>';
    btn.addEventListener('click', function () {
      boardTheme = id;
      applySquareColors();
      swatches.querySelectorAll('.theme-swatch').forEach(function (el) {
        el.classList.toggle('active', el.dataset.theme === id);
      });
      savePrefs();
      showToast('Board: ' + ChessPrefs.boardThemes[id].label);
    });
    swatches.appendChild(btn);
  });

  var pieces = document.getElementById('piece-options');
  Object.keys(ChessPrefs.pieceSets).forEach(function (id) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn piece-option' + (id === pieceSet ? ' active' : '');
    btn.textContent = ChessPrefs.pieceSets[id].label;
    btn.dataset.pieces = id;
    btn.addEventListener('click', function () {
      pieceSet = id;
      pieces.querySelectorAll('.piece-option').forEach(function (el) {
        el.classList.toggle('active', el.dataset.pieces === id);
      });
      buildBoard(game.fen());
      savePrefs();
      showToast('Pieces: ' + ChessPrefs.pieceSets[id].label);
    });
    pieces.appendChild(btn);
  });

  var hintsToggle = document.getElementById('move-hints-toggle');
  if (hintsToggle) {
    hintsToggle.checked = moveHints;
    hintsToggle.addEventListener('change', function () {
      moveHints = hintsToggle.checked;
      savePrefs();
      updateMoveHintsUI();
      showToast(moveHints ? 'Move hints on' : 'Move hints off');
    });
  }
  updateMoveHintsUI();
}

function rebuildMoveHistory() {
  var historyElement = document.getElementById('move-history');
  historyElement.innerHTML = '';
  var moves = game.history();
  for (var i = 0; i < moves.length; i++) {
    updateMoveHistory({ san: moves[i] });
  }
}

function applyOpening(opening) {
  game.reset();
  opening.san.forEach(function (san) {
    var result = game.move(san);
    if (!result) console.warn('Invalid opening move:', san);
  });
  buildBoard(game.fen());
  document.getElementById('move-history').innerHTML = '';
  rebuildMoveHistory();
  clearMoveHints();
  document.getElementById('hint-text').classList.add('hidden');
  updateStatus();
  scrollToGame();

  if (!game.game_over() && game.turn() !== playerColor) {
    makeAIMove();
  } else {
    refreshEvaluation();
  }
  showToast(opening.name + ' loaded. Your move.');
}

function scrollToGame() {
  var area = document.getElementById('play-area');
  if (area) area.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initBoard() {
  applySquareColors();
  document.getElementById('difficulty').value = String(aiDifficulty);
  fetch('/set_skill_level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill_level: aiDifficulty })
  });

  buildBoard('start');
  initCustomizeUI();
  updatePlayerStats();
  updateStatus();

  var opening = ChessPrefs.consumePendingOpening();
  if (opening) {
    applyOpening(opening);
  } else if (playerColor === 'b') {
    makeAIMove();
  } else {
    refreshEvaluation();
  }

  if (window.location.hash === '#play' || window.location.hash === '#board') {
    scrollToGame();
  }
}

document.getElementById('color-toggle').addEventListener('click', function () {
  playerColor = playerColor === 'w' ? 'b' : 'w';
  savePrefs();
  board.orientation(playerColor === 'w' ? 'white' : 'black');
  resetGame();
});

function clearMoveHints() {
  hintSquares.forEach(function (square) {
    $board.find('.square-' + square).removeClass('square-hint-from square-hint-to square-hint-capture');
  });
  hintSquares = [];
}

function clearHighlight() {
  lastMoveSquares.forEach(function (square) {
    $board.find('.square-' + square).removeClass('highlight');
  });
  lastMoveSquares = [];
}

function addMoveHint(square, kind) {
  $board.find('.square-' + square).addClass('square-hint-' + kind);
  hintSquares.push(square);
}

function isPlayerPiece(piece) {
  if (!piece) return false;
  return (playerColor === 'w' && piece.charAt(0) === 'w') ||
    (playerColor === 'b' && piece.charAt(0) === 'b');
}

function highlightMove(from, to) {
  clearHighlight();
  $board.find('.square-' + from).addClass('highlight');
  $board.find('.square-' + to).addClass('highlight');
  lastMoveSquares = [from, to];
}

function onDragStart(source, piece, position, orientation) {
  if (game.game_over() || aiThinking) return false;
  if ((game.turn() === 'w' && playerColor === 'w' && piece.search(/^w/) === -1) ||
      (game.turn() === 'b' && playerColor === 'b' && piece.search(/^b/) === -1)) {
    return false;
  }

  clearMoveHints();
  if (!moveHints) return;

  var moves = game.moves({ square: source, verbose: true });
  addMoveHint(source, 'from');
  for (var i = 0; i < moves.length; i++) {
    addMoveHint(moves[i].to, moves[i].captured ? 'capture' : 'to');
  }
}

function isPromotionMove(source, target) {
  return game.moves({ square: source, verbose: true }).some(function (m) {
    return m.from === source && m.to === target && m.flags.indexOf('p') !== -1;
  });
}

function showPromotionModal(source, target) {
  pendingPromotion = { from: source, to: target };
  document.getElementById('promotion-modal').classList.remove('hidden');
}

function hidePromotionModal() {
  pendingPromotion = null;
  document.getElementById('promotion-modal').classList.add('hidden');
}

function completePromotion(pieceType) {
  if (!pendingPromotion) return;
  var from = pendingPromotion.from;
  var to = pendingPromotion.to;
  hidePromotionModal();
  finishMove(from, to, pieceType);
}

document.querySelectorAll('#promotion-modal [data-piece]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    completePromotion(btn.dataset.piece);
  });
});

async function onDrop(source, target) {
  clearMoveHints();
  document.getElementById('hint-text').classList.add('hidden');
  lastWinRecorded = false;

  if (isPromotionMove(source, target)) {
    showPromotionModal(source, target);
    return 'snapback';
  }

  var move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';

  await afterPlayerMove(move, source, target);
}

async function finishMove(source, target, promotion) {
  var move = game.move({ from: source, to: target, promotion: promotion || 'q' });
  if (move === null) {
    board.position(game.fen());
    return;
  }
  board.position(game.fen());
  await afterPlayerMove(move, source, target);
}

async function afterPlayerMove(move, source, target) {
  highlightMove(source, target);
  try { moveSound.play(); } catch (e) { /* autoplay blocked */ }
  updateMoveHistory(move);
  updateStatus();
  board.position(game.fen());

  if (!game.game_over() && game.turn() !== playerColor) {
    await makeAIMove();
  } else {
    await refreshEvaluation();
  }
}

function onMouseoverSquare(square, piece) {
  if (!moveHints || aiThinking || game.game_over() || game.turn() !== playerColor) return;
  if (!isPlayerPiece(piece)) return;

  clearMoveHints();
  var moves = game.moves({ square: square, verbose: true });
  if (!moves.length) return;

  addMoveHint(square, 'from');
  for (var i = 0; i < moves.length; i++) {
    addMoveHint(moves[i].to, moves[i].captured ? 'capture' : 'to');
  }
}

function onMouseoutSquare(square, piece) {
  clearMoveHints();
}

function onSnapEnd() {
  board.position(game.fen());
}

function uciToSan(uci) {
  var from = uci.substring(0, 2);
  var to = uci.substring(2, 4);
  var promo = uci.length > 4 ? uci[4] : undefined;
  var clone = new Chess(game.fen());
  var move = clone.move({ from: from, to: to, promotion: promo || 'q' });
  return move ? move.san : uci;
}

function playerRelativeCp(evaluation) {
  if (!evaluation || evaluation.type !== 'cp') return 0;
  return playerColor === 'w' ? evaluation.value : -evaluation.value;
}

function formatEval(evaluation) {
  if (!evaluation || evaluation.type === undefined) {
    return { text: 'Even', pct: 50, mood: 'Position is level.' };
  }

  if (evaluation.type === 'mate') {
    var mateIn = evaluation.value;
    var yours = (mateIn > 0 && playerColor === 'w') || (mateIn < 0 && playerColor === 'b');
    if (yours) {
      return { text: 'M' + Math.abs(mateIn), pct: 92, mood: 'Checkmate is coming. Finish it.' };
    }
    return { text: 'M' + Math.abs(mateIn) + ' (them)', pct: 8, mood: 'Survive. Find a perpetual or trap.' };
  }

  var cp = playerRelativeCp(evaluation);
  var text;
  var mood;
  if (Math.abs(cp) < 30) {
    text = 'Even';
    mood = 'Position is level.';
  } else if (cp >= 300) {
    text = '+' + (cp / 100).toFixed(1);
    mood = 'You are crushing. Do not blunder now.';
  } else if (cp >= 80) {
    text = '+' + (cp / 100).toFixed(1);
    mood = 'You are ahead. Keep the pressure.';
  } else if (cp > 0) {
    text = '+' + (cp / 100).toFixed(1);
    mood = 'Slight edge. Push it.';
  } else if (cp <= -300) {
    text = (cp / 100).toFixed(1);
    mood = 'Stockfish is dominating. Hints exist for a reason.';
  } else if (cp <= -80) {
    text = (cp / 100).toFixed(1);
    mood = 'You are down. Fight back.';
  } else {
    text = (cp / 100).toFixed(1);
    mood = 'Slightly worse. Stay sharp.';
  }

  var pct = 50 + Math.max(-45, Math.min(45, cp / 12));
  return { text: text, pct: pct, mood: mood };
}

function renderEvaluation(evaluation) {
  var formatted = formatEval(evaluation);
  document.getElementById('eval-text').textContent = formatted.text;
  document.getElementById('eval-bar').style.width = formatted.pct + '%';
  document.getElementById('eval-mood').textContent = formatted.mood;
  document.getElementById('eval-bar').classList.toggle('eval-winning', formatted.pct > 58);
  document.getElementById('eval-bar').classList.toggle('eval-losing', formatted.pct < 42);
}

async function refreshEvaluation() {
  try {
    var response = await fetch('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: game.fen() })
    });
    if (!response.ok) return;
    var data = await response.json();
    renderEvaluation(data.evaluation);
  } catch (e) {
    /* silent */
  }
}

async function makeAIMove() {
  if (game.game_over() || aiThinking) return;

  aiThinking = true;
  document.getElementById('game-status').textContent = 'Stockfish is thinking...';
  document.getElementById('game-status').classList.add('thinking');

  try {
    var response = await fetch('/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: game.fen() })
    });

    if (!response.ok) throw new Error('Engine error');

    var data = await response.json();
    var aiMove = data.best_move;
    var from = aiMove.substring(0, 2);
    var to = aiMove.substring(2, 4);
    var promotion = aiMove.length > 4 ? aiMove[4] : undefined;

    var move = game.move({ from: from, to: to, promotion: promotion || 'q' });
    if (move === null) throw new Error('Invalid AI move: ' + aiMove);

    highlightMove(from, to);
    if (move.captured) captureSound.play();
    else moveSound.play();

    board.position(game.fen());
    updateMoveHistory(move);
    updateStatus();
    if (data.evaluation) renderEvaluation(data.evaluation);
    else await refreshEvaluation();
  } catch (e) {
    console.error('AI move failed:', e);
    document.getElementById('game-status').textContent = 'Engine error. Hit Restart.';
  } finally {
    aiThinking = false;
    document.getElementById('game-status').classList.remove('thinking');
    updateStatus();
  }
}

function updateMoveHistory(move) {
  var historyElement = document.getElementById('move-history');
  var moveNum = Math.ceil(game.history().length / 2);

  if (game.history().length % 2 === 1) {
    var listItem = document.createElement('li');
    listItem.textContent = moveNum + '. ' + move.san;
    historyElement.appendChild(listItem);
  } else {
    historyElement.lastElementChild.textContent += ' ' + move.san;
  }
  historyElement.scrollTop = historyElement.scrollHeight;
}

function updateStatus() {
  if (aiThinking) return;

  var status = '';
  var youWon = false;
  var youLost = false;

  if (game.in_checkmate()) {
    var winner = game.turn() === 'b' ? 'White' : 'Black';
    status = 'Checkmate. ' + winner + ' wins.';
    youWon = (winner === 'White' && playerColor === 'w') || (winner === 'Black' && playerColor === 'b');
    youLost = !youWon;
    if (youWon && !lastWinRecorded) {
      lastWinRecorded = true;
      var wins = ChessPrefs.recordWin();
      updatePlayerStats();
      showToast('Victory! That\'s ' + wins + ' win' + (wins === 1 ? '' : 's') + ' vs Stockfish.');
    }
  } else if (game.in_draw()) {
    status = 'Draw.';
  } else if (game.in_stalemate()) {
    status = 'Stalemate. Draw.';
  } else {
    var side = game.turn() === 'w' ? 'White' : 'Black';
    status = side + ' to move' + (game.in_check() ? ' · Check!' : '');
    if (game.turn() === playerColor) status += ' (your turn)';
  }

  var el = document.getElementById('game-status');
  el.textContent = status;
  el.classList.toggle('status-win', youWon);
  el.classList.toggle('status-lose', youLost);
}

function resetGame() {
  lastWinRecorded = false;
  game.reset();
  if (board) {
    board.start();
    board.orientation(playerColor === 'w' ? 'white' : 'black');
  } else {
    buildBoard('start');
  }
  document.getElementById('move-history').innerHTML = '';
  document.getElementById('hint-text').classList.add('hidden');
  hidePromotionModal();
  updateStatus();
  clearMoveHints();
  fetch('/reset', { method: 'POST' });
  if (playerColor === 'b') {
    makeAIMove();
  } else {
    refreshEvaluation();
  }
}

document.getElementById('reset-btn').addEventListener('click', resetGame);

document.getElementById('difficulty').addEventListener('change', function () {
  aiDifficulty = parseInt(this.value, 10);
  savePrefs();
  fetch('/set_skill_level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill_level: aiDifficulty })
  });
  showToast('Difficulty updated.');
});

document.getElementById('hint-btn').addEventListener('click', async function () {
  if (game.game_over() || aiThinking || game.turn() !== playerColor) return;

  var hintEl = document.getElementById('hint-text');
  hintEl.textContent = 'Thinking...';
  hintEl.classList.remove('hidden');

  try {
    var response = await fetch('/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: game.fen() })
    });
    if (!response.ok) throw new Error('Hint failed');
    var data = await response.json();
    hintEl.textContent = 'Hint: ' + uciToSan(data.best_move);
    if (data.evaluation) renderEvaluation(data.evaluation);
  } catch (e) {
    hintEl.textContent = 'Hint unavailable right now.';
  }
});

document.getElementById('undo-btn').addEventListener('click', function () {
  if (aiThinking || game.history().length < 2) return;

  game.undo();
  game.undo();
  board.position(game.fen());

  var historyElement = document.getElementById('move-history');
  if (historyElement.lastElementChild) {
    historyElement.removeChild(historyElement.lastElementChild);
  }

  document.getElementById('hint-text').classList.add('hidden');
  lastWinRecorded = false;
  updateStatus();
  clearMoveHints();
  refreshEvaluation();
});

initBoard();
