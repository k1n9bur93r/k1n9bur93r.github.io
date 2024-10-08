// Starry Background Animation Code
// Created By 'Merve'
// Lifted From https://codepen.io/mervedurdagi/pen/PWzmZR
var n_stars = 150;
var n_stars = 150;
const colors = ['#ba2356', '#fb9b39'];
for (let i = 0; i < 3; i++) {
  colors.push('#fff');
}

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
let canvasRect = canvas.getBoundingClientRect();
function resizeCanvas() {
  const dpi = window.devicePixelRatio;
  canvasRect = canvas.getBoundingClientRect();
  canvas.width = canvasRect.width * dpi;
  canvas.height = canvasRect.height * dpi;
  c.restore();
  c.scale(dpi, dpi);
}
resizeCanvas();

addEventListener('resize', () => {
  resizeCanvas();
  stars = [];
  simInit();
});

canvas.style.background = '#000';

const randomInt = (max, min) => Math.floor(Math.random() * (max - min) + min);

const bg = c.createRadialGradient(canvasRect.width / 2, canvasRect.height * 2, canvasRect.height, canvasRect.width / 2, canvasRect.height, canvasRect.height * 4);
bg.addColorStop(0, '#300d82');
bg.addColorStop(0.4, '#000814');
bg.addColorStop(0.8, '#000814');
bg.addColorStop(1, '#000');

class Star {
  constructor(x, y, radius, color, dy = -Math.random() * 0.3, dx = 0, velocityStar = false) {
    if (dx != 0) {
      dx -= Math.random();
    }

    this.x = x || randomInt(0, canvasRect.width);
    this.y = y || randomInt(0, canvasRect.height);
    this.radius = radius || Math.random() * 1.1;
    this.color = color || colors[randomInt(0, colors.length)];
    this.dy = dy;
    this.dx = dx;
    this.VelocityStar = velocityStar;
    this.opacity = 0.5;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    c.shadowBlur = randomInt(3, 15);
    c.shadowColor = this.color;
    c.strokeStyle = this.color;
    c.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    c.fill();
    c.stroke();
    c.closePath();
  }

  update(arrayStars = []) {
    if (this.y - this.radius < 0) {
      this.createNewStar(arrayStars);
    }
    this.y += this.dy;
    this.x += this.dx;
    if (this.dy <= 0.01 || this.dx <= 0.01) {
      this.opacity -= 0.01;
    }
    if ((this.x > canvas.width || this.y > canvas.height || this.x < 0 || this.y < 0 || this.opacity <= 0) && this.VelocityStar) {
      this.deleteStar(arrayStars);
    } else {
      this.draw();
    }
  }

  deleteStar(arrayStars = []) {
    const i = arrayStars.indexOf(this);
    arrayStars.splice(i, 1);
  }

  createNewStar(arrayStars = []) {
    const i = arrayStars.indexOf(this);
    arrayStars.splice(i, 1);
    arrayStars.push(new Star(false, canvasRect.height + 5, undefined, undefined, this.dy));
  }
}

var stars = [];
const velocityStars = [];
function simInit() {
  for (let i = 0; i < n_stars; i++) {
    stars.push(new Star());
  }
}
init();

document.addEventListener('click', (e) => {
  const x = e.clientX;
  const y = e.clientY;
  const numBurstStars = 5;
  for (let i = 0; i < numBurstStars; i++) {
    MakeVelocityStar(x, y);
  }
});

document.addEventListener('pointermove', (() => {
  let mouseMoveCounter = 0;

  return (e) => {
    mouseMoveCounter++;
    if (mouseMoveCounter >= 10) {
      MakeVelocityStar(e.clientX, e.clientY);
      mouseMoveCounter = 0;
    }
  };
})());

function MakeVelocityStar(x, y) {
  const starPosFromCords = 5;
  const angle = Math.random() * 2 * Math.PI;
  const randDistfromCord = Math.random() * starPosFromCords;
  const dx = Math.cos(angle) * randDistfromCord;
  const dy = Math.sin(angle) * randDistfromCord;

  velocityStars.push(new Star(x, y, Math.random() * 4 + 1, undefined, dx, dy, true));
}

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, canvasRect.width, canvasRect.height);
  c.fillStyle = bg;
  c.fillRect(0, 0, canvasRect.width, canvasRect.height);
  stars.forEach((s) => s.update(stars));
  velocityStars.forEach((s) => s.update(velocityStars));
}

export function init() {
  simInit();
  animate();
}
