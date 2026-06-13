/* Shared preferences, themes, and cross-page helpers */
var ChessPrefs = (function () {
  var KEY = 'chessentials_v1';
  var OPENING_KEY = 'chessentials_opening';

  var defaults = {
    difficulty: 1,
    playerColor: 'w',
    boardTheme: 'gothic',
    pieceSet: 'cburnett',
    wins: 0,
    puzzleStreak: 0
  };

  var boardThemes = {
    gothic: { light: '#2a2a2a', dark: '#0a0a0a', label: 'Gothic' },
    classic: { light: '#f0d9b5', dark: '#b58863', label: 'Classic' },
    blood: { light: '#3d2020', dark: '#140808', label: 'Blood' },
    frost: { light: '#3d4f5f', dark: '#1a2430', label: 'Frost' }
  };

  var pieceSets = {
    cburnett: { label: 'Burnett', lichess: 'cburnett' },
    maestro: { label: 'Maestro', lichess: 'maestro' },
    staunty: { label: 'Staunty', lichess: 'staunty' },
    classic: { label: 'Classic', wikipedia: true }
  };

  function load() {
    try {
      var prefs = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}'));
      if (prefs.pieceSet === 'metal') prefs.pieceSet = 'staunty';
      if (!pieceSets[prefs.pieceSet]) prefs.pieceSet = defaults.pieceSet;
      return prefs;
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function save(prefs) {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function patch(updates) {
    var prefs = load();
    Object.assign(prefs, updates);
    save(prefs);
    return prefs;
  }

  function pieceUrl(setId, piece) {
    var set = pieceSets[setId] || pieceSets.cburnett;
    if (set.wikipedia) {
      return 'https://chessboardjs.com/img/chesspieces/wikipedia/' + piece + '.png';
    }
    var code = piece.charAt(0) + piece.charAt(1).toUpperCase();
    return 'https://lichess1.org/assets/piece/' + set.lichess + '/' + code + '.svg';
  }

  function setPendingOpening(opening) {
    sessionStorage.setItem(OPENING_KEY, JSON.stringify(opening));
  }

  function consumePendingOpening() {
    var raw = sessionStorage.getItem(OPENING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(OPENING_KEY);
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function recordWin() {
    var prefs = load();
    prefs.wins = (prefs.wins || 0) + 1;
    save(prefs);
    return prefs.wins;
  }

  function recordPuzzleSuccess() {
    var prefs = load();
    prefs.puzzleStreak = (prefs.puzzleStreak || 0) + 1;
    save(prefs);
    return prefs.puzzleStreak;
  }

  function resetPuzzleStreak() {
    patch({ puzzleStreak: 0 });
  }

  return {
    load: load,
    save: save,
    patch: patch,
    boardThemes: boardThemes,
    pieceSets: pieceSets,
    pieceUrl: pieceUrl,
    setPendingOpening: setPendingOpening,
    consumePendingOpening: consumePendingOpening,
    recordWin: recordWin,
    recordPuzzleSuccess: recordPuzzleSuccess,
    resetPuzzleStreak: resetPuzzleStreak
  };
})();
