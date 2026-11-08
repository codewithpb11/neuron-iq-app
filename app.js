/* Neuron: a self-contained brain-training experience. Assessment scores are illustrative, not diagnostic. */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
function loadGameLevels() { try { return JSON.parse(localStorage.getItem('neuronGameLevels')) || {}; } catch (_) { return {}; } }
const state = {
  score: Number(localStorage.getItem('neuronScore')) || null,
  sessions: Number(localStorage.getItem('neuronSessions')) || 0,
  streak: Number(localStorage.getItem('neuronStreak')) || 1,
  quizIndex: 0,
  answers: [],
  elapsedSeconds: 0,
  assessmentStartedAt: null,
  timerId: null,
  activeGame: null,
  sound: true,
  gameLevels: loadGameLevels(),
  puzzlePicture: localStorage.getItem('neuronPuzzlePicture') || 'lake'
};
state.chessLevel = Math.min(10, Math.max(1, Number(localStorage.getItem('neuronChessLevel')) || 1));

// Each item ends with a rough difficulty anchor (-1.2 easy to +1.0 challenging).
// The anchors make harder items matter more in the estimate without pretending this
// unnormed practice test is equivalent to a professionally standardized IQ test.
const quizQuestions = [
  ['Numerical reasoning', '2 · 6 · 12 · 20 · ?', 'Which number completes the sequence?', ['24', '28', '30', '32'], 2, -0.2],
  ['Pattern recognition', '△  ○  △  ○  △  ?', 'What comes next?', ['△', '○', '□', '◇'], 1, -1.2],
  ['Verbal reasoning', 'BOOK is to READING as FORK is to …', 'Choose the closest relationship.', ['drawing', 'eating', 'writing', 'walking'], 1, -1.0],
  ['Numerical reasoning', '81 · 27 · 9 · 3 · ?', 'Which number completes the sequence?', ['0', '1', '2', '6'], 1, -1.3],
  ['Logic', 'Every astrophysicist is a scientist. Some scientists are musicians. No musician is a pilot.', 'Which conclusion must be true?', ['All astrophysicists are pilots.', 'Some astrophysicists are musicians.', 'Some scientists are not pilots.', 'No scientist is a pilot.'], 2, 0.7],
  ['Pattern recognition', '■ ■ □  ■ ■ □  ■ ?', 'What comes next?', ['■', '□', '■ ■', '□ □'], 0, -1.0],
  ['Numerical reasoning', '5 · 11 · 23 · 47 · ?', 'Find the next number.', ['71', '84', '95', '97'], 2, 0.0],
  ['Verbal reasoning', 'AQUATIC is to WATER as ARBOREAL is to …', 'Choose the closest relationship.', ['trees', 'stone', 'metal', 'clouds'], 0, -0.3],
  ['Spatial reasoning', '↑  →  ↓  ←  ?', 'A pointer rotates by a quarter turn each step. What follows?', ['↑', '→', '↓', '←'], 0, -0.8],
  ['Logic', 'Mia is older than Sam. Sam is older than Ali.', 'Who is youngest?', ['Mia', 'Sam', 'Ali', 'Cannot tell'], 2, -1.0],
  ['Numerical reasoning', '1 · 2 · 6 · 15 · 31 · ?', 'Which number completes the sequence?', ['47', '52', '56', '63'], 2, 1.0],
  ['Verbal reasoning', 'LACONIC most nearly means …', 'Choose the closest meaning.', ['brief', 'musical', 'angry', 'careless'], 0, 0.5],
  ['Pattern recognition', '■  □ □  ■ ■  □ □ □  ■ ■ ■  □ □ □ □  ?', 'Which block comes next?', ['■ ■ ■ ■', '□ □ □ □', '■ ■ ■', '□ □ □'], 0, 0.7],
  ['Numerical reasoning', '14 · 17 · 23 · 32 · 44 · ?', 'What comes next?', ['54', '57', '59', '61'], 2, 0.0],
  ['Logic', 'If today is Wednesday, what day will it be in 100 days?', 'Work it out without a calendar.', ['Thursday', 'Friday', 'Saturday', 'Sunday'], 1, 0.4],
  ['Verbal reasoning', 'METICULOUS most nearly means …', 'Choose the best definition.', ['careful', 'sleepy', 'loud', 'ordinary'], 0, 0.4],
  ['Numerical reasoning', '2 · 3 · 5 · 9 · 17 · ?', 'Which number completes the sequence?', ['25', '31', '33', '35'], 2, 0.8],
  ['Spatial reasoning', '↗  →  ↘  ↓  ?', 'A pointer rotates by 45° each step. What follows?', ['←', '↙', '↖', '↑'], 1, -0.1],
  ['Logic', 'Four people stand in a line. B is somewhere after A. C is immediately before D. A is after D.', 'Who must stand first?', ['A', 'B', 'C', 'D'], 2, 0.3],
  ['Numerical reasoning', '4 · 6 · 12 · 14 · 28 · 30 · ?', 'Find the next number.', ['32', '48', '56', '60'], 3, 0.5],
  ['Verbal reasoning', 'Which pair has the most similar meaning?', 'Choose one pair.', ['tiny / small', 'cold / bright', 'soft / rough', 'fast / slow'], 0, -1.0],
  ['Pattern recognition', 'B2 · E6 · I12 · N20 · ?', 'Which item comes next?', ['S28', 'T28', 'T30', 'U30'], 2, 1.0],
  ['Logic', 'Three boxes are labelled “coins”, “stamps”, and “coins + stamps”. Every label is wrong. You pick a coin from the box labelled “coins + stamps”. What does that box contain?', 'Use the “all labels are wrong” rule.', ['coins only', 'stamps only', 'coins and stamps', 'Cannot tell'], 0, 1.0],
  ['Numerical reasoning', '2 · 7 · 16 · 29 · 46 · ?', 'Which number completes the sequence?', ['61', '65', '67', '69'], 2, 1.0],
  ['Verbal reasoning', 'BIRD is to NEST as BEE is to …', 'Choose the closest relationship.', ['hive', 'honey', 'wing', 'flower'], 0, -0.8],
  ['Pattern recognition', 'ACE · BDF · CEG · ?', 'Which group comes next?', ['CDF', 'DFG', 'DFH', 'EGI'], 2, 0.3],
  ['Logic', 'Four books are stacked: blue over green, green over yellow, yellow over red.', 'Which book is on top?', ['red', 'yellow', 'green', 'blue'], 3, -0.7],
  ['Numerical reasoning', '64 · 32 · 16 · 8 · ?', 'Which number completes the sequence?', ['2', '4', '6', '10'], 1, -1.0],
  ['Verbal reasoning', 'MALLEABLE is to FLEXIBLE as BRITTLE is to …', 'Choose the closest relationship.', ['fragile', 'shiny', 'large', 'silent'], 0, 0.4],
  ['Logic', 'A clock shows 3:20. What is the smaller angle between its hands?', 'Choose the correct angle.', ['10°', '20°', '30°', '40°'], 1, 0.9]
];

const assessmentGroups = {
  Numerical: [0, 3, 6, 10, 13, 16, 19, 23, 27],
  Verbal: [2, 7, 11, 15, 20, 24, 28],
  Logic: [4, 9, 14, 18, 22, 26, 29],
  Patterns: [1, 5, 8, 12, 17, 21, 25]
};

const games = [
  { id: 'word', title: 'Word Connect', icon: '✎', skill: 'VERBAL FLUENCY', desc: 'Build words from a small letter wheel.', theme: 'purple' },
  { id: 'chess', title: 'Chess', icon: '♞', skill: 'STRATEGY', desc: 'Practice planning with a light computer opponent.', theme: 'gold' },
  { id: 'connect4', title: 'Connect 4', icon: '●', skill: 'FORESIGHT', desc: 'Spot lines and block your opponent.', theme: 'teal' },
  { id: 'memory', title: 'Memory Match', icon: '✦', skill: 'WORKING MEMORY', desc: 'Remember positions and match every pair.', theme: 'pink' },
  { id: '2048', title: '2048', icon: '2⁰⁴⁸', skill: 'FLEXIBLE THINKING', desc: 'Merge tiles without filling the board.', theme: 'gold' },
  { id: 'tictactoe', title: 'Tic-Tac-Toe', icon: '×', skill: 'LOGIC', desc: 'Find the fork before the computer does.', theme: 'purple' },
  { id: 'puzzle', title: 'Jigsaw Puzzle', icon: '▧', skill: 'VISUAL-SPATIAL', desc: 'Rebuild the picture one piece at a time.', theme: 'teal' },
  { id: 'sudoku', title: 'Sudoku', icon: '▦', skill: 'DEDUCTIVE REASONING', desc: 'Place every number using pure logic.', theme: 'pink' }
];

// These are deliberately spaced so every step changes the bot's decision quality.
// They are practice targets, not certified FIDE ratings.
const chessLevels = [
  { level: 1, elo: 200, title: 'Rookie', depth: 0, mistake: 1, nodes: 0, root: 99, note: 'Mostly random moves' },
  { level: 2, elo: 500, title: 'Starter', depth: 1, mistake: .72, nodes: 120, root: 99, note: 'Notices easy captures' },
  { level: 3, elo: 700, title: 'Learner', depth: 1, mistake: .46, nodes: 260, root: 99, note: 'Basic material choices' },
  { level: 4, elo: 900, title: 'Club', depth: 1, mistake: .24, nodes: 520, root: 99, note: 'Avoids obvious losses' },
  { level: 5, elo: 1200, title: 'Developing', depth: 2, mistake: .30, nodes: 1600, root: 22, note: 'Calculates one reply' },
  { level: 6, elo: 1400, title: 'Tournament', depth: 2, mistake: .12, nodes: 3000, root: 26, engine: true, time: 140, note: 'Stockfish positional play' },
  { level: 7, elo: 1700, title: 'Advanced', depth: 3, mistake: .17, nodes: 7000, root: 22, engine: true, time: 220, note: 'Stockfish tactical vision' },
  { level: 8, elo: 1900, title: 'Expert', depth: 3, mistake: .06, nodes: 13000, root: 27, engine: true, time: 360, note: 'Stockfish calculation' },
  { level: 9, elo: 2200, title: 'Master', depth: 4, mistake: .025, nodes: 26000, root: 22, engine: true, time: 600, note: 'Deep Stockfish pressure' },
  { level: 10, elo: 2400, title: 'Grandmaster challenge', depth: 4, mistake: 0, nodes: 48000, root: 30, engine: true, time: 950, note: 'Maximum Stockfish analysis' }
];

