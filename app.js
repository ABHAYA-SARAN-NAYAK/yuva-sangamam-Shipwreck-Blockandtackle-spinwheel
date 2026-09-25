/* ═══════════════════════════════════════════════════════════
   WHEEL OF RAJINIKANTH — Core Application Logic
   
   Architecture:
   1. Pre-select winner → compute target angle → animate wheel
   2. Every rAF frame: read rotation → derive segment under pointer
      → update sync panel (fast flicker → slow → stop)
   3. On land: reveal popup + confetti + sound
   ═══════════════════════════════════════════════════════════ */

// ── DATA ──
const CHARACTERS = [
  { id: 1, movie: "Jailer", character: "Muthuvel Pandian / Tiger Muthuvel Pandian", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354281/Jailer_cw8eon.png" },
  { id: 2, movie: "Petta", character: "Kaali / Petta Velan", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354279/Petta_terbuo.png" },
  { id: 3, movie: "Kaala", character: "Karikalan (Kaala)", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354279/Kaala_qp54gp.png" },
  { id: 4, movie: "Kabali", character: "Kabaleeswaran", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354278/Kabali_ibxa9w.png" },
  { id: 5, movie: "Enthiran", character: "Dr. Vaseegaran / Chitti", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354277/Enthiran_qrg8lz.png" },
  { id: 6, movie: "Sivaji", character: "Sivaji Arumugam / M.G.R.", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354278/Sivaji_vifcw4.png" },
  { id: 7, movie: "Chandramukhi", character: "Dr. Saravanan / Vettaiyan Raja", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354276/Chandramukhi_upffp6.png" },
  { id: 8, movie: "Padayappa", character: "Aarupadayappa", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354276/Padayappa_qaeemr.png" },
  { id: 9, movie: "Arunachalam", character: "Arunachalam", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354274/Arunachalam_wajtn6.png" },
  { id: 10, movie: "Muthu", character: "Muthu / Zamindar Ayya", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354273/Muthu_qaztx8.png" },
  { id: 11, movie: "Baasha", character: "Manickam / Manick Baasha", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354273/Baasha_lgdxze.png" },
  { id: 12, movie: "Ejamaan", character: "Vaanavarayan", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354271/Ejamaan_n4oubr.png" },
  { id: 13, movie: "Annamalai", character: "Annamalai", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354271/Annamalai_a8a4ic.png" },
  { id: 14, movie: "Thalapathi", character: "Surya", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354278/Thalapathi_m92scj.png" },
  { id: 15, movie: "Dharmathin Thalaivan", character: "Prof. Balu Subramaniam / Shankar", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354277/Dharmathin_Thalaivan_mou50w.png" },
  { id: 16, movie: "Baba", character: "Baba", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354275/Baba_bvz72r.png" },
  { id: 17, movie: "Kochadaiiyaan", character: "Kochadaiiyaan / Rana / Seena", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354276/Kochadaiiyaan_va9mzs.png" },
  { id: 18, movie: "Lingaa", character: "Raja Lingeswaran / Lingaa", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354275/Lingaa_xob3m6.png" },
  { id: 19, movie: "2.0", character: "Dr. Vaseegaran / Chitti", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354276/2.0_qxp9wt.png" },
  { id: 20, movie: "Darbar", character: "Aaditya Arunachalam", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354273/Darbar_bjvavf.png" },
  { id: 21, movie: "Annaatthe", character: "Kaalaiyan", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354273/Annaatthe_rswjfg.png" },
  { id: 22, movie: "Padikkadavan", character: "Raja (Rajendran)", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354279/Padikkadavan_hayf1m.png" },
  { id: 23, movie: "Vettaiyan", character: "S. P. Athiyan", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354271/Vettaiyan_xvauh7.png" },
  { id: 24, movie: "Coolie", character: "Deva", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354272/Coolie_y0dbji.png" },
  { id: 25, movie: "Billa", character: "Billa / Rajappa", image: "https://res.cloudinary.com/dkht5j3tw/image/upload/v1790354271/Billa_drgar5.png" }
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
const canvas        = $('wheel-canvas');
const ctx           = canvas.getContext('2d');
const spinBtn       = $('spin-btn');
const panelImage    = $('panel-image');
const panelChar     = $('panel-character');
const panelMovie    = $('panel-movie');
const panelFrame    = $('panel-image-frame');
const revealOverlay = $('reveal-overlay');
const revealImage   = $('reveal-image');
const revealChar    = $('reveal-character');
const revealMovie   = $('reveal-movie');
const revealCloseBtn= $('reveal-close-btn');
const endOverlay    = $('end-overlay');
const endResetBtn   = $('end-reset-btn');
const pointerAssembly = $('pointer-assembly');
const muteBtn       = $('mute-btn');
const segBadge      = $('segment-badge');
const segToggle     = $('segment-toggle');
const confettiCanvas= $('confetti-canvas');
const confettiCtx   = confettiCanvas.getContext('2d');
const loaderBar     = $('loader-bar-fill');
const loaderProg    = $('loader-progress');
const loadingScreen = $('loading-screen');
const appEl         = $('app');
const revealedCountEl = $('revealed-count');
const totalCountEl  = $('total-count');

// ── WHEEL DRAWING CONFIG ──
const SEGMENT_COLORS = ['#5A1E1E', '#8C6A1F', '#1A1A1E'];
const SEGMENT_ANGLE  = (2 * Math.PI) / 25;
const CANVAS_SIZE    = 900;                // internal canvas px
const CENTER         = CANVAS_SIZE / 2;    // 450
const RADIUS         = (CANVAS_SIZE / 2) - 12; // 438

// ── AUDIO (Web Audio API — generated procedurally, no external files) ──
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
    const ctx = ensureAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch(e) {}
}

function playFanfare() {
  if (isMuted) return;
  try {
    const ctx = ensureAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch(e) {}
}

// ── Whoosh / wind loop during spin ──
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
      whooshGain.gain.linearRampToValueAtTime(0.001, ac.currentTime + 0.5);
    }
    if (whooshNode) {
      setTimeout(() => {
        try { whooshNode.stop(); } catch(e) {}
        whooshNode = null;
        whooshGain = null;
      }, 600);
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
// IMAGE PRELOADING
// ═══════════════════════════════════════════════════════════
const preloadedImages = {};   // id → Image element

function preloadAllImages() {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = CHARACTERS.length;

    CHARACTERS.forEach((ch) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = img.onerror = () => {
        loaded++;
        preloadedImages[ch.id] = img;
        const pct = Math.round((loaded / total) * 100);
        loaderBar.style.width = pct + '%';
        loaderProg.textContent = `${loaded} / ${total} images`;
        if (loaded === total) resolve();
      };
      img.src = ch.image;
    });
  });
}

// ═══════════════════════════════════════════════════════════
// WHEEL DRAWING (Canvas)
// ═══════════════════════════════════════════════════════════
function drawWheel(rotationDeg) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const rotRad = (rotationDeg * Math.PI) / 180;
  const sliceRadius = RADIUS - 16; // Slices fit inside outer metallic rim

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

  // ── Segments (Slice Fills) ──
  for (let i = 0; i < 25; i++) {
    const startAngle = rotRad + i * SEGMENT_ANGLE - Math.PI / 2;
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

    // Segment border
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // ── Segment label (Vertical & Bold movie name + number along slice radius) ──
    ctx.save();
    const midAngle = startAngle + SEGMENT_ANGLE / 2;
    const ch = CHARACTERS[i];

    ctx.translate(CENTER, CENTER);
    ctx.rotate(midAngle);

    // Number tag near outer edge of slice
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFE082';
    ctx.font = 'bold 20px "Oswald", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), sliceRadius - 10, 0);

    // Movie name written vertically (radially along the slice, BOLD)
    const movieText = ch.movie.toUpperCase();
    const movieDisplay = movieText.length > 18 ? movieText.substring(0, 16) + '…' : movieText;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Oswald", sans-serif';
    ctx.fillText(movieDisplay, sliceRadius - 44, 0);

    ctx.restore();

    // ── Small character portrait in segment ──
    const thumbR = sliceRadius * 0.32;
    const tx = CENTER + thumbR * Math.cos(midAngle);
    const ty = CENTER + thumbR * Math.sin(midAngle);
    const thumbSize = 34;

    if (preloadedImages[ch.id] && preloadedImages[ch.id].complete && preloadedImages[ch.id].naturalWidth > 0) {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.beginPath();
      ctx.arc(0, 0, thumbSize / 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(preloadedImages[ch.id], -thumbSize / 2, -thumbSize / 2, thumbSize, thumbSize);
      ctx.restore();

      // Thumbnail border
      ctx.save();
      ctx.beginPath();
      ctx.arc(tx, ty, thumbSize / 2, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
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
    const bulbAngle = rotRad + b * ((2 * Math.PI) / totalBulbs);
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

    // Inner bright bulb point
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
    if (usedIds.has(CHARACTERS[i].id)) {
      const startAngle = rotRad + i * SEGMENT_ANGLE - Math.PI / 2;
      const endAngle   = startAngle + SEGMENT_ANGLE;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, sliceRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = 'rgba(11, 11, 14, 0.72)';
      ctx.fill();

      // "Used" checkmark
      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const cr = sliceRadius * 0.65;
      const cx2 = CENTER + cr * Math.cos(midAngle);
      const cy2 = CENTER + cr * Math.sin(midAngle);
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', cx2, cy2);
      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SEGMENT-INDEX-FROM-ROTATION  
// Given the wheel's current rotation, which ORIGINAL segment
// index (0-24) is under the top pointer (12 o'clock)?
// ═══════════════════════════════════════════════════════════
function getSegmentIndexAtPointer(rotDeg) {
  const segAngleDeg = 360 / 25;
  // Normalize rotation into [0, 360)
  const norm = ((rotDeg % 360) + 360) % 360;
  // Clockwise rotation R brings segment i to top when:
  // -90° + i * 14.4° + R = -90° => i * 14.4° = 360° - R
  const angleFromStart = (360 - norm) % 360;
  const idx = Math.floor(angleFromStart / segAngleDeg) % 25;
  return idx;
}

// Given a target segment index, compute the rotation angle that places
// the CENTER of that segment exactly under the top pointer (12 o'clock).
function angleForSegment(segIndex) {
  const segAngleDeg = 360 / 25;
  // Center of segment segIndex is at segIndex * 14.4° + 7.2°.
  // To center it under top pointer at rotation R: R = 360° - (segIndex * 14.4° + 7.2°)
  const target = 360 - (segIndex * segAngleDeg + segAngleDeg / 2);
  return ((target % 360) + 360) % 360;
}

// ═══════════════════════════════════════════════════════════
// SPIN LOGIC
// ═══════════════════════════════════════════════════════════
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function triggerSpin() {
  if (isSpinning) return;
  if (availablePool.length === 0) {
    showEndState();
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  panelFrame.classList.add('spinning');
  panelFrame.classList.remove('landed');
  pointerAssembly.classList.add('active');
  startWhoosh();

  // 1. Pre-select winner
  const winnerPoolIndex = Math.floor(Math.random() * availablePool.length);
  const winner = availablePool[winnerPoolIndex];
  const winnerOrigIndex = CHARACTERS.findIndex(c => c.id === winner.id);

  // 2. Compute target rotation
  const fullSpins = 6 + Math.floor(Math.random() * 3); // 6-8 full spins
  const targetSegAngle = angleForSegment(winnerOrigIndex);
  const jitter = (Math.random() - 0.5) * (360 / 25) * 0.5; // stay within segment
  const baseRotation = currentRotation % 360;
  const targetRotation = currentRotation + (fullSpins * 360) + ((targetSegAngle - baseRotation + 360) % 360) + jitter;

  // 3. Animate
  const duration = 5500 + Math.random() * 1500; // 5.5-7s
  const startTime = performance.now();
  const startRotation = currentRotation;
  let lastTickIndex = -1;

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutQuint(t);

    currentRotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel(currentRotation);

    // Sync panel: which segment is under pointer now?
    const segIdx = getSegmentIndexAtPointer(currentRotation);

    // Tick sound on segment change
    if (segIdx !== lastTickIndex) {
      lastTickIndex = segIdx;
      playTick();

      // Update sync panel with current segment's character
      const currentChar = CHARACTERS[segIdx];
      if (segIdx !== lastPanelIndex) {
        lastPanelIndex = segIdx;
        panelChar.textContent = currentChar.character;
        panelMovie.textContent = currentChar.movie;
        if (preloadedImages[currentChar.id] && preloadedImages[currentChar.id].naturalWidth > 0) {
          panelImage.src = currentChar.image;
          panelImage.alt = currentChar.character;
        } else {
          panelImage.src = '';
          panelImage.alt = currentChar.character;
        }
      }
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // 4. Land exactly
      currentRotation = targetRotation;
      drawWheel(currentRotation);
      pointerAssembly.classList.remove('active');
      stopWhoosh();

      // Snap panel to winner
      panelChar.textContent = winner.character;
      panelMovie.textContent = winner.movie;
      panelImage.src = winner.image;
      panelImage.alt = winner.character;
      panelFrame.classList.remove('spinning');
      panelFrame.classList.add('landed');
      lastPanelIndex = winnerOrigIndex;

      // 5. Reveal after short pause
      setTimeout(() => {
        showReveal(winner, winnerPoolIndex);
      }, 600);
    }
  }

  requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════════
// REVEAL POPUP
// ═══════════════════════════════════════════════════════════
function showReveal(winner, poolIndex) {
  revealChar.textContent = winner.character;
  revealMovie.textContent = winner.movie;
  revealImage.src = winner.image;
  revealImage.alt = winner.character;
  revealOverlay.classList.remove('hidden');

  playFanfare();
  launchConfetti();

  // Remove from pool
  availablePool.splice(poolIndex, 1);
  revealedCount++;
  revealedCountEl.textContent = revealedCount;

  // Redraw wheel to dim used segment
  drawWheel(currentRotation);
}

function closeReveal() {
  revealOverlay.classList.add('hidden');
  isSpinning = false;
  panelFrame.classList.remove('landed');

  if (availablePool.length === 0) {
    setTimeout(() => showEndState(), 300);
  } else {
    spinBtn.disabled = false;
  }
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
  endOverlay.classList.add('hidden');
  revealOverlay.classList.add('hidden');
  panelChar.textContent = '—';
  panelMovie.textContent = 'Spin the wheel to begin';
  panelImage.src = '';
  panelFrame.classList.remove('spinning', 'landed');
  spinBtn.disabled = false;
  drawWheel(0);
}

// ═══════════════════════════════════════════════════════════
// CONFETTI (lightweight custom implementation)
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
// EVENT SEGMENT TOGGLE (Shipwreck ↔ Block and Tackle)
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
// IDLE LED LIGHT ANIMATION LOOP
// ═══════════════════════════════════════════════════════════
function startIdleLightLoop() {
  function loop() {
    if (!isSpinning) {
      drawWheel(currentRotation);
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

  // Preload images
  await preloadAllImages();

  // Small delay for smooth transition
  await new Promise(r => setTimeout(r, 400));

  // Hide loader, show app
  loadingScreen.classList.add('hidden');
  appEl.classList.remove('hidden');

  // Initial wheel draw
  drawWheel(0);

  // Start LED light animation loop
  startIdleLightLoop();

  // Enable spin
  spinBtn.disabled = false;

  // Bind events
  spinBtn.addEventListener('click', triggerSpin);
  revealCloseBtn.addEventListener('click', closeReveal);
  endResetBtn.addEventListener('click', resetGame);
  segToggle.addEventListener('click', toggleSegment);
  muteBtn.addEventListener('click', toggleMute);

  // Resize confetti canvas
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();
}

// Start
init();
