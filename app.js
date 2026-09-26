/* ═══════════════════════════════════════════════════════════
   WHEEL OF RAJINIKANTH — Core Application Logic
   
   Architecture:
   1. Segments: Numbers 1-25 only on alternating gold/maroon/black backgrounds
   2. Sync Panel during spin: Displays real-time segment number only
   3. Sync Panel on landing: Reveals shared image + character name + movie title
   4. Spin Animation: GPU-accelerated CSS transform rotate for 60fps smoothness
   ═══════════════════════════════════════════════════════════ */

// ── CONSTANTS ──
const SHARED_IMAGE_URL = "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790426049/ChatGPT_Image_Sep_26_2026_06_00_29_PM_kdfa4d.png";

// ── DATA (25 Characters) ──
const CHARACTERS = [
  { id: 1, movie: "Jailer", character: "Muthuvel Pandian / Tiger Muthuvel Pandian" },
  { id: 2, movie: "Petta", character: "Kaali / Petta Velan" },
  { id: 3, movie: "Kaala", character: "Karikalan (Kaala)" },
  { id: 4, movie: "Kabali", character: "Kabaleeswaran" },
  { id: 5, movie: "Enthiran", character: "Dr. Vaseegaran / Chitti" },
  { id: 6, movie: "Sivaji", character: "Sivaji Arumugam / M.G.R." },
  { id: 7, movie: "Chandramukhi", character: "Dr. Saravanan / Vettaiyan Raja" },
  { id: 8, movie: "Padayappa", character: "Aarupadayappa" },
  { id: 9, movie: "Arunachalam", character: "Arunachalam" },
  { id: 10, movie: "Muthu", character: "Muthu / Zamindar Ayya" },
  { id: 11, movie: "Baasha", character: "Manickam / Manick Baasha" },
  { id: 12, movie: "Ejamaan", character: "Vaanavarayan" },
  { id: 13, movie: "Annamalai", character: "Annamalai" },
  { id: 14, movie: "Thalapathi", character: "Surya" },
  { id: 15, movie: "Dharmathin Thalaivan", character: "Prof. Balu Subramaniam / Shankar" },
  { id: 16, movie: "Baba", character: "Baba" },
  { id: 17, movie: "Kochadaiiyaan", character: "Kochadaiiyaan / Rana / Seena" },
  { id: 18, movie: "Lingaa", character: "Raja Lingeswaran / Lingaa" },
  { id: 19, movie: "2.0", character: "Dr. Vaseegaran / Chitti" },
  { id: 20, movie: "Darbar", character: "Aaditya Arunachalam" },
  { id: 21, movie: "Annaatthe", character: "Kaalaiyan" },
  { id: 22, movie: "Padikkadavan", character: "Raja (Rajendran)" },
  { id: 23, movie: "Vettaiyan", character: "S. P. Athiyan" },
  { id: 24, movie: "Coolie", character: "Deva" },
  { id: 25, movie: "Billa", character: "Billa / Rajappa" }
];

// ── STATE ──
let availablePool = [...CHARACTERS];      // characters still in play
let revealedCount = 0;
let isSpinning = false;
let currentRotation = 0;                   // cumulative wheel rotation in degrees
let isMuted = false;
let currentSegment = "SHIPWRECK";          // active segment name
let lastPanelIndex = -1;                   // last segment index displayed in panel

// ── DOM REFS ──
const $ = (id) => document.getElementById(id);
const canvas          = $('wheel-canvas');
const ctx             = canvas.getContext('2d');
const spinBtn         = $('spin-btn');
const panelLabel      = $('panel-label');
const panelSpinView   = $('panel-spinning-view');
const panelSpinNumber = $('panel-spin-number');
const panelLandedView   = $('panel-landed-view');
const panelWinBadge     = $('panel-win-badge');
const panelImage        = $('panel-image');
const panelChar         = $('panel-character');
const panelMovie        = $('panel-movie');
const panelFrame        = $('panel-image-frame');
const panelContinueBtn  = $('panel-continue-btn');
const revealOverlay     = $('reveal-overlay');
const revealImage     = $('reveal-image');
const revealChar      = $('reveal-character');
const revealMovie     = $('reveal-movie');
const revealNumBadge  = $('reveal-num-badge');
const revealCloseBtn  = $('reveal-close-btn');
const endOverlay      = $('end-overlay');
const endResetBtn     = $('end-reset-btn');
const pointerAssembly = $('pointer-assembly');
const muteBtn         = $('mute-btn');
const segBadge        = $('segment-badge');
const segToggle       = $('segment-toggle');
const confettiCanvas  = $('confetti-canvas');
const confettiCtx     = confettiCanvas.getContext('2d');
const loaderBar       = $('loader-bar-fill');
const loaderProg      = $('loader-progress');
const loadingScreen   = $('loading-screen');
const appEl           = $('app');
const revealedCountEl = $('revealed-count');
const totalCountEl    = $('total-count');