const gameLevelProfiles = {
  word: [
    ['Warm-up', '3 letters · find 3 words'], ['Starter', '3 letters · find 4 words'], ['Explorer', '5 letters · find 7 words'], ['Builder', '5 letters · find 9 words'], ['Solver', '6 letters · find 10 words'], ['Thinker', '5 letters · find 11 words'], ['Wordsmith', '6 letters · find 12 words'], ['Linguist', '6 letters · find 13 words'], ['Lexicon', '8 letters · find 14 words'], ['Virtuoso', '8 letters · find 15 words']
  ],
  connect4: [
    ['Warm-up', 'Random replies'], ['Starter', 'Spots easy captures'], ['Learner', 'Blocks simple wins'], ['Club', '1-ply planning'], ['Builder', '2-ply planning'], ['Tournament', '3-ply planning'], ['Advanced', '4-ply planning'], ['Expert', '5-ply planning'], ['Master', '6-ply planning'], ['Challenge', '7-ply planning']
  ],
  memory: [
    ['Warm-up', '3 pairs · 4 sec preview'], ['Starter', '4 pairs · 3.5 sec preview'], ['Learner', '4 pairs · 3 sec preview'], ['Club', '5 pairs · 2.7 sec preview'], ['Builder', '6 pairs · 2.4 sec preview'], ['Thinker', '8 pairs · 2.1 sec preview'], ['Advanced', '8 pairs · 1.8 sec preview'], ['Expert', '10 pairs · 1.5 sec preview'], ['Master', '12 pairs · 1.2 sec preview'], ['Challenge', '12 pairs · 0.9 sec preview']
  ],
  '2048': [
    ['Warm-up', 'Reach 16'], ['Starter', 'Reach 32'], ['Learner', 'Reach 64'], ['Club', 'Reach 128'], ['Builder', 'Reach 256'], ['Thinker', 'Reach 512'], ['Advanced', 'Reach 512 from clutter'], ['Expert', 'Reach 1024'], ['Master', 'Reach 1024 from clutter'], ['Challenge', 'Reach 2048']
  ],
  tictactoe: [
    ['Warm-up', 'Random replies'], ['Starter', 'Occasional blocks'], ['Learner', 'Looks for wins'], ['Club', 'Blocks threats'], ['Builder', 'Avoids forks'], ['Thinker', 'Strong defense'], ['Advanced', 'Perfect play'], ['Expert', 'Perfect play'], ['Master', 'Perfect play'], ['Challenge', 'Perfect play']
  ],
  puzzle: [
    ['Warm-up', '3 × 3 picture'], ['Starter', '3 × 3 picture'], ['Learner', '4 × 4 picture'], ['Club', '4 × 4 picture'], ['Builder', '5 × 5 picture'], ['Thinker', '5 × 5 picture'], ['Advanced', '6 × 6 picture'], ['Expert', '6 × 6 picture'], ['Master', '7 × 7 picture'], ['Challenge', '8 × 8 picture']
  ],
  sudoku: [
    ['Warm-up', '52 clues'], ['Starter', '48 clues'], ['Learner', '44 clues'], ['Club', '40 clues'], ['Builder', '36 clues'], ['Thinker', '32 clues'], ['Advanced', '30 clues'], ['Expert', '28 clues'], ['Master', '26 clues'], ['Challenge', '24 clues']
  ]
};

const puzzlePictures = [
  { id: 'lake', title: 'Sunrise lake', src: 'assets/brain-puzzle-reference.svg', alt: 'Mountains, lake and sunrise' },
  { id: 'forest', title: 'Forest path', src: 'assets/brain-puzzle-forest.svg', alt: 'A sunlit forest path' },
  { id: 'ocean', title: 'Coral reef', src: 'assets/brain-puzzle-ocean.svg', alt: 'A colourful coral reef' },
  { id: 'desert', title: 'Desert oasis', src: 'assets/brain-puzzle-desert.svg', alt: 'A desert oasis at sunset' },
  { id: 'space', title: 'Galaxy dream', src: 'assets/brain-puzzle-space.svg', alt: 'Planets and stars in a galaxy' }
];
if (!puzzlePictures.some(picture => picture.id === state.puzzlePicture)) state.puzzlePicture = 'lake';

function getGameLevel(gameId) { return Math.min(10, Math.max(1, Number(state.gameLevels[gameId]) || 1)); }
function setGameLevel(gameId, level) { state.gameLevels[gameId] = Math.min(10, Math.max(1, level)); localStorage.setItem('neuronGameLevels', JSON.stringify(state.gameLevels)); }
function renderGameLevelControl(gameId) {
  const control = $('#gameLevelControl');
  if (gameId === 'chess' || !gameLevelProfiles[gameId]) { control.innerHTML = ''; return; }
  const level = getGameLevel(gameId), [name, detail] = gameLevelProfiles[gameId][level - 1];
  control.innerHTML = `<section class="game-level-picker" aria-label="${games.find(game => game.id === gameId).title} difficulty"><div class="game-level-heading"><div><span class="eyebrow">DIFFICULTY</span><strong>Level ${level} · ${name}</strong><p>${detail}</p></div><span class="level-badge">10 LEVELS</span></div><div class="game-level-grid">${gameLevelProfiles[gameId].map((item, index) => `<button class="game-level ${index + 1 === level ? 'active' : ''}" data-game-level="${index + 1}" aria-pressed="${index + 1 === level}"><span>${index + 1}</span><small>${item[0]}</small></button>`).join('')}<button class="game-level coming" disabled title="More game levels are coming soon"><span>+</span><small>More soon</small></button></div></section>`;
  $$('[data-game-level]', control).forEach(button => button.addEventListener('click', () => { setGameLevel(gameId, Number(button.dataset.gameLevel)); openGame(gameId); }));
}

// Local Stockfish 19 worker. If a browser blocks workers from a file:// page,
// the chess game safely falls back to the built-in bot rather than failing.
const stockfishEngine = {
  worker: null,
  ready: null,
  pending: null,
  status: 'idle',
  load() {
    if (this.ready) return this.ready;
    if (location.protocol === 'file:') { this.status = 'needs-server'; return Promise.reject(new Error('Stockfish needs a local server.')); }
    if (!window.Worker) return Promise.reject(new Error('Web Workers are unavailable.'));
    this.status = 'loading';
    this.ready = new Promise((resolve, reject) => {
      let settled = false;
      const fail = error => { if (!settled) { settled = true; this.status = 'failed'; reject(error); } };
      try {
        this.worker = new Worker('assets/stockfish/stockfish-19-lite-single.js');
        this.worker.onerror = () => fail(new Error('Stockfish could not start.'));
        this.worker.onmessage = event => {
          const line = String(event.data || '').trim();
          if (line === 'uciok') { this.worker.postMessage('setoption name UCI_LimitStrength value true'); this.worker.postMessage('isready'); }
          if (line === 'readyok' && !settled) { settled = true; this.status = 'ready'; resolve(); }
          const best = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
          if (best && this.pending) { const request = this.pending; this.pending = null; request.resolve(best[1]); }
        };
        this.worker.postMessage('uci');
        setTimeout(() => { if (!settled) fail(new Error('Stockfish load timed out.')); }, 7000);
      } catch (error) { fail(error); }
    });
    return this.ready;
  },
  analyze(moves, elo, time) {
    return this.load().then(() => new Promise((resolve, reject) => {
      this.cancel();
      const timeout = setTimeout(() => { if (this.pending?.resolve === resolve) { this.pending = null; this.worker.postMessage('stop'); reject(new Error('Stockfish move timed out.')); } }, time + 2500);
      this.pending = { resolve: move => { clearTimeout(timeout); resolve(move); }, reject: error => { clearTimeout(timeout); reject(error); } };
      this.worker.postMessage(`setoption name UCI_Elo value ${elo}`);
      this.worker.postMessage('ucinewgame');
      this.worker.postMessage(`position startpos${moves.length ? ` moves ${moves.join(' ')}` : ''}`);
      this.worker.postMessage(`go movetime ${time}`);
    }));
  },
  cancel() {
    if (!this.pending) return;
    const request = this.pending; this.pending = null;
    try { this.worker?.postMessage('stop'); } catch (_) { /* worker already stopped */ }
    request.reject(new Error('Stockfish request replaced.'));
  }
};

