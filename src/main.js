import musicUrl from './assets/maa.mp3';

// ── Photo assets (real photos in /src/assets/) ──────────────
const PHOTO_MODULES = import.meta.glob(
  './assets/*.{jpg,JPG,jpeg,JPEG,png,PNG}',
  { eager: true, query: '?url', import: 'default' }
);
const PHOTOS = {};
for (const [path, url] of Object.entries(PHOTO_MODULES)) {
  const m = path.match(/\/(\d+)\.[^.]+$/);
  if (m) PHOTOS[parseInt(m[1], 10)] = url;
}

// ── Island data ──────────────────────────────────────────────
const ISLANDS = [
  { id: 1,  label: "Where It All Began",    emoji: "⭐", caption: "The very beginning of everything I love.",                              special: true  },
  { id: 2,  label: "Lullaby Lagoon",        emoji: "🌙", caption: "Your voice at night, softer than moonlight."                                          },
  { id: 3,  label: "First Steps Shore",     emoji: "👣", caption: "You clapped like it was the greatest thing in the world."                             },
  { id: 4,  label: "School Days Bay",       emoji: "📚", caption: "Tiffin boxes and morning braids — love in the little things."                        },
  { id: 5,  label: "Festival Island",       emoji: "🪔", caption: "Every celebration felt magical because you made it so."                               },
  { id: 6,  label: "Kitchen Cove",          emoji: "🍲", caption: "The smell of your cooking is home, wherever I am."                                    },
  { id: 7,  label: "Rainy Day Refuge",      emoji: "🌧️", caption: "Wrapped in a blanket, the rain outside, you beside me."                              },
  { id: 8,  label: "Story-Time Strait",     emoji: "📖", caption: "You gave me worlds before I could read them myself."                                  },
  { id: 9,  label: "Garden of Giggles",     emoji: "🌸", caption: "Your laugh — the best sound I have ever known."                                       },
  { id: 10, label: "Courage Cape",          emoji: "🦋", caption: "You told me I could, so I did."                                                       },
  { id: 11, label: "Temple of Patience",    emoji: "🙏", caption: "You never gave up on me, even when I gave up on myself."                              },
  { id: 12, label: "Sunday Morning Sands",  emoji: "☀️", caption: "Slow mornings with chai — I want a thousand more of those."                          },
  { id: 13, label: "Growing-Up Grotto",     emoji: "🌱", caption: "You let me grow into myself while always holding space."                              },
  { id: 14, label: "Milestone Mountain",    emoji: "🏔️", caption: "Every big moment — you were the first I wanted to tell."                             },
  { id: 15, label: "Worry Waters",          emoji: "💙", caption: "You carried my fears quietly so I could carry my dreams."                             },
  { id: 16, label: "Memory Meadow",         emoji: "🌼", caption: "A lifetime of small perfect moments, and you're in every one."                        },
  { id: 17, label: "Home Harbour",          emoji: "🏠", caption: "No matter where I go, you are always where home is.",          special: true          },
];

const POSITIONS = [
  { x: 180, y: 1280 }, { x: 340, y: 1170 }, { x: 200, y: 1050 }, { x: 380, y: 950  },
  { x: 560, y: 860  }, { x: 390, y: 750  }, { x: 200, y: 660  }, { x: 350, y: 560  },
  { x: 560, y: 480  }, { x: 700, y: 380  }, { x: 560, y: 280  }, { x: 380, y: 200  },
  { x: 220, y: 290  }, { x: 130, y: 420  }, { x: 260, y: 520  }, { x: 700, y: 580  },
  { x: 700, y: 200  },
];

const isMobile = () => window.innerWidth < 768;

function buildPath(pts) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur  = pts[i];
    const cpx1 = prev.x + (cur.x - prev.x) * 0.4;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (cur.x - prev.x) * 0.6;
    const cpy2 = cur.y;
    d += ` C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${cur.x} ${cur.y}`;
  }
  return d;
}