// ── WHEEL DRAWING CONFIG ──
const SEGMENT_ANGLE  = (2 * Math.PI) / 25;
const CANVAS_SIZE    = 900;                // internal canvas px
const CENTER         = CANVAS_SIZE / 2;    // 450
const RADIUS         = (CANVAS_SIZE / 2) - 12; // 438

// ── AUDIO (Web Audio API — generated procedurally) ──
let audioCtx = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTick() {
  if (isMuted) return;
  try {
    const ac = ensureAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, ac.currentTime);
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.05);
  } catch(e) {}
}

function playFanfare() {
  if (isMuted) return;
  try {
    const ac = ensureAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ac.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ac.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime + i * 0.12);
      osc.stop(ac.currentTime + i * 0.12 + 0.5);
    });
  } catch(e) {}
}

// Whoosh sound during spin
let whooshNode = null;
let whooshGain = null;

function startWhoosh() {
  if (isMuted) return;
  try {
    const ac = ensureAudioCtx();
    const bufferSize = ac.sampleRate * 2;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, ac.currentTime);
    filter.Q.setValueAtTime(0.8, ac.currentTime);

    whooshGain = ac.createGain();
    whooshGain.gain.setValueAtTime(0.06, ac.currentTime);

    source.connect(filter);
    filter.connect(whooshGain);
    whooshGain.connect(ac.destination);
    source.start();
    whooshNode = source;
  } catch(e) {}
}

function stopWhoosh() {
  try {
    if (whooshGain) {
      const ac = ensureAudioCtx();
      whooshGain.gain.linearRampToValueAtTime(0.001, ac.currentTime + 0.4);
    }
    if (whooshNode) {
      setTimeout(() => {
        try { whooshNode.stop(); } catch(e) {}
        whooshNode = null;
        whooshGain = null;
      }, 500);
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
// ASSET PRELOADING (Single shared reveal image preloaded at start)
// ═══════════════════════════════════════════════════════════
let sharedRevealImage = null;

function preloadSharedImage() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = img.onerror = () => {
      sharedRevealImage = img;
      loaderBar.style.width = '100%';
      loaderProg.textContent = '1 / 1 image ready';
      resolve();
    };
    img.src = SHARED_IMAGE_URL;
  });
}