const planByBand = {
  explorer: {
    name: 'Explorer', heading: 'Build a stronger foundation.',
    lead: 'Your strongest next step is steady practice: start simple, build confidence, and increase the challenge a little each week.',
    weeks: [
      ['Week 1', 'Notice patterns', 'Spend five calm minutes with numbers, shapes and easy wins.', 'Sudoku + Memory'],
      ['Week 2', 'Expand your working memory', 'Use short recall exercises, then pause before checking answers.', 'Memory + 2048'],
      ['Week 3', 'Reason step by step', 'Narrate why a move or answer follows from the clues.', 'Connect 4 + Sudoku'],
      ['Week 4', 'Combine skills', 'Alternate a verbal game and a strategy game each day.', 'Word Connect + Chess']
    ],
    today: ['Play one round of Memory Match', 'Solve 5 Sudoku cells without guessing', 'Take a 10-minute walk, phone-free']
  },
  builder: {
    name: 'Builder', heading: 'Turn solid skills into range.',
    lead: 'You have a workable base. Build range by rotating through different kinds of problems instead of repeating only your comfort zone.',
    weeks: [
      ['Week 1', 'Sharpen attention', 'Choose one game and play it with zero multitasking.', 'Memory + Jigsaw'],
      ['Week 2', 'Practice strategy', 'Before each move, name two possible outcomes.', 'Chess + Connect 4'],
      ['Week 3', 'Stretch flexibility', 'Try a new route after every stalled attempt.', '2048 + Word Connect'],
      ['Week 4', 'Raise the bar', 'Repeat your two best games and compare decisions, not just scores.', 'Chess + Sudoku']
    ],
    today: ['Find 4 words in Word Connect', 'Play Connect 4 and plan one move ahead', 'Read 10 pages of something unfamiliar']
  },
  analyst: {
    name: 'Analyst', heading: 'Refine a flexible, strategic mind.',
    lead: 'Your results suggest strong reasoning habits. Your growth edge is transfer: bring deliberate thinking to novel problems and explain your choices.',
    weeks: [
      ['Week 1', 'Train precision', 'Slow down on familiar tasks and look for hidden assumptions.', 'Sudoku + Chess'],
      ['Week 2', 'Welcome novelty', 'Try unfamiliar word patterns or puzzle layouts.', 'Word Connect + Jigsaw'],
      ['Week 3', 'Think in branches', 'For each move, compare a bold option and a safe option.', 'Chess + 2048'],
      ['Week 4', 'Teach the pattern', 'Explain a solved puzzle out loud in three clear steps.', 'Connect 4 + Sudoku']
    ],
    today: ['Play Chess: consider two candidate moves first', 'Reach 128 in 2048', 'Teach someone one new thing you learned']
  },
  navigator: {
    name: 'Navigator', heading: 'Keep curiosity ahead of comfort.',
    lead: 'You showed well-developed problem-solving habits. Keep improving by seeking rich, unfamiliar challenges, reflecting on errors, and caring for your recovery.',
    weeks: [
      ['Week 1', 'Seek complexity', 'Choose the more demanding puzzle and stay with it.', 'Chess + Sudoku'],
      ['Week 2', 'Cross-train insight', 'Alternate verbal and visual-spatial tasks each session.', 'Word Connect + Jigsaw'],
      ['Week 3', 'Review decisions', 'After each round, identify the one move that changed the game.', 'Connect 4 + 2048'],
      ['Week 4', 'Sustain your edge', 'Keep sessions playful, short and paired with great sleep.', 'Your top two games']
    ],
    today: ['Solve a Sudoku without hints', 'Play one full Chess session', 'Spend 15 minutes learning a new skill']
  }
};

const recommendedGameLevels = {
  explorer: { chess: 1, word: 2, connect4: 1, memory: 2, '2048': 1, tictactoe: 2, puzzle: 2, sudoku: 1 },
  builder: { chess: 3, word: 3, connect4: 3, memory: 4, '2048': 3, tictactoe: 4, puzzle: 3, sudoku: 3 },
  analyst: { chess: 5, word: 5, connect4: 5, memory: 6, '2048': 5, tictactoe: 7, puzzle: 5, sudoku: 5 },
  navigator: { chess: 7, word: 7, connect4: 7, memory: 8, '2048': 7, tictactoe: 7, puzzle: 6, sudoku: 7 }
};

const gamePracticeSkills = {
  chess: 'planning and flexible strategy', word: 'verbal fluency', connect4: 'foresight', memory: 'working memory', '2048': 'adaptive reasoning', tictactoe: 'logic', puzzle: 'visual-spatial skills', sudoku: 'deductive reasoning'
};

function getBand(score = state.score) {
  if (!score) return null;
  if (score < 90) return 'explorer';
  if (score < 106) return 'builder';
  if (score < 121) return 'analyst';
  return 'navigator';
}
function getRecommendedLevel(gameId) { const band = getBand(); return band ? recommendedGameLevels[band][gameId] : null; }
function isNewcomer() { return !state.score && localStorage.getItem('neuronOnboardingDismissed') !== 'true'; }
function persist() {
  localStorage.setItem('neuronScore', state.score || '');
  localStorage.setItem('neuronSessions', String(state.sessions));
  localStorage.setItem('neuronStreak', String(state.streak));
}
function showToast(text) {
  const toast = $('#toast'); toast.textContent = text; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function playBlip() {
  if (!state.sound || !window.AudioContext) return;
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = 450; g.gain.setValueAtTime(.035, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .08); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .09); } catch (_) { /* sound is optional */ }
}
function trackSession(label) {
  state.sessions += 1; persist(); renderStats(); showToast(`${label} counted toward your focus score.`); playBlip();
}

function navigate(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `${view}View`));
  $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const names = { home: 'Build a brighter mind.', test: 'Discover your baseline.', plan: 'Your path forward.', games: 'Play with purpose.' };
  $('#pageTitle').textContent = names[view];
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStats() {
  $('#sessionCount').textContent = state.sessions;
  $('#sideStreak').textContent = `${state.streak} day${state.streak === 1 ? '' : 's'}`;
  $('#gameStreak').textContent = state.streak;
  const values = [12, 26, 0, 38, 18, state.sessions ? Math.min(70, 18 + state.sessions * 8) : 0, 0];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  $('#weekChart').innerHTML = values.map((value, i) => `<div class="bar-wrap"><i class="chart-bar ${i === 5 ? 'today' : ''}" style="height:${value || 6}%"></i><small>${days[i]}</small></div>`).join('');
}
function renderScore() {
  const band = getBand();
  const hasScore = Boolean(state.score);
  $('#scoreEmpty').classList.toggle('hidden', hasScore);
  $('#scoreResult').classList.toggle('hidden', !hasScore);
  if (hasScore) {
    $('#homeScore').textContent = state.score;
    $('#homeBand').textContent = `${planByBand[band].name} profile`;
    $('#homeScoreNote').textContent = 'Your tailored growth plan is ready.';
    $('#planScore').textContent = state.score;
    $('#planBand').textContent = `${planByBand[band].name.toUpperCase()} PROFILE`;
    $('#planLead').textContent = planByBand[band].lead;
  }
  $('#lockedPlan').classList.toggle('hidden', hasScore);
  $('#planContent').classList.toggle('hidden', !hasScore);
  if (hasScore) renderPlan();
  if ($('#gameCatalog')) renderCatalog();
}
function renderPlan() {
  const plan = planByBand[getBand()];
  $('#roadmapHeading').textContent = plan.heading;
  $('#todayPlanTitle').textContent = `Your first 15 minutes, ${plan.name}.`;
  $('#todayPlanText').textContent = 'Choose the three tiny actions below. Attention improves when you give it a clear, repeatable cue.';
  $('#roadmapList').innerHTML = plan.weeks.map(w => `<article class="roadmap-row"><span class="week-number">${w[0]}</span><div><h3>${w[1]}</h3><p>${w[2]}</p></div><span class="weeks-game">${w[3]}</span></article>`).join('');
  $('#todayChecklist').innerHTML = plan.today.map(t => `<button class="check-task">${t}</button>`).join('');
  $$('.check-task').forEach(button => button.addEventListener('click', () => { button.classList.toggle('done'); if (button.classList.contains('done')) playBlip(); }));
  $('#recommendedGames').innerHTML = games.map(game => { const level = getRecommendedLevel(game.id); return `<article class="recommended-game"><span class="recommended-icon">${game.icon}</span><div><h3>${game.title}</h3><p>Level ${level} · ${gamePracticeSkills[game.id]}</p></div><button class="small-button" data-recommend-game="${game.id}" data-recommend-level="${level}">Play L${level} →</button></article>`; }).join('');
  $$('[data-recommend-game]').forEach(button => button.addEventListener('click', () => { const gameId = button.dataset.recommendGame, level = Number(button.dataset.recommendLevel); if (gameId === 'chess') { state.chessLevel = level; localStorage.setItem('neuronChessLevel', String(level)); } else setGameLevel(gameId, level); navigate('games'); setTimeout(() => openGame(gameId), 80); }));
}

function clamp(value, lower, upper) { return Math.min(upper, Math.max(lower, value)); }
function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function currentElapsedSeconds() {
  if (state.assessmentStartedAt === null) return state.elapsedSeconds;
  return Math.max(0, Math.floor((performance.now() - state.assessmentStartedAt) / 1000));
}
function stopAssessmentTimer() {
  state.elapsedSeconds = currentElapsedSeconds();
  state.assessmentStartedAt = null;
  clearInterval(state.timerId);
  state.timerId = null;
  updateTimer();
}
function updateTimer() { $('#quizTimer').textContent = formatDuration(currentElapsedSeconds()); }

// This is a small 3-parameter-style practice model: each item's difficulty is
// considered, four-option guessing is accounted for, and response time is only
// a narrow tiebreaker. A real IQ score requires representative norming data.
function responseChance(ability, difficulty) {
  return 0.25 + 0.75 / (1 + Math.exp(-1.25 * (ability - difficulty)));
}
function estimateAbility(answers) {
  let bestAbility = -2.5;
  let bestLikelihood = -Infinity;
  for (let ability = -2.5; ability <= 3; ability += 0.01) {
    const likelihood = quizQuestions.reduce((sum, question, index) => {
      const probability = clamp(responseChance(ability, question[5]), 0.0001, 0.9999);
      return sum + (answers[index] === question[4] ? Math.log(probability) : Math.log(1 - probability));
    }, 0);
    if (likelihood > bestLikelihood) { bestLikelihood = likelihood; bestAbility = ability; }
  }
  return bestAbility;
}
function calculateTimingAdjustment(correct, elapsedSeconds) {
  const secondsPerQuestion = elapsedSeconds / quizQuestions.length;
  const accuracyEvidence = clamp((correct / quizQuestions.length - 0.25) / 0.75, 0, 1);
  if (secondsPerQuestion < 4) return -2;
  const pace = clamp((25 - secondsPerQuestion) / 18, -1, 1);
  return Math.round(pace * accuracyEvidence * 3);
}
function describePace(elapsedSeconds) {
  const secondsPerQuestion = elapsedSeconds / quizQuestions.length;
  if (secondsPerQuestion < 4) return 'very rapid — no speed credit applied';
  if (secondsPerQuestion < 14) return 'brisk pace';
  if (secondsPerQuestion <= 28) return 'steady pace';
  return 'unhurried pace';
}
function calculateAssessmentResult() {
  const correct = quizQuestions.reduce((count, question, index) => count + (state.answers[index] === question[4] ? 1 : 0), 0);
  const ability = estimateAbility(state.answers);
  const timingAdjustment = calculateTimingAdjustment(correct, state.elapsedSeconds);
  const score = Math.round(clamp(100 + ability * 15 + timingAdjustment, 70, 145));
  return { correct, score, timingAdjustment, pace: describePace(state.elapsedSeconds) };
}