// ── State ───────────────────────────────────────────────────
let currentIsland = 0;
let isAnimating = false;
let lastOpenedIdx = -1;
let mapRevealed = false;

// ── DOM refs ────────────────────────────────────────────────
const appEl       = document.getElementById('app');
const splash      = document.getElementById('title-card');
const btnMusic    = document.getElementById('btn-music');
const btnSilent   = document.getElementById('btn-silent');
const btnSound    = document.getElementById('btn-sound-toggle');
const soundTip    = document.getElementById('sound-tooltip');
const mapSVG      = document.getElementById('map-svg');
const boatWrap    = document.getElementById('boat-wrap');
const mapWorld    = document.getElementById('map-world');
const mapViewport = document.getElementById('map-viewport');
const decoSVG     = document.getElementById('deco-svg');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');
const counterCur  = document.getElementById('counter-cur');
const overlay     = document.getElementById('photo-overlay');
const overlayImg  = document.getElementById('overlay-img');
const overlayCap  = document.getElementById('overlay-caption');
const overlayName = document.getElementById('overlay-island-name');
const photoBack   = document.getElementById('btn-photo-back');
const photoNextEl = document.getElementById('btn-photo-next');
const letterOverlay = document.getElementById('letter-overlay');
const btnRestart    = document.getElementById('btn-restart');

// ── Audio ───────────────────────────────────────────────────
const music = new Audio(musicUrl);
music.loop = true;
music.volume = 0.55;
music.preload = 'auto';

function syncSoundIcon() {
  if (!btnSound) return;
  const playing = !music.paused;
  btnSound.textContent = playing ? '🔊' : '🔇';
  btnSound.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
  btnSound.classList.toggle('is-muted', !playing);
}
music.addEventListener('play',  syncSoundIcon);
music.addEventListener('pause', syncSoundIcon);
music.addEventListener('ended', syncSoundIcon);

function startMusic() {
  // Triggered from a user gesture, so autoplay restrictions are satisfied.
  music.play().catch(() => { /* silently fall back to muted state */ }).finally(syncSoundIcon);
}

if (btnSound) {
  btnSound.addEventListener('click', () => {
    if (music.paused) music.play().catch(() => {});
    else music.pause();
    syncSoundIcon();
  });
}

// ── Decorative SVG ─────────────────────
function renderDeco() {
  decoSVG.innerHTML = `
    <g transform="translate(330,780)" opacity="0.55">
      <circle cx="0" cy="0" r="32" fill="none" stroke="#C8903A" stroke-width="1.2"/>
      <circle cx="0" cy="0" r="4"  fill="#C8903A"/>
      <polygon points="0,-28 5,-8 0,-12 -5,-8" fill="#C8903A"/>
      <polygon points="0,28 5,8 0,12 -5,8" fill="#8B6340" opacity="0.7"/>
      <polygon points="28,0 8,5 12,0 8,-5" fill="#8B6340" opacity="0.7"/>
      <polygon points="-28,0 -8,5 -12,0 -8,-5" fill="#8B6340" opacity="0.7"/>
      <text x="0" y="-35" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="11" fill="#C8903A" font-style="italic">N</text>
      <text x="0" y="44"  text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="10" fill="#8B6340">S</text>
      <text x="36" y="4"  text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="10" fill="#8B6340">E</text>
      <text x="-36" y="4" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="10" fill="#8B6340">W</text>
    </g>
    <text x="50%" y="28" text-anchor="middle" font-family="Cormorant Garamond,serif" font-style="italic" font-size="15" fill="#8B6340" opacity="0.55" letter-spacing="3">A Map of Memories</text>
  `;
}

