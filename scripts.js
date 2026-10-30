const ROLES_PATH = 'assets/';
const DEFAULT_BAT = 'assets/bat.svg';
const MUSIC_PATH = 'assets/music/';

const slots = [...document.querySelectorAll('.bat-slot')];
const bats = slots.map(s => s.querySelector('.bat'));
const actButtons = document.querySelectorAll('.act');
const globalPauseBtn = document.getElementById('globalPause');

const ACTS = {
  1: { title: 'Офис',            roles: ['Laptop.svg', 'Coffee_mug.svg', 'Tie.svg', 'Clipboard.svg'] },
  2: { title: 'Цех',             roles: ['Hard_hat.svg', 'Pickaxe.svg', 'Safety.svg', 'Straw_hat.svg'] },
  3: { title: 'Пропажа стажёра', roles: ['Beanie_hat.svg', 'Tie.svg', 'Hard_hat.svg', 'Headphones.svg'] },
};

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

const tracks = {};
let currentAct = null;
let globalPaused = false;

Object.entries(TRACK_FILES).forEach(([role, file]) => {
  const audio = new Audio(MUSIC_PATH + file);
  audio.loop = true;
  audio.preload = 'auto';
  tracks[role] = audio;
});

// ---- общие музыкальные часы (замирают на общей паузе) ----
let clockBase = 0;      // накопленные секунды
let clockStart = null;  // когда часы пошли (null = стоят)

function musicTime() {
  return clockBase + (clockStart !== null ? (performance.now() - clockStart) / 1000 : 0);
}
function startClock() { clockBase = 0; clockStart = performance.now(); }
function resetClock() { clockBase = 0; clockStart = null; }

// ---- треки ----
function syncAndPlay(role) {
  const track = tracks[role];
  if (!track) return;
  track.currentTime = track.duration ? musicTime() % track.duration : 0;
  track.play().catch(() => {});
}

function stopRole(role) {
  const track = tracks[role];
  if (!track) return;
  track.pause();
  track.currentTime = 0;
}

function stopAll() {
  Object.keys(tracks).forEach(stopRole);
}

// ---- слоты (мышка + её панель) ----
function getParts(slot) {
  return {
    bat: slot.querySelector('.bat'),
    pauseBtn: slot.querySelector('.pause-btn'),
    vol: slot.querySelector('.vol'),
  };
}

function updatePauseIcon(slot) {
  const { pauseBtn } = getParts(slot);
  pauseBtn.textContent = slot.dataset.paused === 'true' ? '▶' : '⏸';
}

function setRole(slot, role) {
  const { bat, vol } = getParts(slot);
  bat.src = ROLES_PATH + role;
  bat.dataset.role = role;
  slot.dataset.role = role;
  slot.dataset.paused = 'false';
  slot.classList.add('has-role');
  updatePauseIcon(slot);

  tracks[role].volume = Number(vol.value);
  if (!globalPaused) syncAndPlay(role);
}

function resetSlot(slot) {
  const { bat } = getParts(slot);
  const role = slot.dataset.role;
  if (role) stopRole(role);

  bat.src = DEFAULT_BAT;
  delete bat.dataset.role;
  delete slot.dataset.role;
  slot.dataset.paused = 'false';
  slot.classList.remove('has-role');
  updatePauseIcon(slot);
}

// ---- управление на каждом слоте ----
slots.forEach(slot => {
  const { bat, pauseBtn, vol } = getParts(slot);

  // пауза / продолжить у одного персонажа
  pauseBtn.addEventListener('click', () => {
    const role = slot.dataset.role;
    if (!role) return;

    if (slot.dataset.paused === 'true') {
      slot.dataset.paused = 'false';
      if (!globalPaused) syncAndPlay(role);   // возвращаемся в общий такт
    } else {
      slot.dataset.paused = 'true';
      tracks[role].pause();
    }
    updatePauseIcon(slot);
  });

  // громкость
  vol.addEventListener('input', () => {
    const role = slot.dataset.role;
    if (role) tracks[role].volume = Number(vol.value);
  });

  // клик по мышке — убрать роль
  bat.addEventListener('click', () => {
    if (slot.dataset.role) resetSlot(slot);
  });
});

// ---- общая пауза ----
function updateGlobalBtn() {
  globalPauseBtn.disabled = currentAct === null;
  globalPauseBtn.classList.toggle('paused', globalPaused);
  globalPauseBtn.textContent = globalPaused ? '▶ Продолжить' : '⏸ Пауза';
}

globalPauseBtn.addEventListener('click', () => {
  if (currentAct === null) return;

  if (!globalPaused) {
    clockBase = musicTime();   // замораживаем часы
    clockStart = null;
    Object.values(tracks).forEach(t => t.pause());
    globalPaused = true;
  } else {
    clockStart = performance.now();
    globalPaused = false;
    // запускаем всех, кроме тех, кого поставили на паузу по отдельности
    slots.forEach(slot => {
      if (slot.dataset.role && slot.dataset.paused !== 'true') {
        syncAndPlay(slot.dataset.role);
      }
    });
  }
  updateGlobalBtn();
});

// ---- акты ----
function playAct(n) {
  stopAll();
  slots.forEach(resetSlot);

  globalPaused = false;
  startClock();

  ACTS[n].roles.forEach((role, i) => {
    if (slots[i]) setRole(slots[i], role);
  });

  currentAct = n;
  updateActButtons();
  updateGlobalBtn();
}

function stopAct() {
  stopAll();
  slots.forEach(resetSlot);
  resetClock();
  globalPaused = false;
  currentAct = null;
  updateActButtons();
  updateGlobalBtn();
}

function updateActButtons() {
  actButtons.forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.act) === currentAct);
  });
}

actButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const n = Number(btn.dataset.act);
    if (currentAct === n) stopAct();
    else playAct(n);
  });
});

updateGlobalBtn();