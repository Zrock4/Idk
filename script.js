// F1 Aerodynamics – Interactive 3D Presentation
// Matches elements defined in index.html and styles in index.css

// ---------------------- DOM ----------------------
const canvas3d = document.getElementById('canvas3d');
const particlesCanvas = document.getElementById('particlesCanvas');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const panelTitle = document.getElementById('panelTitle');
const panelText = document.getElementById('panelText');
const progressFill = document.getElementById('progressFill');

const statsContainer = document.getElementById('statsContainer');
const stat1El = document.getElementById('stat1'); // Downforce
const stat2El = document.getElementById('stat2'); // Speed
const stat3El = document.getElementById('stat3'); // Cd

const navDots = Array.from(document.querySelectorAll('#navDots .dot'));

// ---------------------- Slides ----------------------
const slides = [
  {
    title: 'Welcome',
    text: 'Loading presentation... Use Start to begin. Navigate with dots or arrow keys.',
    stats: { downforce: 0, speed: 0, cd: 0.00 },
  },
  {
    title: 'Ground Effect',
    text: 'Venturi tunnels accelerate airflow beneath the floor, creating low pressure and strong downforce with reduced drag.',
    stats: { downforce: 1200, speed: 280, cd: 0.85 },
  },
  {
    title: 'Front Wing',
    text: 'The front wing manages airflow around the tyres and feeds the floor. Adjustments balance downforce vs. drag.',
    stats: { downforce: 800, speed: 300, cd: 0.92 },
  },
  {
    title: 'Rear Wing',
    text: 'Provides stability and a large share of total downforce. Endplates and beam wing influence vortex structures.',
    stats: { downforce: 1000, speed: 290, cd: 1.05 },
  },
  {
    title: 'DRS',
    text: 'Drag Reduction System opens the rear flap to lower drag and boost top speed, aiding overtaking on straights.',
    stats: { downforce: 700, speed: 330, cd: 0.75 },
  },
];

let currentSlide = 0;
let autoAdvance = false;
const slideDuration = 7000; // ms
let slideTimeout = null;
let progressRAF = null;
let progressStart = 0;

let statValues = { downforce: 0, speed: 0, cd: 0 };

// ---------------------- Helpers ----------------------
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function formatNumber(val, unit) {
  if (unit === 'cd') return val.toFixed(2);
  if (unit === 'speed') return Math.round(val).toString();
  if (unit === 'downforce') return Math.round(val).toString();
  return String(val);
}

function setActiveDot(index) {
  navDots.forEach((d, i) => d.classList.toggle('active', i === index));
}

function animateStats(to) {
  const from = { ...statValues };
  const duration = 1000;
  const start = performance.now();
  function tick(now) {
    const t = clamp01((now - start) / duration);
    statValues.downforce = lerp(from.downforce, to.downforce, t);
    statValues.speed = lerp(from.speed, to.speed, t);
    statValues.cd = lerp(from.cd, to.cd, t);

    stat1El.textContent = formatNumber(statValues.downforce, 'downforce');
    stat2El.textContent = formatNumber(statValues.speed, 'speed');
    stat3El.textContent = formatNumber(statValues.cd, 'cd');

    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function clearTimers() {
  if (slideTimeout) {
    clearTimeout(slideTimeout);
    slideTimeout = null;
  }
  if (progressRAF) {
    cancelAnimationFrame(progressRAF);
    progressRAF = null;
  }
}

function startProgressBar() {
  progressStart = performance.now();
  function step(now) {
    const t = clamp01((now - progressStart) / slideDuration);
    progressFill.style.width = `${(t * 100).toFixed(1)}%`;
    if (t < 1 && autoAdvance) {
      progressRAF = requestAnimationFrame(step);
    }
  }
  progressRAF = requestAnimationFrame(step);
}

function scheduleNext() {
  clearTimers();
  if (!autoAdvance) return;
  startProgressBar();
  slideTimeout = setTimeout(() => {
    goToSlide((currentSlide + 1) % slides.length, 1);
  }, slideDuration);
}

function goToSlide(index, direction = 1) {
  currentSlide = index;
  const slide = slides[index];

  // Title & text
  panelTitle.textContent = slide.title.toUpperCase();
  panelText.textContent = slide.text;

  // Animate info panel entry
  const panel = document.getElementById('infoPanel');
  panel.classList.remove('slide-in-left', 'slide-in-right', 'fade-in-up');
  void panel.offsetWidth; // reflow
  panel.classList.add(direction >= 0 ? 'slide-in-right' : 'slide-in-left');

  // Stats visibility & animation
  if (index === 0) {
    statsContainer.classList.remove('visible');
  } else {
    statsContainer.classList.add('visible');
    animateStats(slide.stats);
  }

  setActiveDot(index);
  updateCarForSlide(index);
  scheduleNext();
}

function startPresentation() {
  if (!autoAdvance) {
    autoAdvance = true;
    // If on welcome, jump to first content slide after brief moment
    if (currentSlide === 0) {
      goToSlide(1, 1);
    } else {
      scheduleNext();
    }
  } else {
    // Manual advance when already running
    goToSlide((currentSlide + 1) % slides.length, 1);
  }
}

function restartPresentation() {
  autoAdvance = false;
  clearTimers();
  progressFill.style.width = '0%';
  statValues = { downforce: 0, speed: 0, cd: 0 };
  stat1El.textContent = '0';
  stat2El.textContent = '0';
  stat3El.textContent = '0';
  statsContainer.classList.remove('visible');
  goToSlide(0, -1);
}

// ---------------------- Events ----------------------
startBtn.addEventListener('click', startPresentation);
restartBtn.addEventListener('click', restartPresentation);

navDots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    autoAdvance = true; // continue auto after manual nav
    goToSlide(i, i > currentSlide ? 1 : -1);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowRight') {
    autoAdvance = true;
    goToSlide((currentSlide + 1) % slides.length, 1);
  } else if (e.code === 'ArrowLeft') {
    autoAdvance = true;
    goToSlide((currentSlide - 1 + slides.length) % slides.length, -1);
  }
});