// ── Map background ───────────────────────────────
function renderMapBackground() {
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `
    <filter id="paper" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="islandBlur"><feGaussianBlur stdDeviation="1.5"/></filter>
    <radialGradient id="islandGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C8903A" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#C8903A" stop-opacity="0"/>
    </radialGradient>
  `;
  mapSVG.appendChild(defs);

  const ocean = document.createElementNS(ns, 'rect');
  ocean.setAttribute('x', '-2000'); ocean.setAttribute('y', '-2000');
  ocean.setAttribute('width', '5000'); ocean.setAttribute('height', '5000');
  ocean.setAttribute('fill', '#FDF4E0');
  mapSVG.appendChild(ocean);

  const waveGroup = document.createElementNS(ns, 'g');
  waveGroup.setAttribute('opacity', '0.12');
  waveGroup.setAttribute('stroke', '#C8903A');
  waveGroup.setAttribute('stroke-width', '0.8');
  waveGroup.setAttribute('fill', 'none');
  for (let y = 80; y < 1400; y += 55) {
    const p = document.createElementNS(ns, 'path');
    let d = `M 0 ${y}`;
    for (let x = 0; x <= 900; x += 60) d += ` q 15,-8 30,0 q 15,8 30,0`;
    p.setAttribute('d', d);
    waveGroup.appendChild(p);
  }
  mapSVG.appendChild(waveGroup);

  [[100,100],[700,150],[820,500],[80,700],[750,900],[200,1100]].forEach(([cx,cy]) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('opacity', '0.18');
    [0,18,-14,22,-8].forEach((ox,i) => {
      const c = document.createElementNS(ns, 'ellipse');
      c.setAttribute('cx', cx + ox);
      c.setAttribute('cy', cy + (i%2===0 ? 0 : -7));
      c.setAttribute('rx', 12 + i*2); c.setAttribute('ry', 8);
      c.setAttribute('fill', '#C8903A');
      g.appendChild(c);
    });
    mapSVG.appendChild(g);
  });
}

// ── Path used for boat curve ─────────────────────────
let pathEl = null;
let pathTotalLen = 0;
const segmentLengths = []; // cumulative path length up to each island index

function buildPathSegments() {
  // Use a hidden temporary path per segment to measure cumulative arc lengths
  const ns = 'http://www.w3.org/2000/svg';
  const tmp = document.createElementNS(ns, 'svg');
  tmp.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden');
  document.body.appendChild(tmp);
  segmentLengths.length = 0;
  segmentLengths.push(0);
  let total = 0;
  for (let i = 1; i < POSITIONS.length; i++) {
    const p = document.createElementNS(ns, 'path');
    const prev = POSITIONS[i-1];
    const cur  = POSITIONS[i];
    const cpx1 = prev.x + (cur.x - prev.x) * 0.4;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (cur.x - prev.x) * 0.6;
    const cpy2 = cur.y;
    p.setAttribute('d', `M ${prev.x} ${prev.y} C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${cur.x} ${cur.y}`);
    tmp.appendChild(p);
    total += p.getTotalLength();
    segmentLengths.push(total);
  }
  pathTotalLen = total;
  tmp.remove();
}