function startAssessment() {
  clearInterval(state.timerId);
  state.quizIndex = 0; state.answers = Array(quizQuestions.length).fill(null); state.elapsedSeconds = 0; state.assessmentStartedAt = performance.now();
  $('#assessmentStart').classList.add('hidden'); $('#testResult').classList.add('hidden'); $('#quizShell').classList.remove('hidden');
  updateTimer();
  state.timerId = setInterval(updateTimer, 500);
  renderQuestion();
}
function renderOnboarding() {
  const newcomer = isNewcomer();
  $('#assessmentStatus').textContent = newcomer ? 'WELCOME — START HERE' : 'READY WHEN YOU ARE';
  $('#exploreFirst').classList.toggle('hidden', !newcomer);
}
function leaveAssessment() {
  stopAssessmentTimer();
  localStorage.setItem('neuronOnboardingDismissed', 'true');
  $('#quizShell').classList.add('hidden');
  $('#testResult').classList.add('hidden');
  $('#assessmentStart').classList.remove('hidden');
  $('#assessmentStatus').textContent = 'READY WHEN YOU ARE';
  $('#exploreFirst').classList.add('hidden');
  showToast('You can take the assessment whenever you’re ready.');
  navigate('home');
}
function renderQuestion() {
  const [category, art, text, options] = quizQuestions[state.quizIndex];
  $('#questionCategory').textContent = category.toUpperCase(); $('#questionNumber').textContent = `Question ${state.quizIndex + 1} of ${quizQuestions.length}`; $('#questionArt').textContent = art; $('#questionText').textContent = text;
  $('#quizProgress').style.width = `${((state.quizIndex + 1) / quizQuestions.length) * 100}%`;
  $('#answers').innerHTML = options.map((answer, i) => `<button class="answer ${state.answers[state.quizIndex] === i ? 'selected' : ''}" data-answer="${i}"><span class="answer-key">${String.fromCharCode(65 + i)}</span>${answer}</button>`).join('');
  $$('.answer').forEach(button => button.addEventListener('click', () => { state.answers[state.quizIndex] = Number(button.dataset.answer); renderQuestion(); playBlip(); }));
  $('#previousQuestion').style.visibility = state.quizIndex === 0 ? 'hidden' : 'visible';
  $('#nextQuestion').innerHTML = state.quizIndex === quizQuestions.length - 1 ? 'See my result <span>→</span>' : 'Next <span>→</span>';
  $('#answerStatus').textContent = state.answers[state.quizIndex] === null ? 'Choose one answer' : 'Answer saved';
}
function changeQuestion(delta) {
  if (delta > 0 && state.answers[state.quizIndex] === null) { showToast('Choose an answer to keep going.'); return; }
  if (state.quizIndex + delta >= quizQuestions.length) finishAssessment();
  else { state.quizIndex = Math.max(0, state.quizIndex + delta); renderQuestion(); }
}
function finishAssessment() {
  stopAssessmentTimer();
  const { correct, score, timingAdjustment, pace } = calculateAssessmentResult();
  state.score = score; localStorage.removeItem('neuronOnboardingDismissed'); persist(); renderOnboarding(); renderScore(); renderStats();
  $('#quizShell').classList.add('hidden'); $('#testResult').classList.remove('hidden');
  const band = planByBand[getBand(score)];
  const breakdown = Object.entries(assessmentGroups).map(([name, list]) => { const got = list.filter(i => state.answers[i] === quizQuestions[i][4]).length; return `<div><b>${Math.round((got / list.length) * 100)}%</b><span>${name.toUpperCase()}</span></div>`; }).join('');
  const timingText = timingAdjustment === 0 ? 'no score change' : `${timingAdjustment > 0 ? '+' : ''}${timingAdjustment} point timing adjustment`;
  $('#testResult').innerHTML = `<span class="pill"><span class="pulse-dot"></span> ASSESSMENT COMPLETE</span><div class="result-orbit"><b>${score}</b><span>PRACTICE IQ</span></div><h2>${band.name}, meet your growth plan.</h2><p>You answered <strong>${correct} of 30</strong> questions correctly. The practice estimate weighs item difficulty and uses time only as a small accuracy-aware tiebreaker. It is a learning snapshot, not a clinical IQ measurement.</p><div class="result-timing"><div><span>COMPLETION TIME</span><b>${formatDuration(state.elapsedSeconds)}</b></div><div><span>PACE</span><b>${pace}</b></div><div><span>TIME EFFECT</span><b>${timingText}</b></div></div><div class="result-breakdown">${breakdown}</div><button class="primary-button" data-goto="plan">See my game levels + plan <span>→</span></button> <button class="secondary-button" id="retakeTest">Retake later</button>`;
  $('[data-goto="plan"]', $('#testResult')).addEventListener('click', () => navigate('plan'));
  $('#retakeTest').addEventListener('click', startAssessment);
  playBlip();
}

function renderCatalog() {
  $('#gameCatalog').innerHTML = games.map(game => { const recommended = getRecommendedLevel(game.id); return `<button class="game-card theme-${game.theme}" data-game="${game.id}"><span class="game-skill">${game.skill}</span><span class="game-icon">${game.icon}</span><h3>${game.title}</h3><p>${game.desc}</p>${recommended ? `<span class="game-recommendation">Recommended · L${recommended}</span>` : ''}<span class="play-label">Play →</span></button>`; }).join('');
  $$('.game-card').forEach(card => card.addEventListener('click', () => openGame(card.dataset.game)));
}
function openGame(id) {
  const game = games.find(g => g.id === id); state.activeGame = id;
  clearTimeout(state.memoryTimer);
  $('#gameCatalog').classList.add('hidden'); $('#gameStage').classList.remove('hidden'); $('#stageSkill').textContent = game.skill; $('#stageTitle').textContent = game.title; $('#stageStat').textContent = 'Make your move';
  renderGameLevelControl(id);
  const renderers = { word: renderWord, chess: renderChess, connect4: renderConnect4, memory: renderMemory, '2048': render2048, tictactoe: renderTicTacToe, puzzle: renderPuzzle, sudoku: renderSudoku };
  renderers[id]();
  $('#gameStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeGame() { stockfishEngine.cancel(); $('#gameStage').classList.add('hidden'); $('#gameCatalog').classList.remove('hidden'); state.activeGame = null; }

function renderWord() {
  const challenges = [
    { letters: ['C','A','T'], valid: ['at','act','cat'] },
    { letters: ['R','A','T'], valid: ['at','art','rat','tar'] },
    { letters: ['S','T','O','N','E'], valid: ['one','son','ten','toe','tone','note','stone'] },
    { letters: ['P','L','A','N','E'], valid: ['ale','ape','lap','lane','lean','leap','pale','peal','plane'] },
    { letters: ['S','T','R','E','A','M'], valid: ['are','art','ate','ear','eat','era','ram','rat','sea','steam'] },
    { letters: ['R','E','A','C','T'], valid: ['ace','act','are','art','ate','car','cat','ear','eat','rat','react'] },
    { letters: ['L','I','S','T','E','N'], valid: ['in','is','it','lie','line','list','tile','ties','listen','silent','tinsel','enlist'] },
    { letters: ['S','E','A','R','C','H'], valid: ['ace','ache','aches','arch','arches','care','case','cash','chase','each','ear','hears','search'] },
    { letters: ['T','R','I','A','N','G','L','E'], valid: ['alert','angle','anger','argue','giant','grain','grant','great','integral','large','learn','range','relating','triangle'] },
    { letters: ['C','R','E','A','T','I','O','N'], valid: ['action','actor','cater','cart','certain','coin','cone','crate','creation','ocean','notice','react','reaction','ratio','retain'] }
  ];
  const { letters, valid } = challenges[getGameLevel('word') - 1]; let selected = []; let found = [];
  $('#stageStat').textContent = `Find ${valid.length} words`;
  const draw = () => {
    $('#stageBody').innerHTML = `<div class="word-wrap"><p class="game-instructions">Tap letters to make a word. Find every word in this Level ${getGameLevel('word')} set.</p><div class="word-current">${selected.map(i => letters[i]).join('')}</div><div class="word-letters">${letters.map((letter, i) => `<button class="letter-tile ${selected.includes(i) ? 'used' : ''}" data-index="${i}">${letter}</button>`).join('')}</div><div class="game-toolbar"><button class="small-button" id="wordClear">Clear</button><button class="small-button" id="wordSubmit">Check word</button></div><div class="word-found">${valid.map(word => `<span class="${found.includes(word) ? '' : 'empty'}">${found.includes(word) ? word.toUpperCase() : '•'.repeat(word.length)}</span>`).join('')}</div><div class="win-message" id="wordMessage"></div></div>`;
    $$('.letter-tile').forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.index); if (!selected.includes(i)) { selected.push(i); draw(); playBlip(); } }));
    $('#wordClear').addEventListener('click', () => { selected = []; draw(); });
    $('#wordSubmit').addEventListener('click', () => { const word = selected.map(i => letters[i]).join('').toLowerCase(); const msg = $('#wordMessage'); if (valid.includes(word) && !found.includes(word)) { found.push(word); selected = []; draw(); const updatedMessage = $('#wordMessage'); if (found.length === valid.length) { updatedMessage.textContent = 'All words found — excellent verbal flex!'; trackSession('Word practice'); } else updatedMessage.textContent = 'Nice find!'; } else if (found.includes(word)) msg.textContent = 'You already found that one.'; else msg.textContent = 'Try another combination.'; });
  }; draw();
}

