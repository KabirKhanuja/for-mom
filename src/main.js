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
  { id: 17, label: "Home Harbour",          emoji: "🏠", caption: "No matter where I go, you are always where home is.",          special: false         },
];

// ── Map layout: 900×1400 world coords ──────────────────────
const POSITIONS = [
  { x: 180, y: 1280 },  // 1 start (bottom-ish)
  { x: 340, y: 1170 },  // 2
  { x: 200, y: 1050 },  // 3
  { x: 380, y: 950  },  // 4
  { x: 560, y: 860  },  // 5
  { x: 390, y: 750  },  // 6
  { x: 200, y: 660  },  // 7
  { x: 350, y: 560  },  // 8
  { x: 560, y: 480  },  // 9
  { x: 700, y: 380  },  // 10
  { x: 560, y: 280  },  // 11
  { x: 380, y: 200  },  // 12
  { x: 220, y: 290  },  // 13
  { x: 130, y: 420  },  // 14
  { x: 260, y: 520  }, // 15  (near 7 area, off path)
  { x: 700, y: 580  },  // 16
  { x: 700, y: 200  },  // 17 end (top)
];

// Build smooth path through all points
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
let currentIsland = 0;  // 0-indexed
let isAnimating = false;

// ── DOM refs ────────────────────────────────────────────────
const appEl       = document.getElementById('app');
const titleCard   = document.getElementById('title-card');
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
const overlayClose= document.getElementById('overlay-close');

// ── Decorative SVG (compass, waves, clouds) ─────────────────
function renderDeco() {
  decoSVG.innerHTML = `
    <!-- Compass rose (bottom-right) -->
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
    <!-- Decorative title text -->
    <text x="50%" y="28" text-anchor="middle" font-family="Cormorant Garamond,serif" font-style="italic" font-size="15" fill="#8B6340" opacity="0.55" letter-spacing="3">A Map of Memories</text>
  `;
}

// ── Wave SVG in map background ───────────────────────────────
function renderMapBackground() {
  const ns = 'http://www.w3.org/2000/svg';
  // Defs
  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `
    <filter id="paper" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="islandBlur">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
    <radialGradient id="islandGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C8903A" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#C8903A" stop-opacity="0"/>
    </radialGradient>
  `;
  mapSVG.appendChild(defs);

  // Ocean background — large enough to cover beyond 900×1400
  const ocean = document.createElementNS(ns, 'rect');
  ocean.setAttribute('x', '-2000');
  ocean.setAttribute('y', '-2000');
  ocean.setAttribute('width', '5000');
  ocean.setAttribute('height', '5000');
  ocean.setAttribute('fill', '#FDF4E0');
  mapSVG.appendChild(ocean);

  // Subtle wave lines
  const waveGroup = document.createElementNS(ns, 'g');
  waveGroup.setAttribute('opacity', '0.12');
  waveGroup.setAttribute('stroke', '#C8903A');
  waveGroup.setAttribute('stroke-width', '0.8');
  waveGroup.setAttribute('fill', 'none');
  for (let y = 80; y < 1400; y += 55) {
    const p = document.createElementNS(ns, 'path');
    let d = `M 0 ${y}`;
    for (let x = 0; x <= 900; x += 60) {
      d += ` q 15,-8 30,0 q 15,8 30,0`;
    }
    p.setAttribute('d', d);
    waveGroup.appendChild(p);
  }
  mapSVG.appendChild(waveGroup);

  // Small decorative clouds
  [[100,100],[700,150],[820,500],[80,700],[750,900],[200,1100]].forEach(([cx,cy]) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('opacity', '0.18');
    [0,18,-14,22,-8].forEach((ox,i) => {
      const c = document.createElementNS(ns, 'ellipse');
      c.setAttribute('cx', cx + ox);
      c.setAttribute('cy', cy + (i%2===0 ? 0 : -7));
      c.setAttribute('rx', 12 + i*2);
      c.setAttribute('ry', 8);
      c.setAttribute('fill', '#C8903A');
      g.appendChild(c);
    });
    mapSVG.appendChild(g);
  });
}

