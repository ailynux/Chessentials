(function () {
  /* ── Strategy: quiz ── */
  var questionText = document.getElementById('question-text');
  if (questionText) {
    var questions = [
      {
        q: 'What is the main goal of the opening phase?',
        opts: [
          { t: 'Develop pieces and control the center', ok: true, why: 'Development and central control set up everything that follows.' },
          { t: 'Attack the king immediately', ok: false, why: 'Premature attacks usually fail without development.' },
          { t: 'Trade all your pieces', ok: false, why: 'Trading without a plan often helps your opponent.' }
        ]
      },
      {
        q: 'What does "castling" accomplish?',
        opts: [
          { t: 'Safeguard the king and activate the rook', ok: true, why: 'Castling tucks the king away and connects your rooks.' },
          { t: 'Promote a pawn', ok: false, why: 'Only reaching the back rank promotes a pawn.' },
          { t: 'Capture en passant', ok: false, why: 'En passant is a special pawn capture, not castling.' }
        ]
      },
      {
        q: 'Which piece is worth the most (excluding the king)?',
        opts: [
          { t: 'Queen', ok: true, why: 'The queen combines rook and bishop movement.' },
          { t: 'Knight', ok: false, why: 'Knights are valuable but worth less than a queen.' },
          { t: 'Pawn', ok: false, why: 'Pawns are the weakest piece on the board.' }
        ]
      },
      {
        q: 'What is a "fork"?',
        opts: [
          { t: 'One piece attacking two or more enemy pieces', ok: true, why: 'Forks win material because the opponent cannot save everything.' },
          { t: 'Trading queens', ok: false, why: 'A queen trade is just an exchange, not a fork.' },
          { t: 'Moving the king twice', ok: false, why: 'Kings cannot move twice in a row legally.' }
        ]
      },
      {
        q: 'In the endgame, why does the king become stronger?',
        opts: [
          { t: 'Fewer pieces mean less danger, so the king can advance', ok: true, why: 'With less firepower on the board, the king becomes an active fighting piece.' },
          { t: 'The king gains new moves', ok: false, why: 'The king\'s movement never changes.' },
          { t: 'Pawns become queens automatically', ok: false, why: 'Pawns still have to reach the back rank.' }
        ]
      }
    ];
    var idx = 0, score = 0, answered = false;
    var optsEl = document.getElementById('answer-options');
    var feedback = document.getElementById('feedback');
    var nextBtn = document.getElementById('next-question');
    var finalEl = document.getElementById('final-score');
    var weekMsg = document.getElementById('next-week-message');

    function showQ() {
      answered = false;
      var q = questions[idx];
      questionText.textContent = q.q;
      optsEl.innerHTML = '';
      q.opts.forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'btn quiz-option';
        b.textContent = o.t;
        b.onclick = function () {
          if (answered) return;
          answered = true;
          optsEl.querySelectorAll('button').forEach(function (btn) { btn.disabled = true; });
          if (o.ok) {
            feedback.textContent = 'Correct. ' + o.why;
            feedback.className = 'feedback-msg ok';
            score++;
          } else {
            feedback.textContent = 'Not quite. ' + o.why;
            feedback.className = 'feedback-msg err';
          }
          feedback.classList.remove('hidden');
          nextBtn.classList.remove('hidden');
        };
        optsEl.appendChild(b);
      });
      feedback.classList.add('hidden');
      nextBtn.classList.add('hidden');
    }

    nextBtn.addEventListener('click', function () {
      idx++;
      if (idx < questions.length) showQ();
      else {
        questionText.classList.add('hidden');
        optsEl.classList.add('hidden');
        feedback.classList.add('hidden');
        nextBtn.classList.add('hidden');
        finalEl.textContent = score + ' / ' + questions.length + ' correct.';
        if (score === questions.length) {
          finalEl.textContent += ' Perfect. You actually know this stuff.';
        } else if (score >= questions.length - 1) {
          finalEl.textContent += ' Solid. One more pass and you\'re sharp.';
        }
        finalEl.classList.remove('hidden');
        weekMsg.classList.remove('hidden');
      }
    });
    showQ();
  }

  /* ── Strategy: opening generator ── */
  var genBtn = document.getElementById('generate-opening');
  var tryBtn = document.getElementById('try-opening');
  var currentOpening = null;
  if (genBtn) {
    var openings = [
      { name: 'Ruy Lopez', label: '1.e4 e5 2.Nf3 Nc6 3.Bb5', san: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
      { name: 'Sicilian Defense', label: '1.e4 c5', san: ['e4', 'c5'] },
      { name: 'French Defense', label: '1.e4 e6', san: ['e4', 'e6'] },
      { name: 'Queen\'s Gambit', label: '1.d4 d5 2.c4', san: ['d4', 'd5', 'c4'] },
      { name: 'King\'s Indian', label: '1.d4 Nf6 2.c4 g6', san: ['d4', 'Nf6', 'c4', 'g6'] },
      { name: 'Caro-Kann', label: '1.e4 c6', san: ['e4', 'c6'] },
      { name: 'English Opening', label: '1.c4', san: ['c4'] },
      { name: 'Italian Game', label: '1.e4 e5 2.Nf3 Nc6 3.Bc4', san: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
      { name: 'Scotch Game', label: '1.e4 e5 2.Nf3 Nc6 3.d4', san: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
      { name: 'London System', label: '1.d4 d5 2.Bf4', san: ['d4', 'd5', 'Bf4'] },
      { name: 'Nimzo-Indian', label: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', san: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
      { name: 'Petroff Defense', label: '1.e4 e5 2.Nf3 Nf6', san: ['e4', 'e5', 'Nf3', 'Nf6'] }
    ];
    var count = 0;
    genBtn.addEventListener('click', function () {
      currentOpening = openings[Math.floor(Math.random() * openings.length)];
      var el = document.getElementById('opening-result');
      el.innerHTML = '<strong>' + currentOpening.name + '</strong><br><span style="font-size:0.85rem;color:var(--gray)">' + currentOpening.label + '</span>';
      el.classList.remove('hidden');
      if (tryBtn) tryBtn.classList.remove('hidden');
      count++;
      document.getElementById('opening-count').textContent = count;
      document.getElementById('openings-counter').classList.remove('hidden');
    });

    if (tryBtn) {
      tryBtn.addEventListener('click', function () {
        if (!currentOpening) return;
        ChessPrefs.setPendingOpening(currentOpening);
        window.location.href = '/#play';
      });
    }
  }

  /* ── Endgame: pathways ── */
  var pathBtns = document.querySelectorAll('.endgame-path');
  if (pathBtns.length) {
    var paths = {
      kingPawn: {
        title: 'King & Pawn Endgames',
        desc: 'Use opposition to win pawn races. Keep your king in front of your passed pawn and avoid stalemate traps.'
      },
      rookPiece: {
        title: 'Rook & Minor Piece Endgames',
        desc: 'Activate your rook on open files and the 7th rank. Cut off the enemy king from its pawns.'
      },
      activeKing: {
        title: 'Active King Strategies',
        desc: 'March the king toward the center in the endgame. It is a fighting piece, not a spectator.'
      }
    };
    var progress = 0;
    var bar = document.getElementById('progress');
    var content = document.getElementById('pathway-content');
    var advice = document.getElementById('character-advice-text');
    var visited = {};

    pathBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.path;
        var p = paths[key];
        document.getElementById('pathway-title').textContent = p.title;
        document.getElementById('pathway-description').textContent = p.desc;
        content.classList.remove('hidden');
        if (!visited[key]) {
          visited[key] = true;
          progress = Math.min(progress + 34, 100);
          bar.style.width = progress + '%';
        }
        if (progress >= 100) {
          bar.classList.add('completed');
          advice.textContent = 'All three paths explored. Take it to the board.';
        } else {
          advice.textContent = p.desc;
        }
      });
    });
  }

  /* ── Endgame: challenges ── */
  var fenEl = document.getElementById('fen-text');
  if (fenEl) {
    var streakEl = document.getElementById('puzzle-streak');
    function refreshStreakLabel() {
      var s = ChessPrefs.load().puzzleStreak || 0;
      if (streakEl) streakEl.textContent = s ? 'Current streak: ' + s + ' solved' : '';
    }
    refreshStreakLabel();
    var challenges = [
      {
        fen: '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1',
        moves: ['Ke2', 'Kd2', 'f4'],
        ok: 'Ke2',
        msg: 'Ke2 supports the pawn and fights for opposition.'
      },
      {
        fen: '6k1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1',
        moves: ['Rf7', 'Rg1+', 'h4'],
        ok: 'Rf7',
        msg: 'Rf7 attacks the pawns from behind. Classic rook endgame technique.'
      },
      {
        fen: '8/8/2k5/8/3P4/2K5/8/8 w - - 0 1',
        moves: ['Kc4', 'd5', 'Kb4'],
        ok: 'Kc4',
        msg: 'Kc4 escorts the d-pawn with the king. The king leads the pawn forward.'
      },
      {
        fen: '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
        moves: ['Qe4+', 'Qe7+', 'Kd2'],
        ok: 'Qe4+',
        msg: 'Qe4+ forces the king to a worse square. Queen endgames are about checks and cutoffs.'
      },
      {
        fen: '8/5k2/8/8/8/8/5K2/8 w - - 0 1',
        moves: ['Ke3', 'Kd3', 'Kf3'],
        ok: 'Ke3',
        msg: 'Ke3 steps toward the center. In king endings, every tempo matters.'
      },
      {
        fen: '8/8/8/8/8/4k3/3P4/4K3 w - - 0 1',
        moves: ['Kd1', 'Kf1', 'd4'],
        ok: 'Kd1',
        msg: 'Kd1 prepares to escort the pawn. Do not rush the pawn without the king.'
      }
    ];
    var ci = 0;
    var movesBox = document.getElementById('challenge-moves');
    var cFeedback = document.getElementById('challenge-feedback');
    var solved = false;

    function loadChallenge() {
      solved = false;
      var c = challenges[ci];
      fenEl.textContent = c.fen;
      movesBox.innerHTML = '';
      cFeedback.textContent = '';
      cFeedback.className = 'feedback-msg';
      c.moves.forEach(function (m) {
        var b = document.createElement('button');
        b.className = 'btn';
        b.textContent = m;
        b.onclick = function () {
          if (solved) return;
          if (m === c.ok) {
            var streak = ChessPrefs.recordPuzzleSuccess();
            cFeedback.textContent = '✓ ' + c.msg + (streak > 1 ? ' (' + streak + ' in a row!)' : '');
            cFeedback.className = 'feedback-msg ok';
            solved = true;
            refreshStreakLabel();
          } else {
            ChessPrefs.resetPuzzleStreak();
            refreshStreakLabel();
            cFeedback.textContent = '✗ Not the best move. Try again.';
            cFeedback.className = 'feedback-msg err';
          }
        };
        movesBox.appendChild(b);
      });
    }

    document.getElementById('next-challenge').addEventListener('click', function () {
      ci = (ci + 1) % challenges.length;
      loadChallenge();
    });
    loadChallenge();
  }
})();