function renderConnect4() {
  const profiles = [{ depth: 0, error: 1 },{ depth: 1, error: .78 },{ depth: 1, error: .56 },{ depth: 2, error: .38 },{ depth: 2, error: .22 },{ depth: 3, error: .14 },{ depth: 4, error: .09 },{ depth: 5, error: .045 },{ depth: 6, error: .015 },{ depth: 7, error: 0 }];
  const level = getGameLevel('connect4'), profile = profiles[level - 1];
  let board = Array(42).fill(''); let gameOver = false, cpuThinking = false;
  const win = (grid, player) => {
    const at = (r, c) => grid[r * 7 + c] === player;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) if (at(r,c) && ([[0,1],[1,0],[1,1],[1,-1]].some(([dr,dc]) => [1,2,3].every(n => r+dr*n>=0 && r+dr*n<6 && c+dc*n>=0 && c+dc*n<7 && at(r+dr*n,c+dc*n))))) return true;
    return false;
  };
  const drop = (grid, column, player) => { const next = [...grid]; for (let row = 5; row >= 0; row--) { const i = row * 7 + column; if (!next[i]) { next[i] = player; return next; } } return null; };
  const choices = grid => [...Array(7).keys()].filter(column => !grid[column]);
  const evaluateWindow = window => { const cpu = window.filter(cell => cell === 'c').length, player = window.filter(cell => cell === 'p').length, empty = window.filter(cell => !cell).length; if (cpu === 4) return 100000; if (player === 4) return -100000; if (cpu === 3 && empty === 1) return 120; if (cpu === 2 && empty === 2) return 14; if (player === 3 && empty === 1) return -145; if (player === 2 && empty === 2) return -16; return 0; };
  const evaluate = grid => { let score = 0; for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++) { const directions = [[0,1],[1,0],[1,1],[1,-1]]; directions.forEach(([dr,dc]) => { if (row + dr * 3 < 0 || row + dr * 3 >= 6 || col + dc * 3 < 0 || col + dc * 3 >= 7) return; score += evaluateWindow([0,1,2,3].map(step => grid[(row + dr * step) * 7 + col + dc * step])); }); } return score; };
  const minimax = (grid, depth, alpha, beta, maxing) => { const columns = choices(grid); if (win(grid, 'c')) return 100000 + depth; if (win(grid, 'p')) return -100000 - depth; if (!depth || !columns.length) return evaluate(grid); const ordered = columns.sort((a,b) => Math.abs(3-a) - Math.abs(3-b)); if (maxing) { let best = -Infinity; for (const column of ordered) { best = Math.max(best, minimax(drop(grid, column, 'c'), depth - 1, alpha, beta, false)); alpha = Math.max(alpha, best); if (alpha >= beta) break; } return best; } let best = Infinity; for (const column of ordered) { best = Math.min(best, minimax(drop(grid, column, 'p'), depth - 1, alpha, beta, true)); beta = Math.min(beta, best); if (alpha >= beta) break; } return best; };
  const chooseCpu = () => {
    const columns = choices(board), ordered = columns.sort((a,b) => Math.abs(3-a) - Math.abs(3-b));
    const winner = ordered.find(column => win(drop(board, column, 'c'), 'c')); if (winner !== undefined) return winner;
    const block = ordered.find(column => win(drop(board, column, 'p'), 'p')); if (block !== undefined && level >= 2) return block;
    if (!profile.depth || Math.random() < profile.error) return columns[Math.floor(Math.random() * columns.length)];
    const scored = ordered.map(column => ({ column, score: minimax(drop(board, column, 'c'), profile.depth - 1, -Infinity, Infinity, false) })).sort((a,b) => b.score - a.score);
    const spread = Math.min(scored.length - 1, Math.floor(profile.error * scored.length * 2)); return scored[Math.min(spread, Math.floor(Math.random() * (spread + 1)))].column;
  };
  const draw = () => {
    $('#stageStat').textContent = cpuThinking ? `Level ${level} thinking…` : `Level ${level} bot`;
    $('#stageBody').innerHTML = `<div class="connect-wrap"><p class="game-instructions">You’re gold. Level ${level} looks ${profile.depth ? `${profile.depth} move${profile.depth === 1 ? '' : 's'} ahead` : 'mostly at random'}.</p><div class="connect-board">${board.map((x, i) => `<button class="connect-cell ${x === 'p' ? 'player' : x === 'c' ? 'cpu' : ''}" data-col="${i % 7}"></button>`).join('')}</div><div class="win-message" id="connectMsg"></div><div class="game-toolbar"><button class="small-button" id="restartConnect">New game</button></div></div>`;
    $$('.connect-cell').forEach(b => b.addEventListener('click', () => {
      const next = drop(board, Number(b.dataset.col), 'p'); if (gameOver || cpuThinking || !next) return; board = next;
      draw(); playBlip();
      if (win(board, 'p')) { gameOver = true; $('#connectMsg').textContent = 'Four in a row! Your foresight wins.'; trackSession('Connect 4'); return; }
      if (!choices(board).length) { gameOver = true; $('#connectMsg').textContent = 'A thoughtful draw.'; return; }
      cpuThinking = true; draw(); setTimeout(() => { const cpu = chooseCpu(); board = drop(board, cpu, 'c'); cpuThinking = false; draw(); if (win(board, 'c')) { gameOver = true; $('#connectMsg').textContent = `Level ${level} connected four — try another line.`; } }, 180 + profile.depth * 70);
    }));
    $('#restartConnect').addEventListener('click', renderConnect4);
  }; draw();
}

function renderTicTacToe() {
  const profiles = [1,.82,.66,.50,.34,.18,0,0,0,0]; const level = getGameLevel('tictactoe');
  let board = Array(9).fill(''); let over = false;
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const result = (p) => lines.some(line => line.every(i => board[i] === p));
  const scorePosition = (grid, maximizing) => { if (lines.some(line => line.every(i => grid[i] === 'O'))) return 10; if (lines.some(line => line.every(i => grid[i] === 'X'))) return -10; const free = grid.map((value, index) => value ? null : index).filter(value => value !== null); if (!free.length) return 0; const scores = free.map(index => { grid[index] = maximizing ? 'O' : 'X'; const score = scorePosition(grid, !maximizing); grid[index] = ''; return score; }); return maximizing ? Math.max(...scores) : Math.min(...scores); };
  const cpuMove = () => {
    const free = board.map((v, i) => v ? null : i).filter(v => v !== null);
    const test = (p) => free.find(i => { board[i] = p; const yes = result(p); board[i] = ''; return yes; });
    const random = () => free[Math.floor(Math.random() * free.length)];
    let pick;
    if (level >= 7) pick = free.map(index => { board[index] = 'O'; const score = scorePosition(board, false); board[index] = ''; return { index, score }; }).sort((a,b) => b.score - a.score)[0].index;
    else if (Math.random() < profiles[level - 1]) pick = random();
    else pick = test('O') ?? (level >= 3 ? test('X') : undefined) ?? (level >= 5 && board[4] === '' ? 4 : random());
    board[pick] = 'O';
  };
  const draw = () => {
    $('#stageStat').textContent = level >= 7 ? 'Perfect-play bot' : `Level ${level} logic bot`;
    $('#stageBody').innerHTML = `<div class="ttt-wrap"><p class="game-instructions">You’re X. ${level >= 7 ? 'This tier plays the solved game — force a draw or find the rare mistake.' : 'Look for a fork: two ways to win at once.'}</p><div class="ttt-board">${board.map((v,i) => `<button class="ttt-cell ${v === 'O' ? 'cpu' : ''}" data-cell="${i}">${v}</button>`).join('')}</div><div class="win-message" id="tttMsg"></div><div class="game-toolbar"><button class="small-button" id="restartTtt">New game</button></div></div>`;
    $$('.ttt-cell').forEach(button => button.addEventListener('click', () => { const i = Number(button.dataset.cell); if (over || board[i]) return; board[i] = 'X'; if (result('X')) { over = true; draw(); $('#tttMsg').textContent = 'You won — clean logic!'; trackSession('Tic-tac-toe'); return; } if (!board.includes('')) { over = true; draw(); $('#tttMsg').textContent = 'A draw. Great defense.'; return; } cpuMove(); if (result('O')) over = true; draw(); if (over) $('#tttMsg').textContent = 'The computer found its line. Try again.'; }));
    $('#restartTtt').addEventListener('click', renderTicTacToe);
  }; draw();
}