window.addEventListener('beforeunload', clearTimers);

// ---------------------- Three.js Scene ----------------------
let renderer, scene, camera, car, clock;

function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(3.2, 1.4, 4.8);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const dir = new THREE.DirectionalLight(0xff5555, 1.2);
  dir.position.set(5, 6, 3);
  scene.add(ambient, dir);

  // Simple placeholder F1 car using boxes
  car = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xff1111, metalness: 0.5, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.8), red);
  body.position.y = 0.3;
  car.add(body);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.4), red);
  nose.position.set(1.65, 0.25, 0);
  car.add(nose);

  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.4), dark);
  frontWing.position.set(1.9, 0.15, 0);
  car.add(frontWing);

  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 1.0), dark);
  rearWing.position.set(-1.7, 0.7, 0);
  car.add(rearWing);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), dark);
  beam.position.set(-1.7, 0.4, 0);
  car.add(beam);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 1.6), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.2, roughness: 0.95 }));
  floor.position.set(0, 0.12, 0);
  car.add(floor);

  car.rotation.y = -0.4;
  scene.add(car);

  // Subtle ground grid
  const grid = new THREE.GridHelper(20, 20, 0x551111, 0x220000);
  grid.position.y = 0;
  grid.material.opacity = 0.15;
  grid.material.transparent = true;
  scene.add(grid);

  clock = new THREE.Clock();

  window.addEventListener('resize', onResize);
  onResize();
  animate();
}

let targetWingOpen = 0; // 0 closed, 1 open (DRS)

function updateCarForSlide(index) {
  // Slight camera/car changes per topic
  if (index === 2) { // Front Wing
    gsnapRotation(-0.2);
  } else if (index === 3) { // Rear Wing
    gsnapRotation(-0.8);
  } else {
    gsnapRotation(-0.4);
  }
  // DRS visual: open rear wing on slide 4
  targetWingOpen = (index === 4) ? 1 : 0;
}

function gsnapRotation(y) {
  // Smoothly move car rotation target
  car.userData.targetY = y;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (car) {
    const t = clamp01(6 * dt);
    car.rotation.y = lerp(car.rotation.y, car.userData.targetY ?? -0.4, t);
    // gentle idle motion
    car.rotation.x = Math.sin(performance.now() * 0.001) * 0.03;

    // Simulate DRS by moving rear wing piece
    const rw = car.children.find(m => m.geometry && m.geometry.parameters && m.geometry.parameters.width === 1.1);
    if (rw) {
      rw.position.y = lerp(rw.position.y, 0.7 + targetWingOpen * 0.25, 5 * dt);
    }
  }
  renderer.render(scene, camera);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // resize particles canvas
  particlesCanvas.width = w;
  particlesCanvas.height = h;
}

// ---------------------- Airflow Particles (2D) ----------------------
const pctx = particlesCanvas.getContext('2d');
const particles = [];
const PCOUNT = 150;

function rand(min, max) { return Math.random() * (max - min) + min; }

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PCOUNT; i++) {
    particles.push({
      x: rand(-window.innerWidth * 0.2, window.innerWidth),
      y: rand(0, window.innerHeight),
      vx: rand(60, 160),
      size: rand(1, 3),
      alpha: rand(0.2, 0.8),
    });
  }
}

function drawParticles(ts) {
  pctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
  pctx.globalCompositeOperation = 'lighter';

  const dt = 1 / 60; // approx
  for (const p of particles) {
    p.x += p.vx * dt;
    // mild sine flow
    p.y += Math.sin((p.x + ts * 0.1) * 0.01) * 0.6;
    if (p.x > particlesCanvas.width + 40) {
      p.x = -40;
      p.y = rand(0, particlesCanvas.height);
    }

    const g = pctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
    g.addColorStop(0, `rgba(255,0,0,${p.alpha})`);
    g.addColorStop(1, 'rgba(255,0,0,0)');
    pctx.fillStyle = g;
    pctx.beginPath();
    pctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
    pctx.fill();
  }

  requestAnimationFrame(drawParticles);
}

// ---------------------- Boot ----------------------
(function boot() {
  try {
    initThree();
    initParticles();
    requestAnimationFrame(drawParticles);
    // Initial state
    goToSlide(0, 1);
    console.log('F1 Aerodynamics presentation ready. Click START to begin.');
  } catch (e) {
    console.error('Initialization error:', e);
  }
})();