// ═══════════════════════════════════════════════════════════
// WHEEL DRAWING (Static Canvas Texture)
// ═══════════════════════════════════════════════════════════
function drawWheel() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const sliceRadius = RADIUS - 16;

  // ── Outer Ring Glow ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS + 14, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#FFE082';
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();

  // ── 25 Segments (Plain colored backgrounds with numbers only) ──
  for (let i = 0; i < 25; i++) {
    const startAngle = i * SEGMENT_ANGLE - Math.PI / 2;
    const endAngle   = startAngle + SEGMENT_ANGLE;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, sliceRadius, startAngle, endAngle);
    ctx.closePath();

    const colorIndex = i % 3;
    const sliceGrad = ctx.createRadialGradient(CENTER, CENTER, 40, CENTER, CENTER, sliceRadius);
    if (colorIndex === 0) { // Rich Crimson Red
      sliceGrad.addColorStop(0, '#D32F2F');
      sliceGrad.addColorStop(0.7, '#880E4F');
      sliceGrad.addColorStop(1, '#4A0007');
    } else if (colorIndex === 1) { // Radiant Golden Yellow
      sliceGrad.addColorStop(0, '#FFF176');
      sliceGrad.addColorStop(0.6, '#F57F17');
      sliceGrad.addColorStop(1, '#8C5000');
    } else { // Obsidian Dark Violet
      sliceGrad.addColorStop(0, '#424254');
      sliceGrad.addColorStop(0.7, '#21212B');
      sliceGrad.addColorStop(1, '#0D0D12');
    }

    ctx.fillStyle = sliceGrad;
    ctx.fill();

    // Segment border lines
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // ── Segment Label: Large centered number (1–25) ONLY ──
    ctx.save();
    const midAngle = startAngle + SEGMENT_ANGLE / 2;

    ctx.translate(CENTER, CENTER);
    ctx.rotate(midAngle);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = colorIndex === 1 ? '#FFFFFF' : '#FFE082';
    ctx.font = 'bold 36px "Oswald", "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), sliceRadius * 0.6, 0);

    ctx.restore();
  }

  // ── Outer Metallic Golden Rim Ring ──
  ctx.save();
  const rimGrad = ctx.createRadialGradient(CENTER, CENTER, sliceRadius, CENTER, CENTER, RADIUS + 10);
  rimGrad.addColorStop(0, '#5C4000');
  rimGrad.addColorStop(0.3, '#FFD54F');
  rimGrad.addColorStop(0.6, '#FFB300');
  rimGrad.addColorStop(0.85, '#FFF8E1');
  rimGrad.addColorStop(1, '#3E2723');

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS + 10, 0, 2 * Math.PI, false);
  ctx.arc(CENTER, CENTER, sliceRadius, 0, 2 * Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = rimGrad;
  ctx.fill();

  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // ── 50 Embedded LED Border Lights on the Rim ──
  const totalBulbs = 50;
  const bulbRadius = RADIUS - 3;
  const timeTick = Math.floor(performance.now() / 200);

  for (let b = 0; b < totalBulbs; b++) {
    const bulbAngle = b * ((2 * Math.PI) / totalBulbs);
    const bx = CENTER + bulbRadius * Math.cos(bulbAngle);
    const by = CENTER + bulbRadius * Math.sin(bulbAngle);
    const isLit = (b + timeTick) % 2 === 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, 2 * Math.PI);

    if (isLit) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFF59D';
      ctx.shadowBlur = 14;
    } else {
      ctx.fillStyle = '#FFC107';
      ctx.shadowColor = '#FF8F00';
      ctx.shadowBlur = 7;
    }
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }

  // ── Center Hub ──
  ctx.save();
  const hubGrad = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, 58);
  hubGrad.addColorStop(0, '#3E2723');
  hubGrad.addColorStop(0.5, '#1A1A1E');
  hubGrad.addColorStop(1, '#0B0B0E');
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 56, 0, 2 * Math.PI);
  ctx.fillStyle = hubGrad;
  ctx.fill();

  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FFE082';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();

  // Center text
  ctx.save();
  ctx.shadowColor = '#FF8F00';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#FFD54F';
  ctx.font = 'bold 20px "Bebas Neue", "Oswald", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN', CENTER, CENTER - 5);
  ctx.font = 'bold 11px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 248, 225, 0.85)';
  ctx.fillText('THE WHEEL', CENTER, CENTER + 12);
  ctx.restore();

  // ── Dim used segments (grey-out overlay) ──
  const usedIds = new Set(CHARACTERS.map(c => c.id).filter(id => !availablePool.find(p => p.id === id)));
  for (let i = 0; i < 25; i++) {
    if (usedIds.has(i + 1)) {
      const startAngle = i * SEGMENT_ANGLE - Math.PI / 2;
      const endAngle   = startAngle + SEGMENT_ANGLE;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, sliceRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = 'rgba(11, 11, 14, 0.75)';
      ctx.fill();

      // "Used" checkmark
      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const cr = sliceRadius * 0.6;
      const cx2 = CENTER + cr * Math.cos(midAngle);
      const cy2 = CENTER + cr * Math.sin(midAngle);
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', cx2, cy2);
      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════════
// POINTER CALCULATION
// ═══════════════════════════════════════════════════════════
function getSegmentIndexAtPointer(rotDeg) {
  const norm = ((rotDeg % 360) + 360) % 360;
  const angleFromStart = (360 - norm) % 360;
  return Math.floor(angleFromStart / 14.4) % 25;
}

function angleForSegment(segIndex) {
  const segAngleDeg = 360 / 25;
  const target = 360 - (segIndex * segAngleDeg + segAngleDeg / 2);
  return ((target % 360) + 360) % 360;
}

// ═══════════════════════════════════════════════════════════
// EASING CURVE
// Single continuous cubic-bezier / quintic ease for smooth spin
// ═══════════════════════════════════════════════════════════
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

// ═══════════════════════════════════════════════════════════
// SPIN LOGIC (GPU Accelerated transform: rotate)
// ═══════════════════════════════════════════════════════════
function triggerSpin() {
  if (isSpinning) return;
  if (availablePool.length === 0) {
    showEndState();
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;

  // Reset sync panel to spinning view (number only)
  panelLandedView.classList.add('hidden');
  panelLandedView.classList.remove('landed-anim');
  panelSpinView.classList.remove('hidden');
  if (panelLabel) panelLabel.textContent = 'NOW SELECTING';

  pointerAssembly.classList.add('active');
  startWhoosh();

  // 1. Pre-select winner
  const winnerPoolIndex = Math.floor(Math.random() * availablePool.length);
  const winner = availablePool[winnerPoolIndex];
  const winnerOrigIndex = CHARACTERS.findIndex(c => c.id === winner.id);

  // 2. Compute target rotation
  const fullSpins = 6 + Math.floor(Math.random() * 3); // 6-8 full spins
  const targetSegAngle = angleForSegment(winnerOrigIndex);
  const jitter = (Math.random() - 0.5) * (360 / 25) * 0.4; // stay centered within segment
  const baseRotation = currentRotation % 360;
  const targetRotation = currentRotation + (fullSpins * 360) + ((targetSegAngle - baseRotation + 360) % 360) + jitter;

  // 3. Animate over continuous duration
  const duration = 5500 + Math.random() * 1000; // 5.5-6.5s
  const startTime = performance.now();
  const startRotation = currentRotation;
  let lastTickIndex = -1;

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutQuint(t);

    currentRotation = startRotation + (targetRotation - startRotation) * eased;

    // GPU accelerated layer rotation (zero layout re-render)
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    // Calculate segment under top pointer
    const segIdx = getSegmentIndexAtPointer(currentRotation);

    // ONLY update panel DOM when segment number actually changes (prevents DOM lag)
    if (segIdx !== lastTickIndex) {
      lastTickIndex = segIdx;
      playTick();

      if (segIdx !== lastPanelIndex) {
        lastPanelIndex = segIdx;
        panelSpinNumber.textContent = segIdx + 1;
      }
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // 4. Landed
      currentRotation = targetRotation;
      canvas.style.transform = `rotate(${currentRotation}deg)`;
      pointerAssembly.classList.remove('active');
      stopWhoosh();

      // Reveal winner details in sync panel
      revealLandedInPanel(winner);

      // 5. Open popup modal after brief pause
      setTimeout(() => {
        showReveal(winner, winnerPoolIndex);
      }, 600);
    }
  }

  requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════════
// LANDED REVEAL IN SYNC PANEL
// ═══════════════════════════════════════════════════════════
function revealLandedInPanel(winner) {
  panelSpinView.classList.add('hidden');

  if (panelLabel) panelLabel.textContent = 'SELECTED LEGEND';
  if (panelWinBadge) panelWinBadge.textContent = `#${winner.id}`;
  panelChar.textContent = winner.character;
  panelMovie.textContent = winner.movie;
  panelImage.src = SHARED_IMAGE_URL;
  panelImage.alt = winner.character;

  panelLandedView.classList.remove('hidden');
  panelLandedView.classList.add('landed-anim');
}

// ═══════════════════════════════════════════════════════════
// REVEAL MODAL
// ═══════════════════════════════════════════════════════════
function showReveal(winner, poolIndex) {
  if (revealNumBadge) revealNumBadge.textContent = `#${winner.id}`;
  revealChar.textContent = winner.character;
  revealMovie.textContent = winner.movie;
  revealImage.src = SHARED_IMAGE_URL;
  revealImage.alt = winner.character;
  revealOverlay.classList.remove('hidden');

  playFanfare();
  launchConfetti();

  // Remove from pool
  availablePool.splice(poolIndex, 1);
  revealedCount++;
  revealedCountEl.textContent = revealedCount;

  // Redraw wheel once to dim newly used segment
  drawWheel();
}

function resetPanelToIdle() {
  revealOverlay.classList.add('hidden');
  isSpinning = false;

  // Reset panel completely back to idle state with placeholder '?'
  panelLandedView.classList.add('hidden');
  panelLandedView.classList.remove('landed-anim');
  panelSpinView.classList.remove('hidden');

  if (panelLabel) panelLabel.textContent = 'NOW SELECTING';
  if (panelSpinNumber) panelSpinNumber.textContent = '?';

  // Completely clear landed state (no leftover image or character info)
  panelImage.src = '';
  panelImage.alt = '';
  panelChar.textContent = '';
  panelMovie.textContent = '';
  if (panelWinBadge) panelWinBadge.textContent = '';

  if (availablePool.length === 0) {
    setTimeout(() => showEndState(), 300);
  } else {
    spinBtn.disabled = false;
  }
}

function closeReveal() {
  resetPanelToIdle();
}

// ═══════════════════════════════════════════════════════════
// END STATE
// ═══════════════════════════════════════════════════════════
function showEndState() {
  endOverlay.classList.remove('hidden');
  launchConfetti();
}

function resetGame() {
  availablePool = [...CHARACTERS];
  revealedCount = 0;
  revealedCountEl.textContent = '0';
  currentRotation = 0;
  lastPanelIndex = -1;
  isSpinning = false;
  canvas.style.transform = 'rotate(0deg)';

  endOverlay.classList.add('hidden');
  revealOverlay.classList.add('hidden');

  resetPanelToIdle();
  drawWheel();
}

// ═══════════════════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════════════════
let confettiPieces = [];
let confettiAnimating = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function launchConfetti() {
  resizeConfetti();
  confettiPieces = [];

  const colors = ['#E8A93B', '#F2C94C', '#5A1E1E', '#8C6A1F', '#F5F1E8', '#FF6B35', '#C8102E'];
  const count = 180;

  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
      y: confettiCanvas.height / 2 - 100,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 18,
      vy: -8 - Math.random() * 14,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.18 + Math.random() * 0.08,
      life: 1,
      decay: 0.003 + Math.random() * 0.004
    });
  }

  if (!confettiAnimating) {
    confettiAnimating = true;
    animateConfetti();
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  let alive = false;
  confettiPieces.forEach(p => {
    if (p.life <= 0) return;
    alive = true;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.99;
    p.rot += p.rotV;
    p.life -= p.decay;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rot * Math.PI) / 180);
    confettiCtx.globalAlpha = Math.max(0, p.life);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });

  if (alive) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimating = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ═══════════════════════════════════════════════════════════