// ── Islands ───────────────────────────────────────────────
function renderIslands() {
  const ns = 'http://www.w3.org/2000/svg';

  const pathD = buildPath(POSITIONS);
  pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', pathD);
  pathEl.setAttribute('fill', 'none');
  pathEl.setAttribute('stroke', '#8B6340');
  pathEl.setAttribute('stroke-width', isMobile() ? '4' : '2.5');
  pathEl.setAttribute('stroke-dasharray', '8 10');
  pathEl.setAttribute('stroke-linecap', 'round');
  pathEl.setAttribute('opacity', '0.7');
  pathEl.setAttribute('id', 'journey-path');
  mapSVG.appendChild(pathEl);

  // Direction arrows
  ISLANDS.forEach((isl, i) => {
    if (i === 0) return;
    const prev = POSITIONS[i-1];
    const cur  = POSITIONS[i];
    const mx = (prev.x + cur.x)/2;
    const my = (prev.y + cur.y)/2;
    const angle = Math.atan2(cur.y - prev.y, cur.x - prev.x) * 180 / Math.PI;
    const arr = document.createElementNS(ns, 'polygon');
    arr.setAttribute('points', '0,-3.5 7,0 0,3.5');
    arr.setAttribute('fill', '#C8903A');
    arr.setAttribute('opacity', '0.45');
    arr.setAttribute('transform', `translate(${mx},${my}) rotate(${angle})`);
    mapSVG.appendChild(arr);
  });

  ISLANDS.forEach((isl, i) => {
    const {x, y} = POSITIONS[i];
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'island-group');
    g.setAttribute('id', `island-${i}`);
    g.setAttribute('data-index', i);
    g.setAttribute('transform', `translate(${x},${y})`);
    g.setAttribute('aria-label', isl.label);

    const isSpecial = isl.special;
    const r = isSpecial ? 28 : 22;

    const glow = document.createElementNS(ns, 'circle');
    glow.setAttribute('cx', '0'); glow.setAttribute('cy', '0');
    glow.setAttribute('r', r + 14);
    glow.setAttribute('fill', 'url(#islandGrad)');
    glow.setAttribute('class', 'island-glow');
    g.appendChild(glow);

    const blob = document.createElementNS(ns, 'path');
    blob.setAttribute('d', islandBlob(r));
    blob.setAttribute('fill', isSpecial ? '#C8903A' : '#D4A56A');
    blob.setAttribute('stroke', '#8B6340');
    blob.setAttribute('stroke-width', '1.8');
    blob.setAttribute('class', 'island-body');
    g.appendChild(blob);

    const inner = document.createElementNS(ns, 'path');
    inner.setAttribute('d', islandBlob(r * 0.55));
    inner.setAttribute('fill', isSpecial ? '#E8B86D' : '#E8C98A');
    inner.setAttribute('opacity', '0.6');
    g.appendChild(inner);

    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('cx', '0'); ring.setAttribute('cy', '0');
    ring.setAttribute('r', isSpecial ? '10' : '8');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#C8903A');
    ring.setAttribute('stroke-width', isSpecial ? '2.5' : '1.8');
    ring.setAttribute('class', 'island-pulse island-ring');
    g.appendChild(ring);

    const emojiT = document.createElementNS(ns, 'text');
    emojiT.setAttribute('x', '0'); emojiT.setAttribute('y', '5');
    emojiT.setAttribute('text-anchor', 'middle');
    emojiT.setAttribute('class', `island-emoji${isSpecial ? ' special' : ''}`);
    emojiT.textContent = isl.emoji;
    g.appendChild(emojiT);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', r + 16);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', `island-label${isSpecial ? ' special' : ''}`);
    label.textContent = isl.label;
    g.appendChild(label);

    // Number / visited check badge
    const numBg = document.createElementNS(ns, 'circle');
    numBg.setAttribute('cx', r - 2); numBg.setAttribute('cy', -(r - 2));
    numBg.setAttribute('r', isMobile() ? '11' : '8');
    numBg.setAttribute('fill', '#3E2A14');
    numBg.setAttribute('class', 'island-num-bg');
    g.appendChild(numBg);

    const numT = document.createElementNS(ns, 'text');
    numT.setAttribute('x', r - 2); numT.setAttribute('y', -(r - (isMobile() ? 8 : 6)));
    numT.setAttribute('text-anchor', 'middle');
    numT.setAttribute('class', 'island-num');
    numT.textContent = isl.id;
    g.appendChild(numT);

    const checkT = document.createElementNS(ns, 'text');
    checkT.setAttribute('x', r - 2); checkT.setAttribute('y', -(r - (isMobile() ? 7 : 5)));
    checkT.setAttribute('text-anchor', 'middle');
    checkT.setAttribute('class', 'island-check');
    checkT.textContent = '✓';
    g.appendChild(checkT);

    mapSVG.appendChild(g);
  });
}