// ── Island SVG ───────────────────────────────────────────────
function renderIslands() {
  const ns = 'http://www.w3.org/2000/svg';

  // Path first (behind islands)
  const pathD = buildPath(POSITIONS);
  const pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', pathD);
  pathEl.setAttribute('fill', 'none');
  pathEl.setAttribute('stroke', '#8B6340');
  pathEl.setAttribute('stroke-width', '2.5');
  pathEl.setAttribute('stroke-dasharray', '8 10');
  pathEl.setAttribute('stroke-linecap', 'round');
  pathEl.setAttribute('opacity', '0.65');
  mapSVG.appendChild(pathEl);

  // Subtle direction arrows along path
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

  // Islands
  ISLANDS.forEach((isl, i) => {
    const {x, y} = POSITIONS[i];
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'island-group');
    g.setAttribute('id', `island-${i}`);
    g.setAttribute('data-index', i);
    g.setAttribute('transform', `translate(${x},${y})`);
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', isl.label);

    const isSpecial = isl.special;
    const r = isSpecial ? 28 : 22;

    // Glow aura
    const glow = document.createElementNS(ns, 'circle');
    glow.setAttribute('cx', '0'); glow.setAttribute('cy', '0');
    glow.setAttribute('r', r + 14);
    glow.setAttribute('fill', 'url(#islandGrad)');
    glow.setAttribute('class', 'island-glow');
    g.appendChild(glow);

    // Land mass — irregular blob via path
    const blobPath = islandBlob(r);
    const blob = document.createElementNS(ns, 'path');
    blob.setAttribute('d', blobPath);
    blob.setAttribute('fill', isSpecial ? '#C8903A' : '#D4A56A');
    blob.setAttribute('stroke', '#8B6340');
    blob.setAttribute('stroke-width', '1.8');
    blob.setAttribute('class', 'island-body');
    g.appendChild(blob);

    // Inner texture
    const inner = document.createElementNS(ns, 'path');
    inner.setAttribute('d', islandBlob(r * 0.55));
    inner.setAttribute('fill', isSpecial ? '#E8B86D' : '#E8C98A');
    inner.setAttribute('opacity', '0.6');
    g.appendChild(inner);

    // Idle pulse ring
    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('cx', '0'); ring.setAttribute('cy', '0');
    ring.setAttribute('r', isSpecial ? '10' : '8');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#C8903A');
    ring.setAttribute('stroke-width', isSpecial ? '2.5' : '1.8');
    ring.setAttribute('class', 'island-pulse island-ring');
    g.appendChild(ring);

    // Emoji label
    const emojiT = document.createElementNS(ns, 'text');
    emojiT.setAttribute('x', '0'); emojiT.setAttribute('y', '5');
    emojiT.setAttribute('text-anchor', 'middle');
    emojiT.setAttribute('font-size', isSpecial ? '20' : '15');
    emojiT.textContent = isl.emoji;
    g.appendChild(emojiT);

    // Name label below
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', r + 16);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Cormorant Garamond, serif');
    label.setAttribute('font-style', 'italic');
    label.setAttribute('font-size', isSpecial ? '12' : '10');
    label.setAttribute('fill', '#3E2A14');
    label.setAttribute('opacity', '0.85');
    label.textContent = isl.label;
    g.appendChild(label);

    // Number badge
    const numBg = document.createElementNS(ns, 'circle');
    numBg.setAttribute('cx', r - 2); numBg.setAttribute('cy', -(r - 2));
    numBg.setAttribute('r', '8');
    numBg.setAttribute('fill', '#3E2A14');
    g.appendChild(numBg);
    const numT = document.createElementNS(ns, 'text');
    numT.setAttribute('x', r - 2); numT.setAttribute('y', -(r - 6));
    numT.setAttribute('text-anchor', 'middle');
    numT.setAttribute('font-family', 'Lato, sans-serif');
    numT.setAttribute('font-size', '8');
    numT.setAttribute('fill', '#FDF6EC');
    numT.textContent = isl.id;
    g.appendChild(numT);

    mapSVG.appendChild(g);

    // Click / tap
    g.addEventListener('click', () => navigateTo(i));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') navigateTo(i); });
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
  // Flip based on direction
  boatSVG.style.transform = angle > 90 || angle < -90 ? 'scaleX(-1)' : 'scaleX(1)';
}