// EVENT SEGMENT TOGGLE
// ═══════════════════════════════════════════════════════════
function toggleSegment() {
  if (currentSegment === 'SHIPWRECK') {
    currentSegment = 'BLOCK & TACKLE';
  } else {
    currentSegment = 'SHIPWRECK';
  }
  segBadge.textContent = currentSegment;
}

// ═══════════════════════════════════════════════════════════
// MUTE TOGGLE
// ═══════════════════════════════════════════════════════════
function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

// ═══════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    if (!spinBtn.disabled && !isSpinning) {
      triggerSpin();
    }
  }
  if (e.key === 'm' || e.key === 'M') {
    toggleMute();
  }
  if (e.key === 'Escape') {
    if (!revealOverlay.classList.contains('hidden')) {
      closeReveal();
    }
  }
  if (e.key === 'Enter') {
    if (!revealOverlay.classList.contains('hidden')) {
      closeReveal();
    }
  }
});

// ═══════════════════════════════════════════════════════════
// IDLE LIGHT LOOP (Throttled for zero CPU draw during spin)
// ═══════════════════════════════════════════════════════════
function startIdleLightLoop() {
  let lastTime = 0;
  function loop(now) {
    if (!isSpinning && now - lastTime > 200) {
      lastTime = now;
      drawWheel();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
async function init() {
  totalCountEl.textContent = CHARACTERS.length;

  // Preload single shared reveal image
  await preloadSharedImage();

  await new Promise(r => setTimeout(r, 200));

  loadingScreen.classList.add('hidden');
  appEl.classList.remove('hidden');

  // Initial wheel draw
  drawWheel();
  canvas.style.transform = 'rotate(0deg)';

  startIdleLightLoop();

  spinBtn.disabled = false;

  spinBtn.addEventListener('click', triggerSpin);
  panelContinueBtn.addEventListener('click', resetPanelToIdle);
  revealCloseBtn.addEventListener('click', closeReveal);
  endResetBtn.addEventListener('click', resetGame);
  segToggle.addEventListener('click', toggleSegment);
  muteBtn.addEventListener('click', toggleMute);

  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();
}

// Start
init();