function islandBlob(r) {
  const pts = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI/2;
    const jitter = 0.72 + Math.sin(i * 2.3 + 1) * 0.28;
    pts.push({ x: Math.cos(angle) * r * jitter, y: Math.sin(angle) * r * jitter * 0.75 });
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i+1) % pts.length];
    const mx = (a.x+b.x)/2; const my = (a.y+b.y)/2;
    d += ` Q ${b.x.toFixed(1)} ${b.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d + ' Z';
}

// ── Boat positioning ─────────────────────────────────────────
function setBoatPosition(pos, angle = 0) {
  boatWrap.style.left = pos.x + 'px';
  boatWrap.style.top  = pos.y + 'px';
  const boatSVG = document.getElementById('boat-svg');
  boatSVG.style.transform = angle > 90 || angle < -90 ? 'scaleX(-1)' : 'scaleX(1)';
}

// Animate the boat along the actual SVG curve between two adjacent islands
function animateBoatAlongPath(fromIdx, toIdx, onDone, durOverride) {
  const dur = durOverride || (1800 + Math.random() * 700); // 1.8 – 2.5s
  const start = performance.now();

  if (!pathEl) { setBoatPosition(POSITIONS[toIdx], 0); onDone && onDone(); return; }

  const dir = toIdx > fromIdx ? 1 : -1;
  const fromLen = segmentLengths[fromIdx] ?? 0;
  const toLen   = segmentLengths[toIdx]   ?? 0;

  function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const len = fromLen + (toLen - fromLen) * ease;
    const pt  = pathEl.getPointAtLength(Math.max(0, Math.min(pathTotalLen, len)));
    const ahead = pathEl.getPointAtLength(Math.max(0, Math.min(pathTotalLen, len + dir * 2)));
    const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
    setBoatPosition({ x: pt.x, y: pt.y }, angle);
    centerViewOn(pt.x, pt.y, false);
    if (t < 1) requestAnimationFrame(tick);
    else {
      setBoatPosition(POSITIONS[toIdx], 0);
      centerViewOn(POSITIONS[toIdx].x, POSITIONS[toIdx].y, true);
      onDone && onDone();
    }
  }
  requestAnimationFrame(tick);
}

// ── Viewport / scaling ───────────────────────────────────────
let currentScale = 1;
let currentTranslate = { x: 0, y: 0 };

function computeScale() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const byWidth  = vw / 900;
  const byHeight = vh / 1400;
  if (isMobile()) return Math.min(byWidth, byHeight);
  return Math.max(byWidth, byHeight);
}

function initViewport() {
  currentScale = computeScale();
  mapWorld.style.width  = '900px';
  mapWorld.style.height = '1400px';
  mapViewport.style.overflow = 'hidden';
  currentTranslate = { x: 0, y: 0 };
}

function centerViewOn(wx, wy, smooth) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left, top;
  if (isMobile()) {
    left = (vw - 900 * currentScale) / 2;
    top  = (vh - 1400 * currentScale) / 2;
  } else {
    left = vw / 2 - wx * currentScale;
    top  = vh / 2 - wy * currentScale;
  }
  currentTranslate = { x: left, y: top };
  mapWorld.style.transition = smooth
    ? 'left 0.7s cubic-bezier(0.22,1,0.36,1), top 0.7s cubic-bezier(0.22,1,0.36,1)'
    : 'none';
  mapWorld.style.left = left + 'px';
  mapWorld.style.top  = top  + 'px';
  mapWorld.style.transform = `scale(${currentScale})`;
}

// ── Visited / arrived state ─────────────────────────────────
function highlightIsland(idx) {
  document.querySelectorAll('.island-arrived').forEach(el => el.classList.remove('island-arrived'));
  const g = document.getElementById(`island-${idx}`);
  if (g) {
    g.classList.add('island-arrived');
    // current island is not "visited" — it's active
    g.classList.remove('island-visited');
  }
}

function markVisitedUpTo(idx) {
  // Mark every island strictly before idx as visited; clear visited beyond it.
  for (let i = 0; i < ISLANDS.length; i++) {
    const g = document.getElementById(`island-${i}`);
    if (!g) continue;
    if (i < idx) g.classList.add('island-visited');
    else g.classList.remove('island-visited');
  }
}

function clearAllStates() {
  document.querySelectorAll('.island-arrived, .island-visited').forEach(el => {
    el.classList.remove('island-arrived', 'island-visited');
  });
}

// ── Navigation ───────────────────────────────────────────────
function navigateTo(idx, openPhoto = true) {
  if (isAnimating) return;
  if (idx < 0 || idx >= ISLANDS.length) return;
  const prevIdx = currentIsland;
  if (prevIdx === idx) {
    if (openPhoto) openOverlay(idx);
    return;
  }

  isAnimating = true;
  currentIsland = idx;
  counterCur.textContent = idx + 1;

  // Step through islands (one segment at a time) so the boat traces the curve.
  let steps = [prevIdx];
  if (Math.abs(idx - prevIdx) > 1) {
    const dir = idx > prevIdx ? 1 : -1;
    for (let i = prevIdx + dir; i !== idx; i += dir) steps.push(i);
  }
  steps.push(idx);

  let stepI = 0;
  function doStep() {
    if (stepI >= steps.length - 1) {
      markVisitedUpTo(idx);
      highlightIsland(idx);
      isAnimating = false;
      if (openPhoto) setTimeout(() => openOverlay(idx), 300);
      return;
    }
    animateBoatAlongPath(steps[stepI], steps[stepI+1], () => {
      stepI++;
      setTimeout(doStep, stepI === steps.length - 1 ? 0 : 60);
    });
  }
  doStep();
}

function goNext() { if (currentIsland < ISLANDS.length - 1) navigateTo(currentIsland + 1); }
function goPrev() { if (currentIsland > 0) navigateTo(currentIsland - 1); }

// ── Photo Overlay ────────────────────────────────────────────
function openOverlay(idx) {
  const isl = ISLANDS[idx];
  const src = PHOTOS[idx + 1];
  lastOpenedIdx = idx;

  overlayCap.textContent  = isl.caption;
  overlayName.textContent = isl.label;
  overlay.classList.remove('hidden');

  // Update Back / Next button visibility & labels
  if (photoBack) {
    photoBack.disabled = (idx === 0);
    photoBack.style.visibility = (idx === 0) ? 'hidden' : 'visible';
  }
  if (photoNextEl) {
    photoNextEl.textContent = (idx === ISLANDS.length - 1) ? 'Open the Letter →' : 'Next →';
  }

  const ph = overlay.querySelector('.photo-placeholder');
  if (ph) ph.remove();

  if (!src) {
    overlayImg.style.display = 'none';
    const p = document.createElement('div');
    p.className = 'photo-placeholder';
    p.innerHTML = `<div style="font-size:40px">${isl.emoji}</div><div>${isl.label}</div><div style="font-size:13px;opacity:0.6">photo ${idx+1} not found</div>`;
    document.getElementById('overlay-inner').insertBefore(p, document.getElementById('overlay-caption-wrap'));
    return;
  }

  const img = new Image();
  img.onload = () => {
    overlayImg.src = src;
    overlayImg.style.display = 'block';
  };
  img.onerror = () => {
    overlayImg.style.display = 'none';
    const p = document.createElement('div');
    p.className = 'photo-placeholder';
    p.innerHTML = `<div style="font-size:40px">${isl.emoji}</div><div>${isl.label}</div>`;
    document.getElementById('overlay-inner').insertBefore(p, document.getElementById('overlay-caption-wrap'));
  };
  img.src = src;
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlayImg.src = '';
  const ph = overlay.querySelector('.photo-placeholder');
  if (ph) ph.remove();
}

function photoNext() {
  if (isAnimating) return;
  const idx = currentIsland;
  hideOverlay();
  if (idx === ISLANDS.length - 1) {
    setTimeout(showLetter, 350);
    return;
  }
  // Brief pause so the overlay-fade has begun, then sail.
  setTimeout(() => navigateTo(idx + 1, true), 180);
}

function photoBackFn() {
  if (isAnimating) return;
  const idx = currentIsland;
  if (idx === 0) return;
  hideOverlay();
  setTimeout(() => navigateTo(idx - 1, true), 180);
}

if (photoNextEl) photoNextEl.addEventListener('click', photoNext);
if (photoBack)   photoBack.addEventListener('click',   photoBackFn);

// ── Letter Overlay ───────────────────────────────────────────
function showLetter() {
  letterOverlay.classList.remove('hidden');
  const lines = letterOverlay.querySelectorAll('.letter-line');
  lines.forEach((el, i) => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = `letterLineIn 0.9s cubic-bezier(0.22,1,0.36,1) ${0.25 + i * 0.13}s forwards`;
  });
}
function hideLetter() { letterOverlay.classList.add('hidden'); }

// ── Restart ─────────────────────────────────────────────────
function restartJourney() {
  hideLetter();
  hideOverlay();
  clearAllStates();
  lastOpenedIdx = -1;

  const fromIdx = currentIsland;
  counterCur.textContent = '1';

  if (fromIdx === 0) {
    highlightIsland(0);
    centerViewOn(POSITIONS[0].x, POSITIONS[0].y, true);
    setTimeout(() => openOverlay(0), 500);
    return;
  }

  isAnimating = true;
  currentIsland = 0;
  // Sail directly back as one continuous swoop (chain segment animations quickly)
  let stepI = 0;
  const seq = [];
  for (let i = fromIdx; i > 0; i--) seq.push([i, i - 1]);

  function doStep() {
    if (stepI >= seq.length) {
      highlightIsland(0);
      isAnimating = false;
      setTimeout(() => openOverlay(0), 350);
      return;
    }
    const [a, b] = seq[stepI];
    animateBoatAlongPath(a, b, () => {
      stepI++;
      doStep();
    }, 380); // quick reset
  }
  doStep();
}

if (btnRestart) btnRestart.addEventListener('click', restartJourney);

// ── Map nav arrows (kept as redundant control during sailing) ──
btnNext.addEventListener('click', goNext);
btnPrev.addEventListener('click', goPrev);

// Keyboard nav
document.addEventListener('keydown', e => {
  if (!letterOverlay.classList.contains('hidden')) {
    if (e.key === 'Escape' || e.key === 'Enter') restartJourney();
    return;
  }
  if (!overlay.classList.contains('hidden')) {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); photoNext(); }
    if (e.key === 'ArrowLeft') photoBackFn();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
});

// ── Splash → Map reveal ───────────────────────────────────────
function revealMap() {
  if (mapRevealed) return;
  mapRevealed = true;
  appEl.classList.remove('hidden');
  initViewport();
  renderDeco();
  renderMapBackground();
  renderIslands();
  buildPathSegments();

  setBoatPosition(POSITIONS[0]);
  centerViewOn(POSITIONS[0].x, POSITIONS[0].y, false);
  highlightIsland(0);
}

function showSoundToggle() {
  if (!btnSound) return;
  btnSound.classList.remove('hidden');
  syncSoundIcon();
  if (soundTip) {
    soundTip.classList.add('visible');
    setTimeout(() => soundTip.classList.remove('visible'), 2200);
  }
}

function dismissSplash(withMusic) {
  if (withMusic) startMusic();
  splash.classList.add('splash-leaving');
  setTimeout(() => {
    splash.classList.add('hidden');
    revealMap();
    showSoundToggle();
    // Brief beat so user gets a glimpse of the map before photo 1 appears
    setTimeout(() => openOverlay(0), 850);
  }, 650);
}

if (btnMusic)  btnMusic.addEventListener('click',  () => dismissSplash(true));
if (btnSilent) btnSilent.addEventListener('click', () => dismissSplash(false));

window.addEventListener('resize', () => {
  if (!mapRevealed) return;
  initViewport();
  centerViewOn(POSITIONS[currentIsland].x, POSITIONS[currentIsland].y, false);
});