function renderMemory() {
  clearTimeout(state.memoryTimer);
  const memoryProfiles = [{ pairs:3, preview:4000, columns:3 },{ pairs:4, preview:3500, columns:4 },{ pairs:4, preview:3000, columns:4 },{ pairs:5, preview:2700, columns:5 },{ pairs:6, preview:2400, columns:4 },{ pairs:8, preview:2100, columns:4 },{ pairs:8, preview:1800, columns:4 },{ pairs:10, preview:1500, columns:5 },{ pairs:12, preview:1200, columns:6 },{ pairs:12, preview:900, columns:6 }];
  const level = getGameLevel('memory'), profile = memoryProfiles[level - 1];
  const symbols = ['🧠','🎯','🌙','🍀','🚀','🎵','🪐','🧩','⚡','🌈','🔮','🦊'];
  const items = symbols.slice(0, profile.pairs).flatMap(symbol => [symbol, symbol]);
  let cards = items.sort(() => Math.random() - .5); let open = [], matched = [], locked = false, turns = 0, previewing = true;
  const draw = () => {
    $('#stageStat').textContent = previewing ? `Level ${level}: study` : `${matched.length / 2} / ${profile.pairs} pairs`;
    $('#stageBody').innerHTML = `<div class="memory-wrap"><p class="game-instructions">${previewing ? `Level ${level}: memorize ${profile.pairs} pairs before the cards turn over.` : 'Tap two cards to reveal their icons and find every matching pair.'}</p><div class="memory-board" style="--memory-columns:${profile.columns}">${cards.map((value, i) => { const visible = previewing || open.includes(i) || matched.includes(i); return `<button class="memory-card ${visible && !previewing ? 'open' : ''} ${matched.includes(i) ? 'matched' : ''} ${previewing ? 'preview' : ''}" data-card="${i}" aria-label="Memory card ${i + 1}"><span class="card-back">?</span><span class="card-face">${value}</span></button>`; }).join('')}</div><div class="win-message" id="memoryMsg">${previewing ? 'Study time…' : turns ? `${turns} turns` : 'Find the first pair.'}</div><div class="game-toolbar"><button class="small-button" id="restartMemory">Shuffle cards</button></div></div>`;
    $$('.memory-card').forEach(button => button.addEventListener('click', () => { const i = Number(button.dataset.card); if (previewing || locked || open.includes(i) || matched.includes(i)) return; open.push(i); playBlip(); draw(); if (open.length === 2) { turns++; if (cards[open[0]] === cards[open[1]]) { matched.push(...open); open=[]; draw(); if (matched.length === cards.length) { $('#memoryMsg').textContent = `All pairs in ${turns} turns — excellent recall!`; trackSession('Memory match'); } } else { locked=true; setTimeout(() => { open=[]; locked=false; draw(); }, 650); } } }));
    $('#restartMemory').addEventListener('click', renderMemory);
  }; draw();
  state.memoryTimer = setTimeout(() => { if (state.activeGame === 'memory') { previewing = false; draw(); } }, profile.preview);
}

function render2048() {
  const profiles = [{ target:16, clutter:0 },{ target:32, clutter:0 },{ target:64, clutter:0 },{ target:128, clutter:0 },{ target:256, clutter:0 },{ target:512, clutter:0 },{ target:512, clutter:2 },{ target:1024, clutter:0 },{ target:1024, clutter:3 },{ target:2048, clutter:0 }];
  const level = getGameLevel('2048'), profile = profiles[level - 1];
  let board = Array(16).fill(0); let points = 0; let complete = false, moves = 0;
  const add = () => { const open = board.map((v,i)=>v?null:i).filter(v=>v!==null); if (open.length) board[open[Math.floor(Math.random()*open.length)]] = Math.random() < .85 ? 2 : 4; };
  const moveLine = (line) => { const slim = line.filter(Boolean); for (let i=0;i<slim.length-1;i++) if (slim[i]===slim[i+1]) { slim[i]*=2; points+=slim[i]; slim.splice(i+1,1); } while(slim.length<4) slim.push(0); return slim; };
  const move = (direction) => {
    const before = board.join(','); let next = Array(16).fill(0);
    for (let r=0;r<4;r++) { let indices; if(direction==='left'||direction==='right') indices=[0,1,2,3].map(c=>r*4+c); else indices=[0,1,2,3].map(c=>c*4+r); let line=indices.map(i=>board[i]); if(direction==='right'||direction==='down') line.reverse(); line=moveLine(line); if(direction==='right'||direction==='down') line.reverse(); indices.forEach((i,n)=>next[i]=line[n]); }
    board=next; if(before!==board.join(',')){moves++;add();draw(); playBlip(); if (Math.max(...board)>=profile.target && !complete) {complete=true; $('#game2048Msg').textContent=`${profile.target} reached — Level ${level} complete!`;trackSession('2048');}}
  };
  const draw = () => { $('#stageStat').textContent = `Goal ${profile.target} · ${moves} moves`; $('#stageBody').innerHTML=`<div class="game2048-wrap" id="game2048" tabindex="0"><p class="game-instructions">Level ${level}: reach the ${profile.target} tile. Equal tiles merge when they touch.</p><div class="game2048">${board.map(v=>`<div class="tile2048" data-v="${v}">${v||''}</div>`).join('')}</div><div class="game-toolbar"><button class="small-button" data-move="left">←</button><button class="small-button" data-move="up">↑</button><button class="small-button" data-move="down">↓</button><button class="small-button" data-move="right">→</button><button class="small-button" id="restart2048">New game</button></div><div class="win-message" id="game2048Msg"></div></div>`; const wrap=$('#game2048'); wrap.focus(); wrap.addEventListener('keydown',e=>{const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(map[e.key]){e.preventDefault();move(map[e.key]);}}); $$('[data-move]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.move))); $('#restart2048').addEventListener('click',render2048); };
  add();add(); for(let i=0;i<profile.clutter;i++) add(); draw();
}

function renderPuzzle() {
  const grids = [3,3,4,4,5,5,6,6,7,8]; const level = getGameLevel('puzzle'), gridSize = grids[level - 1], cellSize = gridSize <= 4 ? 82 : gridSize <= 5 ? 76 : gridSize === 6 ? 66 : gridSize === 7 ? 57 : 50;
  const picture = puzzlePictures.find(option => option.id === state.puzzlePicture) || puzzlePictures[0];
  let order = [...Array(gridSize * gridSize).keys()].sort(() => Math.random() - .5); let selected = null;
  if (order.every((piece, index) => piece === index)) [order[0], order[1]] = [order[1], order[0]];
  const draw = () => {
    $('#stageStat').textContent = `${order.filter((v,i)=>v===i).length} / ${gridSize * gridSize} placed`;
    $('#stageBody').innerHTML=`<div class="puzzle-wrap"><p class="game-instructions">Level ${level}: choose a picture, then rebuild its ${gridSize} × ${gridSize} version.</p><div class="puzzle-picture-picker" aria-label="Choose jigsaw picture">${puzzlePictures.map(option => `<button class="puzzle-picture-choice ${option.id === picture.id ? 'active' : ''}" data-puzzle-picture="${option.id}" aria-pressed="${option.id === picture.id}"><img src="${option.src}" alt=""/><span>${option.title}</span></button>`).join('')}</div><div class="puzzle-layout"><div class="puzzle-board" style="--puzzle-grid:${gridSize};--puzzle-cell:min(${cellSize}px,calc((100vw - 64px) / ${gridSize}))">${order.map((piece,i)=>`<button class="puzzle-piece ${selected===i?'selected':''}" style="--piece-x:${(piece % gridSize) * (100 / (gridSize - 1))}%;--piece-y:${Math.floor(piece / gridSize) * (100 / (gridSize - 1))}%;background-image:url('${picture.src}');background-size:${gridSize * 100}% ${gridSize * 100}%" data-piece="${i}" aria-label="Puzzle tile ${i + 1}"></button>`).join('')}</div><figure class="puzzle-reference"><img src="${picture.src}" alt="Target picture: ${picture.alt}" /><figcaption>DESTINATION<strong>${picture.title}</strong></figcaption></figure></div><div class="win-message" id="puzzleMsg"></div><div class="game-toolbar"><button class="small-button" id="shufflePuzzle">Shuffle puzzle</button></div></div>`;
    $$('[data-puzzle-picture]').forEach(button => button.addEventListener('click', () => { state.puzzlePicture = button.dataset.puzzlePicture; localStorage.setItem('neuronPuzzlePicture', state.puzzlePicture); renderPuzzle(); }));
    $$('.puzzle-piece').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.piece);if(selected===null){selected=i;draw();return;}[order[i],order[selected]]=[order[selected],order[i]];selected=null;draw();playBlip();if(order.every((v,k)=>v===k)){$('#puzzleMsg').textContent='Picture complete — great spatial reasoning!';trackSession('Jigsaw puzzle');}})); $('#shufflePuzzle').addEventListener('click',renderPuzzle);
  }; draw();
}

function renderSudoku() {
  const solution = [5,3,4,6,7,8,9,1,2,6,7,2,1,9,5,3,4,8,1,9,8,3,4,2,5,6,7,8,5,9,7,6,1,4,2,3,4,2,6,8,5,3,7,9,1,7,1,3,9,2,4,8,5,6,9,6,1,5,3,7,2,8,4,2,8,7,4,1,9,6,3,5,3,4,5,2,8,6,1,7,9];
  const clues = [52,48,44,40,36,32,30,28,26,24], level = getGameLevel('sudoku'), clueCount = clues[level - 1];
  const clueOrder = Array.from({ length: 81 }, (_, index) => (index * 37) % 81);
  const givens = new Set(clueOrder.slice(0, clueCount));
  const draw = () => { $('#stageStat').textContent = `Level ${level} · ${clueCount} clues`; $('#stageBody').innerHTML=`<div class="sudoku-wrap"><p class="game-instructions">Level ${level}: fill each row, column and 3×3 box with 1–9. Green entries are correct.</p><div class="sudoku-board">${solution.map((value,i)=>`<input class="sudoku-cell ${givens.has(i)?'fixed':''}" data-index="${i}" ${givens.has(i)?'value='+value+' readonly':''} inputmode="numeric" maxlength="1" aria-label="Sudoku row ${Math.floor(i/9)+1}, column ${(i%9)+1}"/>`).join('')}</div><div class="win-message" id="sudokuMsg"></div><div class="game-toolbar"><button class="small-button" id="checkSudoku">Check entries</button><button class="small-button" id="clearSudoku">Clear entries</button></div></div>`; $$('.sudoku-cell:not(.fixed)').forEach(input=>input.addEventListener('input',()=>{input.value=input.value.replace(/[^1-9]/g,'').slice(0,1);input.style.color=input.value&&Number(input.value)===solution[Number(input.dataset.index)]?'#88e4d5':'#f49ab3';})); $('#checkSudoku').addEventListener('click',()=>{const cells=$$('.sudoku-cell');let filled=0,correct=0;cells.forEach((cell,i)=>{if(cell.value){filled++;if(Number(cell.value)===solution[i])correct++;}});if(filled===81&&correct===81){$('#sudokuMsg').textContent=`Level ${level} solved — beautiful deduction!`;trackSession('Sudoku');}else $('#sudokuMsg').textContent=`${correct} correct entries so far. Keep reasoning.`;}); $('#clearSudoku').addEventListener('click',()=>$$('.sudoku-cell:not(.fixed)').forEach(x=>{x.value='';x.style.color='';})); }; draw();
}