// Interpolate along the path between two island positions
function animateBoatTo(fromIdx, toIdx, onDone) {
  const from = POSITIONS[fromIdx];
  const to   = POSITIONS[toIdx];
  const dur  = 900; // ms
  const start = performance.now();

  // Build intermediate waypoints using the cubic bezier
  const totalPts = buildPathSegments();

  function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease-in-out

    // Simple lerp for now; upgrade to path-following later
    const x = from.x + (to.x - from.x) * ease;
    const y = from.y + (to.y - from.y) * ease;
    const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;

    setBoatPosition({ x, y }, angle);
    centerViewOn(x, y, false);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      setBoatPosition(to, 0);
      centerViewOn(to.x, to.y, true);
      onDone && onDone();
    }
  }
  requestAnimationFrame(tick);
}
function buildPathSegments() { return POSITIONS; }

// ── Viewport centering ───────────────────────────────────────
let currentScale = 1;
let currentTranslate = { x: 0, y: 0 };

function computeScale() {
  // Fill at least the viewport width so the map looks full-bleed
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Fit to the narrower of: width-based or height-based
  // but ensure it's at least viewport-width-filling
  const byWidth  = vw / 900;
  const byHeight = vh / 1400;
  // Use larger of the two so one dimension always fills
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
  // With transform-origin:0,0 and transform:scale(s):
  // screen_x of world point = left + world_x * s
  // To center (wx,wy): left + wx*s = vw/2  =>  left = vw/2 - wx*s
  const left = vw / 2 - wx * currentScale;
  const top  = vh / 2 - wy * currentScale;
  currentTranslate = { x: left, y: top };

  if (smooth) {
    mapWorld.style.transition = 'left 0.7s cubic-bezier(0.22,1,0.36,1), top 0.7s cubic-bezier(0.22,1,0.36,1)';
  } else {
    mapWorld.style.transition = 'none';
  }
  mapWorld.style.left = left + 'px';
  mapWorld.style.top  = top  + 'px';
  mapWorld.style.transform = `scale(${currentScale})`;
}

// ── Arrived highlight ────────────────────────────────────────
function highlightIsland(idx) {
  // Remove previous
  document.querySelectorAll('.island-arrived').forEach(el => el.classList.remove('island-arrived'));
  const g = document.getElementById(`island-${idx}`);
  if (g) g.classList.add('island-arrived');
}

// ── Navigation ───────────────────────────────────────────────
function navigateTo(idx, openPhoto = false) {
  if (isAnimating) return;
  if (idx < 0 || idx >= ISLANDS.length) return;

  isAnimating = true;
  const prevIdx = currentIsland;
  currentIsland = idx;
  counterCur.textContent = idx + 1;

  // If same island, just open photo
  if (prevIdx === idx) {
    isAnimating = false;
    openOverlay(idx);
    return;
  }

  // Animate step by step if jumping multiple
  let steps = [prevIdx];
  if (Math.abs(idx - prevIdx) > 1) {
    const dir = idx > prevIdx ? 1 : -1;
    for (let i = prevIdx + dir; i !== idx; i += dir) steps.push(i);
  }
  steps.push(idx);

  let stepI = 0;
  function doStep() {
    if (stepI >= steps.length - 1) {
      highlightIsland(idx);
      isAnimating = false;
      if (openPhoto) openOverlay(idx);
      return;
    }
    animateBoatTo(steps[stepI], steps[stepI+1], () => {
      stepI++;
      // small pause at intermediate islands
      setTimeout(doStep, stepI === steps.length - 2 ? 0 : 80);
    });
  }
  doStep();
}

function goNext() {
  if (currentIsland < ISLANDS.length - 1) navigateTo(currentIsland + 1);
}
function goPrev() {
  if (currentIsland > 0) navigateTo(currentIsland - 1);
}

