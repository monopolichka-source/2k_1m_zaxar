const ROLES_PATH = 'assets/';
const DEFAULT_BAT = 'assets/bat.svg';
const MUSIC_PATH = 'assets/music/';

const bats = document.querySelectorAll('.bat');
const icons = document.querySelectorAll('.icon');

let ghost = null;
let draggedIcon = null;

// ---- музыка ----
// роль -> файл (имена файлов как есть, без переименования)
const TRACK_FILES = {
  'glass.svg':      'last-chance-choir.mp3',
  'Coffee_mug.svg': 'slim_shady_old_school_loop_part_2_bass.mp3',
  'Clipboard.svg':  'dark-haunting-reese-bass-synth.mp3',
  'Headphones.svg': 'probably-my-last-loop.mp3',
  'Laptop.svg':     'vaas_part_1_ambient_dark_synth_loop.mp3',
  'Safety.svg':     'rap-drum3.mp3',
  'Pickaxe.svg':    'rusted-drums.mp3',
  'Hard_hat.svg':   'blitz-metal-guitar-loops-02.mp3',
  'Straw_hat.svg':  'riffs-from-the-sewer-vol-1-6.mp3',
  'Beanie_hat.svg': 'last-chance-bass-3.mp3',
  'Tie.svg':        'yeezus-drums.mp3',
};

const tracks = {};      // role -> Audio
let startedAt = null;   // общий "метроном": момент, когда начал играть первый трек

// заранее загружаем все треки, чтобы знать их длительность
Object.entries(TRACK_FILES).forEach(([role, file]) => {
  const audio = new Audio(MUSIC_PATH + file);
  audio.loop = true;
  audio.preload = 'auto';
  tracks[role] = audio;
});

function anyPlaying() {
  return Object.values(tracks).some(t => !t.paused);
}

function playRole(role) {
  const track = tracks[role];
  if (!track || !track.paused) return;

  // первый трек запускает общий отсчёт, остальные подстраиваются под него
  if (!anyPlaying()) startedAt = performance.now();

  const elapsed = (performance.now() - startedAt) / 1000;
  track.currentTime = track.duration ? elapsed % track.duration : 0;
  track.play().catch(() => {});
}

function stopRole(role) {
  const track = tracks[role];
  if (!track) return;
  track.pause();
  track.currentTime = 0;
}

// Какая мышка под курсором
function getBatAt(x, y) {
  for (const bat of bats) {
    const r = bat.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return bat;
  }
  return null;
}

function updateIconStates() {
  const usedRoles = [...bats].map(b => b.dataset.role).filter(Boolean);
  icons.forEach(icon => {
    icon.classList.toggle('used', usedRoles.includes(icon.dataset.role));
  });
}

function setRole(bat, role) {
  // одна роль — одна мышка: если уже где-то стоит, снимаем её оттуда
  bats.forEach(b => {
    if (b !== bat && b.dataset.role === role) resetBat(b);
  });

  // если на этой мышке уже была другая роль — выключаем её музыку
  const oldRole = bat.dataset.role;
  if (oldRole && oldRole !== role) stopRole(oldRole);

  bat.src = ROLES_PATH + role;
  bat.dataset.role = role;
  playRole(role);
  updateIconStates();
}

function resetBat(bat) {
  const role = bat.dataset.role;
  if (role) stopRole(role);

  bat.src = DEFAULT_BAT;
  delete bat.dataset.role;
  updateIconStates();
}

// ---- перетаскивание (мышь + тач через pointer events) ----
icons.forEach(icon => {
  icon.addEventListener('pointerdown', e => {
    e.preventDefault();
    draggedIcon = icon;

    ghost = icon.cloneNode();
    ghost.className = 'drag-ghost';
    document.body.appendChild(ghost);
    moveGhost(e);

    icon.setPointerCapture(e.pointerId);
  });

  icon.addEventListener('pointermove', e => {
    if (!ghost) return;
    moveGhost(e);
    const target = getBatAt(e.clientX, e.clientY);
    bats.forEach(b => b.classList.toggle('hover', b === target));
  });

  icon.addEventListener('pointerup', e => {
    if (!ghost) return;
    const target = getBatAt(e.clientX, e.clientY);
    if (target) setRole(target, draggedIcon.dataset.role);
    endDrag();
  });

  icon.addEventListener('pointercancel', endDrag);
});

function moveGhost(e) {
  ghost.style.left = e.clientX + 'px';
  ghost.style.top = e.clientY + 'px';
}

function endDrag() {
  if (ghost) ghost.remove();
  ghost = null;
  draggedIcon = null;
  bats.forEach(b => b.classList.remove('hover'));
}

// клик по мышке с ролью — сбросить обратно в обычного бэта
bats.forEach(bat => {
  bat.addEventListener('click', () => {
    if (bat.dataset.role) resetBat(bat);
  });
});