function renderChess() {
  const gameId = (state.chessGameId || 0) + 1;
  state.chessGameId = gameId;
  stockfishEngine.cancel();
  const whitePieces = new Set(['♔', '♕', '♖', '♗', '♘', '♙']);
  const blackPieces = new Set(['♚', '♛', '♜', '♝', '♞', '♟']);
  const kindMap = { '♔': 'k', '♚': 'k', '♕': 'q', '♛': 'q', '♖': 'r', '♜': 'r', '♗': 'b', '♝': 'b', '♘': 'n', '♞': 'n', '♙': 'p', '♟': 'p' };
  const pieceValue = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 50 };
  let board = [
    '♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜',
    '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟',
    ...Array(32).fill(''),
    '♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙',
    '♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'
  ];
  let selected = null, turn = 'white', moves = 0, gameOver = false, sessionAwarded = false;
  let castle = { wk: true, wq: true, bk: true, bq: true }, enPassant = null, history = [];
  const bot = chessLevels.find(level => level.level === state.chessLevel) || chessLevels[0];
  const colorOf = piece => whitePieces.has(piece) ? 'white' : blackPieces.has(piece) ? 'black' : null;
  const kindOf = piece => kindMap[piece] || null;
  const other = color => color === 'white' ? 'black' : 'white';
  const squareName = index => `${String.fromCharCode(97 + (index % 8))}${8 - Math.floor(index / 8)}`;
  const inBounds = (row, column) => row >= 0 && row < 8 && column >= 0 && column < 8;
  const rawMoves = (from, grid = board, attackOnly = false, rights = castle, enPassantTarget = enPassant) => {
    const piece = grid[from], color = colorOf(piece), type = kindOf(piece);
    if (!piece) return [];
    const row = Math.floor(from / 8), column = from % 8, movesTo = [];
    const add = (nextRow, nextColumn) => {
      if (!inBounds(nextRow, nextColumn)) return false;
      const target = nextRow * 8 + nextColumn, occupant = grid[target];
      if (occupant && colorOf(occupant) === color) return false;
      if (occupant && kindOf(occupant) === 'k' && !attackOnly) return false;
      movesTo.push(target);
      return !occupant;
    };
    const slide = directions => directions.forEach(([dr, dc]) => { for (let r = row + dr, c = column + dc; inBounds(r, c); r += dr, c += dc) if (!add(r, c)) break; });
    if (type === 'p') {
      const direction = color === 'white' ? -1 : 1, startRow = color === 'white' ? 6 : 1;
      [[direction, -1], [direction, 1]].forEach(([dr, dc]) => { if (attackOnly) { if (inBounds(row + dr, column + dc)) movesTo.push((row + dr) * 8 + column + dc); } else if (inBounds(row + dr, column + dc)) { const targetIndex = (row + dr) * 8 + column + dc, target = grid[targetIndex]; if (target && colorOf(target) !== color && kindOf(target) !== 'k') movesTo.push(targetIndex); else if (!target && targetIndex === enPassantTarget) movesTo.push(targetIndex); } });
      if (!attackOnly && inBounds(row + direction, column) && !grid[(row + direction) * 8 + column]) { movesTo.push((row + direction) * 8 + column); if (row === startRow && !grid[(row + direction * 2) * 8 + column]) movesTo.push((row + direction * 2) * 8 + column); }
    }
    if (type === 'n') [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => add(row + dr, column + dc));
    if (type === 'b' || type === 'q') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
    if (type === 'r' || type === 'q') slide([[-1,0],[1,0],[0,-1],[0,1]]);
    if (type === 'k') {
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => add(row + dr, column + dc));
      if (!attackOnly && !inCheck(grid, color)) {
        const home = color === 'white' ? 60 : 4, enemy = other(color), right = color === 'white' ? rights.wk : rights.bk, left = color === 'white' ? rights.wq : rights.bq;
        if (from === home && right && grid[home + 3] === (color === 'white' ? '♖' : '♜') && !grid[home + 1] && !grid[home + 2] && !isAttacked(grid, home + 1, enemy) && !isAttacked(grid, home + 2, enemy)) movesTo.push(home + 2);
        if (from === home && left && grid[home - 4] === (color === 'white' ? '♖' : '♜') && !grid[home - 1] && !grid[home - 2] && !grid[home - 3] && !isAttacked(grid, home - 1, enemy) && !isAttacked(grid, home - 2, enemy)) movesTo.push(home - 2);
      }
    }
    return [...new Set(movesTo)];
  };
  const isAttacked = (grid, target, byColor) => grid.some((piece, index) => colorOf(piece) === byColor && rawMoves(index, grid, true).includes(target));
  const inCheck = (grid, color) => { const king = grid.findIndex(piece => piece === (color === 'white' ? '♔' : '♚')); return king !== -1 && isAttacked(grid, king, other(color)); };
  const applyMove = (grid, from, to, enPassantTarget = enPassant) => {
    const next = [...grid], piece = next[from]; next[to] = piece; next[from] = '';
    if (kindOf(piece) === 'p' && Math.abs((to % 8) - (from % 8)) === 1 && !grid[to] && to === enPassantTarget) next[Math.floor(from / 8) * 8 + (to % 8)] = '';
    if (kindOf(piece) === 'k' && Math.abs(to - from) === 2) { const rookFrom = to > from ? from + 3 : from - 4, rookTo = to > from ? from + 1 : from - 1; next[rookTo] = next[rookFrom]; next[rookFrom] = ''; }
    if (kindOf(piece) === 'p' && (to < 8 || to >= 56)) next[to] = colorOf(piece) === 'white' ? '♕' : '♛';
    return next;
  };
  const rightsAfter = (from, to, piece, captured, rights = castle) => {
    const next = { ...rights };
    if (piece === '♔') next.wk = next.wq = false; if (piece === '♚') next.bk = next.bq = false;
    if (from === 63 || to === 63 || captured === '♖' && to === 63) next.wk = false;
    if (from === 56 || to === 56 || captured === '♖' && to === 56) next.wq = false;
    if (from === 7 || to === 7 || captured === '♜' && to === 7) next.bk = false;
    if (from === 0 || to === 0 || captured === '♜' && to === 0) next.bq = false;
    return next;
  };
  const enPassantAfter = (from, to, piece) => kindOf(piece) === 'p' && Math.abs(to - from) === 16 ? (from + to) / 2 : null;
  const legalMoves = (from, color, grid = board, rights = castle, enPassantTarget = enPassant) => colorOf(grid[from]) === color ? rawMoves(from, grid, false, rights, enPassantTarget).filter(to => !inCheck(applyMove(grid, from, to, enPassantTarget), color)) : [];
  const allMovesOn = (grid, color, rights, enPassantTarget = null) => grid.flatMap((piece, from) => colorOf(piece) === color ? legalMoves(from, color, grid, rights, enPassantTarget).map(to => ({ from, to })) : []);
  const allMoves = color => allMovesOn(board, color, castle, enPassant);
  const openingBook = {
    'e2e4': ['e7e5', 'c7c5', 'e7e6'],
    'd2d4': ['d7d5', 'g8f6'],
    'c2c4': ['e7e5', 'g8f6'],
    'g1f3': ['d7d5', 'g8f6'],
    'e2e4 e7e5 g1f3': ['b8c6', 'g8f6'],
    'e2e4 e7e5 f1c4': ['f8c5', 'g8f6'],
    'e2e4 e7e5 g1f3 b8c6 f1b5': ['a7a6', 'g8f6'],
    'e2e4 c7c5 g1f3': ['d7d6', 'b8c6'],
    'e2e4 c7c5 g1f3 d7d6 d2d4': ['c5d4', 'g8f6'],
    'd2d4 d7d5 c2c4': ['e7e6', 'c7c6'],
    'd2d4 g8f6 c2c4': ['e7e6', 'g7g6'],
    'c2c4 e7e5 g1f3': ['b8c6', 'g8f6']
  };
  const indexFromSquare = square => (8 - Number(square[1])) * 8 + square.charCodeAt(0) - 97;
  const getBookMove = options => {
    const candidateMoves = openingBook[history.join(' ')];
    if (!candidateMoves || history.length > 8) return null;
    const offset = bot.level >= 9 ? candidateMoves.length - 1 : Math.min(candidateMoves.length - 1, Math.max(0, bot.level - 6));
    const preference = [...candidateMoves.slice(offset), ...candidateMoves.slice(0, offset)];
    for (const uci of preference) { const from = indexFromSquare(uci.slice(0, 2)), to = indexFromSquare(uci.slice(2, 4)); if (options.some(move => move.from === from && move.to === to)) return { from, to, uci }; }
    return null;
  };
  const moveOrder = (grid, options) => [...options].sort((a, b) => {
    const score = move => (pieceValue[kindOf(grid[move.to])] || 0) * 20 - (pieceValue[kindOf(grid[move.from])] || 0) + 5 - Math.abs(3.5 - (move.to % 8));
    return score(b) - score(a);
  });
  const evaluate = grid => grid.reduce((score, piece, index) => {
    if (!piece) return score;
    const color = colorOf(piece), type = kindOf(piece), row = Math.floor(index / 8), column = index % 8;
    const centre = 3.5 - (Math.abs(3.5 - row) + Math.abs(3.5 - column)) / 2;
    let value = (pieceValue[type] || 0) * 100;
    if (type === 'p') value += (color === 'white' ? 6 - row : row - 1) * 8;
    if (type === 'n' || type === 'b') value += centre * 7;
    if (type === 'q') value += centre * 3;
    return score + (color === 'white' ? value : -value);
  }, 0);
  let searchedNodes = 0;
  const minimax = (grid, rights, enPassantTarget, side, depth, alpha, beta) => {
    searchedNodes++;
    if (depth <= 0 || searchedNodes >= bot.nodes) return evaluate(grid);
    const options = moveOrder(grid, allMovesOn(grid, side, rights, enPassantTarget));
    if (!options.length) return inCheck(grid, side) ? (side === 'white' ? -100000 - depth : 100000 + depth) : 0;
    if (side === 'white') {
      let best = -Infinity;
      for (const move of options) { const piece = grid[move.from], captured = grid[move.to], next = applyMove(grid, move.from, move.to, enPassantTarget); best = Math.max(best, minimax(next, rightsAfter(move.from, move.to, piece, captured, rights), enPassantAfter(move.from, move.to, piece), 'black', depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (beta <= alpha) break; }
      return best;
    }
    let best = Infinity;
    for (const move of options) { const piece = grid[move.from], captured = grid[move.to], next = applyMove(grid, move.from, move.to, enPassantTarget); best = Math.min(best, minimax(next, rightsAfter(move.from, move.to, piece, captured, rights), enPassantAfter(move.from, move.to, piece), 'white', depth - 1, alpha, beta)); beta = Math.min(beta, best); if (beta <= alpha) break; }
    return best;
  };
  const chooseBotMove = options => {
    const ordered = moveOrder(board, options).slice(0, bot.root);
    if (!bot.depth || Math.random() < bot.mistake) return ordered[Math.floor(Math.random() * ordered.length)];
    searchedNodes = 0;
    const scored = ordered.map(move => {
      const piece = board[move.from], captured = board[move.to], next = applyMove(board, move.from, move.to, enPassant);
      return { ...move, score: minimax(next, rightsAfter(move.from, move.to, piece, captured), enPassantAfter(move.from, move.to, piece), 'white', bot.depth - 1, -Infinity, Infinity) };
    }).sort((a, b) => a.score - b.score);
    return scored[0];
  };
  const finishIfNeeded = () => { const available = allMoves(turn); if (!available.length) { gameOver = true; return inCheck(board, turn) ? `${turn === 'white' ? 'Checkmate — black wins.' : 'Checkmate — you win!'} ` : 'Stalemate — a hard-fought draw.'; } return ''; };
  const makeMove = (from, to) => { const piece = board[from], captured = board[to], promotion = kindOf(piece) === 'p' && (to < 8 || to >= 56) ? 'q' : ''; history.push(`${squareName(from)}${squareName(to)}${promotion}`); board = applyMove(board, from, to, enPassant); castle = rightsAfter(from, to, piece, captured); enPassant = enPassantAfter(from, to, piece); moves++; };
  const cpu = async () => {
    if (gameOver) return;
    const options = allMoves('black');
    if (!options.length) { gameOver = true; draw(); return; }
    let choice = bot.engine ? getBookMove(options) : null;
    let engineMessage = '';
    if (choice) engineMessage = `${bot.title} plays a book opening.`;
    else if (bot.engine) {
      draw(`Stockfish 19 is calculating the ${bot.elo} Elo move…`);
      try {
        const uci = await stockfishEngine.analyze(history, bot.elo, bot.time);
        if (state.chessGameId !== gameId || gameOver || turn !== 'black') return;
        const from = indexFromSquare(uci.slice(0, 2)), to = indexFromSquare(uci.slice(2, 4));
        choice = options.find(move => move.from === from && move.to === to) || null;
        engineMessage = `Stockfish 19 (${bot.elo} Elo target) moved.`;
      } catch (_) {
        if (state.chessGameId !== gameId || gameOver || turn !== 'black') return;
        engineMessage = location.protocol === 'file:' ? 'Open “Start Neuron App.vbs” for the real Stockfish engine; the tactical bot took over.' : 'Stockfish is unavailable here; the local tactical bot took over.';
      }
    }
    choice ||= chooseBotMove(options);
    makeMove(choice.from, choice.to); turn = 'white'; const result = finishIfNeeded(); draw(result || (inCheck(board, 'white') ? 'Check — protect your king.' : (engineMessage || `${bot.title} bot moved. Your turn.`)));
  };
  const draw = (message = '') => {
    const options = selected === null ? [] : legalMoves(selected, 'white');
    const checkedKing = inCheck(board, turn) ? board.findIndex(piece => piece === (turn === 'white' ? '♔' : '♚')) : -1;
    $('#stageStat').textContent = gameOver ? 'Game complete' : turn === 'white' ? 'Your move · white' : 'Computer thinking…';
    const levelOptions = chessLevels.map(level => `<button class="chess-level ${level.level === bot.level ? 'active' : ''}" data-level="${level.level}" aria-pressed="${level.level === bot.level}"><span>L${level.level}</span><b>${level.elo}</b><small>${level.title}</small></button>`).join('');
    $('#stageBody').innerHTML = `<div class="chess-wrap"><section class="chess-level-picker" aria-label="Chess bot difficulty"><div class="chess-level-copy"><span class="eyebrow">BOT DIFFICULTY</span><strong>Level ${bot.level} · ${bot.elo} Elo</strong><p>${bot.note}</p><span class="engine-badge ${bot.engine ? 'engine-live' : ''}">${bot.engine ? '⚙ STOCKFISH 19 · LOCAL ENGINE' : '◌ PRACTICE BOT'}</span></div><div class="chess-level-grid">${levelOptions}<button class="chess-level coming" disabled title="More chess bot levels are coming soon"><span>+</span><b>More</b><small>coming soon</small></button></div><p class="elo-note">Levels 6–10 use Stockfish 19 with its calibrated UCI Elo limiting; an opening book handles the first moves. Lower levels intentionally make more mistakes.</p></section><p class="game-instructions">Legal moves are highlighted. Castling, en passant and automatic queen promotion are supported.</p><div class="chess-board">${board.map((piece, i) => { const target = board[i]; const classes = [`${(Math.floor(i / 8) + i % 8) % 2 ? 'dark' : ''}`, colorOf(piece) === 'white' ? 'white-piece' : colorOf(piece) === 'black' ? 'black-piece' : '', selected === i ? 'selected' : '', options.includes(i) ? (target ? 'capture' : 'legal') : '', checkedKing === i ? 'in-check' : ''].filter(Boolean).join(' '); return `<button class="chess-cell ${classes}" data-square="${i}" aria-label="${piece ? `${colorOf(piece)} ${kindOf(piece)} on ` : ''}${squareName(i)}"><span class="piece">${piece}</span></button>`; }).join('')}</div><div class="chess-status"><span class="turn-chip ${checkedKing !== -1 ? 'check' : ''}">${turn === 'white' ? 'WHITE TO MOVE' : 'BLACK TO MOVE'}</span><span>${moves ? `${moves} half-moves played` : 'Standard starting position'}</span></div><div class="win-message" id="chessMsg">${message || (moves ? '' : bot.engine ? 'Stockfish is ready. Open with a deliberate move.' : 'Choose a bot level, then open with a deliberate move.')}</div><div class="game-toolbar"><button class="small-button" id="restartChess">New game</button></div></div>`;
    $$('.chess-level[data-level]').forEach(button => button.addEventListener('click', () => { state.chessLevel = Number(button.dataset.level); localStorage.setItem('neuronChessLevel', String(state.chessLevel)); renderChess(); }));
    $$('.chess-cell').forEach(button => button.addEventListener('click', () => { if (turn !== 'white' || gameOver) return; const index = Number(button.dataset.square); if (selected !== null && options.includes(index)) { makeMove(selected, index); selected = null; turn = 'black'; playBlip(); const result = finishIfNeeded(); draw(result); if (!gameOver) { if (!sessionAwarded && moves >= 8) { sessionAwarded = true; trackSession('Chess practice'); } setTimeout(cpu, 380); } return; } if (colorOf(board[index]) === 'white') { selected = index; draw(); } else if (selected !== null) { selected = null; draw(); } }));
    $('#restartChess').addEventListener('click', renderChess);
  };
  draw();
}

function resetData() { if (!confirm('Reset your Neuron score and session data?')) return; localStorage.removeItem('neuronScore');localStorage.removeItem('neuronSessions');localStorage.removeItem('neuronStreak');localStorage.removeItem('neuronChessLevel');localStorage.removeItem('neuronGameLevels');localStorage.removeItem('neuronPuzzlePicture');localStorage.removeItem('neuronOnboardingDismissed');state.score=null;state.sessions=0;state.streak=1;state.chessLevel=1;state.gameLevels={};state.puzzlePicture='lake';renderOnboarding();renderScore();renderStats();showToast('Your local progress was reset.');navigate('test'); }

function init() {
  $('#currentDate').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toUpperCase();
  const newcomer = isNewcomer();
  renderOnboarding(); renderStats(); renderScore(); renderCatalog();
  $$('.nav-link').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  $$('[data-goto]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.goto)));
  $$('[data-play-game]').forEach(button => button.addEventListener('click', () => { navigate('games'); setTimeout(() => openGame(button.dataset.playGame), 80); }));
  $('#startTest').addEventListener('click', startAssessment); $('#exploreFirst').addEventListener('click', leaveAssessment); $('#quitTest').addEventListener('click', leaveAssessment); $('#nextQuestion').addEventListener('click', () => changeQuestion(1)); $('#previousQuestion').addEventListener('click', () => changeQuestion(-1));
  $('#closeGame').addEventListener('click', closeGame); $('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open')); $('#resetData').addEventListener('click', resetData);
  $('#soundButton').addEventListener('click', () => { state.sound=!state.sound; $('#soundButton').style.opacity=state.sound?'1':'.35'; showToast(state.sound?'Sound on':'Sound off'); });
  if (newcomer) navigate('test');
}
init();