// ── Photo Overlay ────────────────────────────────────────────
function openOverlay(idx) {
  const isl = ISLANDS[idx];
  const src = `/photos/photo-${String(idx+1).padStart(2,'0')}.jpg`;

  overlayCap.textContent  = isl.caption;
  overlayName.textContent = isl.label;
  overlay.classList.remove('hidden');

  const img = new Image();
  img.onload = () => {
    overlayImg.src = src;
    overlayImg.style.display = 'block';
    // remove any placeholder
    const ph = overlay.querySelector('.photo-placeholder');
    if (ph) ph.remove();
  };
  img.onerror = () => {
    overlayImg.style.display = 'none';
    // Show placeholder
    let ph = overlay.querySelector('.photo-placeholder');
    if (!ph) {
      ph = document.createElement('div');
      ph.className = 'photo-placeholder';
      ph.innerHTML = `<div style="font-size:40px">${isl.emoji}</div><div>${isl.label}</div><div style="font-size:13px;opacity:0.6">photo-${String(idx+1).padStart(2,'0')}.jpg</div>`;
      document.getElementById('overlay-inner').insertBefore(ph, overlayCap.parentNode);
    }
  };
  img.src = src;
}

function closeOverlay() {
  overlay.classList.add('hidden');
  overlayImg.src = '';
  const ph = overlay.querySelector('.photo-placeholder');
  if (ph) ph.remove();
}

// ── Touch / pan support ──────────────────────────────────────
let panStart = null;
let panOrigin = { x: 0, y: 0 };

mapViewport.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panOrigin = { ...currentTranslate };
  }
}, { passive: true });

mapViewport.addEventListener('touchmove', e => {
  if (!panStart || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - panStart.x;
  const dy = e.touches[0].clientY - panStart.y;
  const nx = panOrigin.x + dx;
  const ny = panOrigin.y + dy;
  mapWorld.style.transition = 'none';
  mapWorld.style.left = nx + 'px';
  mapWorld.style.top  = ny + 'px';
}, { passive: true });

mapViewport.addEventListener('touchend', e => {
  if (!panStart || e.changedTouches.length !== 1) return;
  const dx = e.changedTouches[0].clientX - panStart.x;
  const dy = e.changedTouches[0].clientY - panStart.y;
  currentTranslate.x = panOrigin.x + dx;
  currentTranslate.y = panOrigin.y + dy;
  panStart = null;
});

// ── Event wiring ─────────────────────────────────────────────
btnNext.addEventListener('click', goNext);
btnPrev.addEventListener('click', goPrev);

document.addEventListener('keydown', e => {
  if (overlay.classList.contains('hidden')) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
  } else {
    if (e.key === 'Escape') closeOverlay();
  }
});

overlayClose.addEventListener('click', closeOverlay);
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeOverlay();
});

// Tap island to open photo (if already on that island)
document.addEventListener('click', e => {
  const g = e.target.closest('.island-group');
  if (!g) return;
  const idx = parseInt(g.dataset.index);
  if (idx === currentIsland && !isAnimating) {
    openOverlay(idx);
  }
});

// ── Title card → map reveal ───────────────────────────────────
let mapRevealed = false;
function revealMap() {
  if (mapRevealed) return;
  mapRevealed = true;
  appEl.classList.remove('hidden');
  initViewport();
  renderDeco();
  renderMapBackground();
  renderIslands();

  // Place boat at island 1
  setBoatPosition(POSITIONS[0]);
  centerViewOn(POSITIONS[0].x, POSITIONS[0].y, false);
  highlightIsland(0);
}

// Wait for title card to finish
setTimeout(revealMap, 3400);

// Also allow clicking to skip
titleCard.addEventListener('click', () => {
  titleCard.style.animation = 'none';
  titleCard.style.opacity = '0';
  titleCard.style.pointerEvents = 'none';
  revealMap();
});

window.addEventListener('resize', () => {
  initViewport();
  centerViewOn(POSITIONS[currentIsland].x, POSITIONS[currentIsland].y, false);
});
