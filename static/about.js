(function () {
  var terminal = document.getElementById('dev-terminal');
  if (!terminal) return;

  var script = [
    { cmd: 'whoami', out: 'ailyn_diaz — software_engineer' },
    { cmd: 'status', out: 'MODE: building · FUEL: caffeine · SOUNDTRACK: lo-fi' },
    { cmd: 'git log -1 --oneline', out: 'feat: knightlife — stockfish on a clean board' },
    { cmd: 'make your move', out: null }
  ];

  var lineIdx = 0;
  var charIdx = 0;
  var phase = 'cmd';
  var currentLine = null;
  var currentOut = null;
  var pauseUntil = 0;

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function updateClock() {
    var el = document.getElementById('about-clock');
    if (!el) return;
    var d = new Date();
    el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function makeLine() {
    var row = document.createElement('p');
    row.className = 'term-line';
    return row;
  }

  function trimTerminal() {
    while (terminal.children.length > 8) {
      terminal.removeChild(terminal.firstChild);
    }
  }

  function startCommand() {
    if (lineIdx >= script.length) {
      lineIdx = 0;
    }

    trimTerminal();
    var step = script[lineIdx];
    currentLine = makeLine();
    currentLine.innerHTML =
      '<span class="term-prompt">$</span> <span class="term-cmd"></span><span class="term-cursor">_</span>';
    terminal.appendChild(currentLine);
    currentOut = null;
    charIdx = 0;
    phase = 'cmd';
    typeChar(step.cmd);
  }

  function typeChar(text) {
    var cmdEl = currentLine.querySelector('.term-cmd');
    if (charIdx < text.length) {
      cmdEl.textContent += text.charAt(charIdx);
      charIdx++;
      setTimeout(function () { typeChar(text); }, 28 + Math.random() * 22);
      return;
    }

    if (phase === 'cmd') {
      var step = script[lineIdx];
      currentLine.querySelector('.term-cursor').remove();
      if (step.out) {
        phase = 'out';
        charIdx = 0;
        currentOut = document.createElement('p');
        currentOut.className = 'term-out';
        terminal.appendChild(currentOut);
        setTimeout(function () { typeChar(step.out); }, 120);
      } else {
        currentLine.innerHTML +=
          '<span class="term-cursor term-cursor--hold">_</span>';
        lineIdx++;
        setTimeout(startCommand, 2400);
      }
      return;
    }

    if (phase === 'out') {
      if (charIdx < text.length) {
        currentOut.textContent += text.charAt(charIdx);
        charIdx++;
        setTimeout(function () { typeChar(text); }, 12 + Math.random() * 10);
        return;
      }
      lineIdx++;
      setTimeout(startCommand, 600);
    }
  }

  updateClock();
  setInterval(updateClock, 30000);
  setTimeout(startCommand, 400);
})();
