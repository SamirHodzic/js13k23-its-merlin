import {
  IVY,
  JAW,
  KNIGHT,
  MAGE,
  PUMPKIN,
  SKELET,
  TILES,
  HEADER,
  CROSSHAIR,
  BOSS1,
  BOSS2,
  BOSS3,
  WAVES,
  ENEMIES,
  POWERUPS,
  POWERUP_LIST,
  MAP,
  LOGO,
  MUSIC
} from './constants';
import Tileset from './tileset';
import Particle from './particle';
import Player from './player';
import './zzfx';
import './zzfxm.min.js';

var curtainEl = document.getElementById('w');
var canvas = document.getElementById('2');
canvas.width = 480;
canvas.height = 640;
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.textBaseline = 'alphabetic';

var headerCanvas = document.getElementById('1');
headerCanvas.width = 480;
headerCanvas.height = 128;
var hctx = headerCanvas.getContext('2d');
hctx.imageSmoothingEnabled = false;
hctx.textBaseline = 'alphabetic';

var highScore = localStorage.getItem('ms') || 1;
const player = new Player(canvas.width / 2, canvas.height / 2);
const crosshairSprite = new Tileset(CROSSHAIR).i;
const skeletSprite = new Tileset(SKELET).i;
const mageSprite = new Tileset(MAGE).i;
const jawSprite = new Tileset(JAW).i;
const pumpkinSprite = new Tileset(PUMPKIN).i;
const knightSprite = new Tileset(KNIGHT).i;
const ivySprite = new Tileset(IVY).i;
const boss1Sprite = new Tileset(BOSS1).i;
const boss2Sprite = new Tileset(BOSS2).i;
const boss3Sprite = new Tileset(BOSS3).i;
const powerupsSprite = new Tileset(POWERUPS).i;
const logoSprite = new Tileset(LOGO).i;
const tiles = new Tileset(TILES).i;
const enemySprites = {
  s: skeletSprite,
  m: mageSprite,
  j: jawSprite,
  p: pumpkinSprite,
  k: knightSprite,
  i: ivySprite,
  b1: boss1Sprite,
  b2: boss2Sprite,
  b3: boss3Sprite
};
const baseGrid = MAP[0];
const detailsGrid = MAP[1];
const collisionGrid = MAP[2];

let enemyInterval;
let isMouseDown;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let waveClear = false;
let powerupMenu = false;
let enableClick = false;
let isGameOver = true;
let cycle = false;
let curtain = false;
let music = null;
let buffer = zzfxM(...MUSIC);
let soundEnabled = true;
let soundActive = false;
let wave = {
  n: 0,
  e: []
};

let boss = null;
let powers = [];
const bullets = [];
const enemies = [];
const enemyBullets = [];
const particles = [];

let currentAnimationFrame = 0;
let animationFrameCount = 4;
let animationFrameDelay = 6;

function drawMap() {
  for (var i = 0; i < baseGrid.length; i++) {
    const assetX = (baseGrid[i] - 1) % 47;
    const posX = (i % 15) * 32;
    const posY = Math.floor(i / 15) * 32;

    ctx.drawImage(tiles, assetX * 16, 0, 16, 16, posX, posY, 32, 32);
  }

  for (var i = 0; i < detailsGrid.length; i++) {
    const assetX = (detailsGrid[i] - 1) % 47;
    const posX = (i % 15) * 32;
    const posY = Math.floor(i / 15) * 32;

    ctx.drawImage(tiles, assetX * 16, 0, 16, 16, posX, posY, 32, 32);
  }
}

function drawHeader() {
  for (var i = 0; i < HEADER.length; i++) {
    const assetX = (HEADER[i] - 1) % 47;
    const posX = (i % 15) * 32;
    const posY = Math.floor(i / 15) * 32;

    hctx.drawImage(tiles, assetX * 16, 0, 16, 16, posX - 1, posY - 1, 32, 32);
  }

  if (isGameOver) {
    hctx.fillStyle = 'white';
    hctx.font = '18px Arial';
    hctx.fillText('BEST WAVE', 185, 45);
    const s = `${highScore}`;
    hctx.fillText(s, 232 - (s.length - 1) * 5, 70);
    return;
  }

  hctx.fillStyle = '#fff';
  hctx.font = '18px Arial';
  hctx.fillText(
    `HP   ${
      player.hp > 999
        ? Math.round((player.hp / 1000) * 10) / 10 + 'K'
        : Math.round(player.hp > 0 ? player.hp : 0)
    } / ${
      player.mhp > 999
        ? Math.round((player.mhp / 1000) * 10) / 10 + 'K'
        : player.mhp
    }`,
    48,
    45
  );

  const hW = (player.hp / player.mhp) * 110;
  hctx.strokeStyle = '#96A9C1';
  hctx.strokeRect(50, 54, 112, 22);
  hctx.fillStyle = '#4ba747';
  hctx.fillRect(51, 55, hW, 20);
  hctx.fillStyle = '#3d734f';
  hctx.fillRect(54, 69, hW > 0 && hW >= 5 ? hW - 5 : 0, 4);

  hctx.fillStyle = 'white';
  hctx.font = '18px Arial';
  hctx.fillText('WAVE', 380, 45);
  const s = `${wave.n + 1}`;
  hctx.fillText(s, 402 - (s.length - 1) * 5, 70);
}

function drawCursor() {
  ctx.drawImage(
    crosshairSprite,
    currentAnimationFrame * 16,
    0,
    16,
    16,
    mouseX - 17,
    mouseY - 20,
    32,
    32
  );

  if (frames % animationFrameDelay === 0) {
    currentAnimationFrame = (currentAnimationFrame + 1) % animationFrameCount;
  }
}

function drawPowerupMenu() {
  ctx.fillStyle = '#06011f';
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  [0, 1, 2].forEach((i) => {
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(95, 146 + i * 100, 285, 56);
    ctx.fillStyle = !checkMaxed(i) ? '#991d0f' : '#06011f';
    ctx.fillRect(95, 146 + i * 100, 285, 56);
  });

  ctx.globalAlpha = 1.0;

  [0, 1, 2].forEach((p) => {
    ctx.font = '15px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(powers[p].d, 160, 180 + p * 100);

    if (!checkMaxed(p)) {
      ctx.font = '13px Arial';
      ctx.fillStyle = '#f95946';
      ctx.fillText('MAX LVL', 323, 198 + p * 100);
    }

    ctx.drawImage(
      powerupsSprite,
      powers[p].t * 16,
      0,
      16,
      16,
      100,
      150 + p * 100,
      48,
      48
    );
  });

  if (wave.n > 0 && !((wave.n + 1) % 12)) {
    ctx.fillText('*From next wave enemies will have', 118, 450);
    ctx.fillText(' increased HP and damage by 25%', 118, 470);
  }
}

function drawPlayer() {
  const animationDirection = mouseX - player.x >= 0 ? 1 : 0;
  const weaponOffsetX = Math.cos(player.a) * 10;
  const weaponOffsetY = Math.sin(player.a) * 10;
  const weaponX = player.x + weaponOffsetX;
  const weaponY = player.y + weaponOffsetY;

  ctx.save();
  ctx.translate(weaponX, weaponY);
  ctx.drawImage(
    player.wp,
    currentAnimationFrame * 16,
    0,
    16,
    16,
    -20,
    -20,
    20,
    20
  );
  ctx.restore();

  if (animationDirection) {
    ctx.drawImage(
      player.img,
      currentAnimationFrame * 16,
      0,
      16,
      23,
      player.x,
      player.y,
      32,
      46
    );
  } else {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      player.img,
      currentAnimationFrame * 16,
      0,
      16,
      23,
      -player.x - 32,
      player.y,
      32,
      46
    );
    ctx.restore();
  }
}

function drawBullet(bullet) {
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.s || 6, 0, Math.PI * 2);
  ctx.fillStyle = bullet.c1;
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.s ? bullet.s / 2 : 3, 0, Math.PI * 2);
  ctx.fillStyle = bullet.c2;
  ctx.fill();
  ctx.closePath();
}

function drawBoss() {
  ctx.drawImage(
    enemySprites[boss.t],
    currentAnimationFrame * 32,
    0,
    32,
    32,
    boss.x,
    boss.y,
    96,
    96
  );

  ctx.fillStyle = 'red';
  const healthBarWidth = (boss.hp / boss.mhp) * 96;
  ctx.fillRect(boss.x, boss.y - 10, healthBarWidth, 3);
}

function drawEnemy(enemy) {
  if (enemy.animationDirection) {
    ctx.drawImage(
      enemySprites[enemy.t],
      currentAnimationFrame * 16,
      0,
      16,
      23,
      enemy.x,
      enemy.y,
      32,
      46
    );
  } else {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      enemySprites[enemy.t],
      currentAnimationFrame * 16,
      0,
      16,
      23,
      -enemy.x - 32,
      enemy.y,
      32,
      46
    );
    ctx.restore();
  }

  ctx.fillStyle = 'red';
  const healthBarWidth = (enemy.hp / enemy.mhp) * 32;
  ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth, 3);
}

function updateEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;

    if (enemy.shooter && Math.random() < 0.005) {
      const dy = player.y - enemy.y;
      enemy.angleToPlayer = Math.atan2(dy, dx);

      enemyBullets.push({
        x: enemy.x,
        y: enemy.y + 20,
        dx: Math.cos(enemy.angleToPlayer) * 6,
        dy: Math.sin(enemy.angleToPlayer) * 6,
        dm: enemy.sdm,
        c1: enemy.c1,
        c2: enemy.c2
      });
    }

    enemy.animationDirection = dx >= 0 ? 1 : 0;
    drawEnemy(enemy);
  }
}

function updateEnemyBullets() {
  for (let i = 0; i < enemyBullets.length; i++) {
    const bullet = enemyBullets[i];
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    drawBullet(bullet);
    if (
      bullet.x < 0 ||
      bullet.x > canvas.width ||
      bullet.y < 0 ||
      bullet.y > canvas.height
    ) {
      if (bullet.s) {
        const initialRadius = 0;
        const radiusIncrement = 30;
        let currentRadius = initialRadius;
        const angleIncrement = (Math.PI * 2) / 12;
        for (let j = 0; j < 2; j++) {
          for (let z = 0; z < 12; z++) {
            const angle = angleIncrement * z;
            const bulletX = bullet.x + currentRadius * Math.cos(angle);
            const bulletY = bullet.y + currentRadius * Math.sin(angle);

            enemyBullets.push({
              x: bulletX - 30,
              y: bulletY - 30,
              dx: 6 * Math.cos(angle),
              dy: 6 * Math.sin(angle),
              dm: boss.sdm / 3,
              c1: '#4ba747',
              c2: '#97da3f'
            });
          }
          currentRadius += radiusIncrement;
        }
        genParticles(bullet.x, bullet.y, 5);
        enemyBullets.splice(i, 1);
        i--;
      } else {
        genParticles(bullet.x, bullet.y, 5);
        enemyBullets.splice(i, 1);
        i--;
      }
    } else if (
      aabb(
        { x: player.x, y: player.y, w: 32, h: 46 },
        { x: bullet.x, y: bullet.y, w: bullet.s || 6, h: bullet.s || 6 }
      )
    ) {
      const dx = player.x - bullet.x;
      const dy = player.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const nHp = player.hp - bullet.dm;
      player.hp = nHp < 0 ? 0 : nHp;

      enemyBullets.splice(i, 1);
      i--;
      genParticles(player.x + 10, player.y + 15, 5);

      const kickBackDistance = 3;
      const kickBackX = (dx / distance) * kickBackDistance;
      const kickBackY = (dy / distance) * kickBackDistance;
      const newX = player.x + kickBackX;
      const newY = player.y + kickBackY;

      if (!isColliding(newX, newY)) {
        player.x = Math.max(20, Math.min(canvas.width - 20, newX));
        player.y = Math.max(20, Math.min(canvas.height - 20, newY));
      }
    }
  }
}

function aabb(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function isColliding(x, y) {
  for (var j = 0; j < collisionGrid.length; j++) {
    if (
      collisionGrid[j] === 1 &&
      aabb(
        { x, y, w: 32, h: 46 },
        { x: (j % 15) * 32, y: Math.floor(j / 15) * 32, w: 32, h: 32 }
      )
    ) {
      return true;
    }
  }

  return false;
}

function drawMainMenu() {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#06011f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = ['#0093c4', '#5663bd', '#ab5da2', '#ffda41'][
    currentAnimationFrame
  ];
  ctx.strokeRect(95, 346, 285, 56);
  ctx.fillRect(95, 346, 285, 56);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText('PLAY', 212, 383);
  const displacementY = Math.sin(frames / 60) * 16;
  ctx.drawImage(logoSprite, 0, 0, 53, 29, 80, 100 + displacementY, 312, 174);
}

function toggleCurtain(cb, v = 0) {
  if (!curtain) {
    curtain = true;

    setTimeout(() => {
      curtainEl.setAttribute('style', 'box-shadow: inset 0 0 0 290px #0f0f11');

      setTimeout(() => {
        curtainEl.removeAttribute('style');
        curtain = false;
        cb();
      }, 500);
    }, v);
  }
}

function startRun() {
  if (mouseX >= 95 && mouseX <= 380 && mouseY >= 346 && mouseY <= 406) {
    toggleCurtain(() => {
      isGameOver = false;
      restartGame();
    });
  }
}

function startMusic() {
  music = zzfxP(...buffer);
  music && (music.loop = 1);
}

function toggleMusic() {
  if (soundEnabled) {
    music.stop();
  } else {
    startMusic();
  }

  soundEnabled = !soundEnabled;
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hctx.clearRect(0, 0, headerCanvas.width, headerCanvas.height);
  drawMap();

  if (isGameOver) {
    drawHeader();
    drawMainMenu();
    drawCursor();
    if (isMouseDown && !cycle) {
      startRun();

      if (soundEnabled && !soundActive) {
        soundActive = true;
        startMusic();
      }
    }
    return;
  }

  if (
    keys['d'] &&
    player.x < canvas.width - 32 &&
    !isColliding(player.x + player.s, player.y)
  ) {
    player.x += player.s;
  }
  if (
    keys['a'] &&
    player.x > 0 &&
    !isColliding(player.x - player.s, player.y)
  ) {
    player.x -= player.s;
  }
  if (
    keys['s'] &&
    player.y < canvas.height - 46 &&
    !isColliding(player.x, player.y + player.s)
  ) {
    player.y += player.s;
  }
  if (
    keys['w'] &&
    player.y > 0 &&
    !isColliding(player.x, player.y - player.s)
  ) {
    player.y -= player.s;
  }

  if (player.hps > 0) {
    const currentTime = new Date().getTime();
    if (currentTime - lastHpTime >= 1000 && !powerupMenu) {
      lastHpTime = currentTime;
      const add = player.hp + player.hps;
      player.hp = add > player.mhp ? player.mhp : add;
    }
  }

  for (let i = 0; i < bullets.length; i++) {
    bullets[i].x += bullets[i].dx;
    bullets[i].y += bullets[i].dy;
    drawBullet(bullets[i]);

    if (
      bullets[i].x < 0 ||
      bullets[i].x > canvas.width ||
      bullets[i].y < 0 ||
      bullets[i].y > canvas.height
    ) {
      genParticles(bullets[i].x, bullets[i].y, 5);
      bullets.splice(i, 1);
      i--;
    } else {
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];

        if (
          aabb(
            { x: enemy.x, y: enemy.y, w: 32, h: 46 },
            { x: bullets[i].x, y: bullets[i].y, w: 6, h: 6 }
          )
        ) {
          const dx = bullets[i].x - enemy.x;
          const dy = bullets[i].y - enemy.y;
          bullets.splice(i, 1);
          enemy.hp -= player.dm;

          if (enemy.hp <= 0) {
            genParticles(enemy.x + 10, enemy.y + 15, 5);
            enemies.splice(j, 1);
            player.hpkill();
          } else {
            genParticles(enemy.x + 10, enemy.y + 15, 5);
            const knockbackDistance = 10;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const knockbackX = (dx / distance) * knockbackDistance;
            const knockbackY = (dy / distance) * knockbackDistance;

            const newX = enemy.x - knockbackX;
            const newY = enemy.y - knockbackY;
            enemy.x = Math.max(0, Math.min(canvas.width, newX));
            enemy.y = Math.max(0, Math.min(canvas.height, newY));
          }
          break;
        }
      }

      if (
        boss &&
        bullets[i] &&
        aabb(
          { x: boss.x, y: boss.y, w: 96, h: 96 },
          { x: bullets[i].x, y: bullets[i].y, w: 6, h: 6 }
        )
      ) {
        bullets.splice(i, 1);
        boss.hp -= player.dm;

        if (boss.hp <= 0) {
          genParticles(boss.x + 50, boss.y + 55, 25);
          boss = null;
          player.hpkill();
          waveClear = true;
          generatePowers();
        } else {
          genParticles(boss.x + 50, boss.y + 55, 5);
        }
      }
    }
  }

  if (boss) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const angleToPlayer = Math.atan2(dy, dx);

    const stepX = Math.cos(angleToPlayer) * boss.s;
    const stepY = Math.sin(angleToPlayer) * boss.s;

    boss.x += stepX;
    boss.y += stepY;

    if (
      aabb(
        { x: player.x, y: player.y, w: 26, h: 36 },
        { x: boss.x, y: boss.y, w: 90, h: 90 }
      )
    ) {
      player.hp -= boss.dm;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const kickBackDistance = 2.5;
      const kickBackX = (dx / distance) * kickBackDistance;
      const kickBackY = (dy / distance) * kickBackDistance;
      const newX = player.x + kickBackX;
      const newY = player.y + kickBackY;

      if (!isColliding(newX, newY)) {
        player.x = Math.max(20, Math.min(canvas.width - 20, newX));
        player.y = Math.max(20, Math.min(canvas.height - 20, newY));
      }
    }
  }

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angleToPlayer = Math.atan2(dy, dx);

    const stepX = Math.cos(angleToPlayer) * enemy.s;
    const stepY = Math.sin(angleToPlayer) * enemy.s;

    enemy.x += stepX;
    enemy.y += stepY;

    if (
      aabb(
        { x: player.x, y: player.y, w: 26, h: 36 },
        { x: enemy.x, y: enemy.y, w: 26, h: 36 }
      )
    ) {
      player.hp -= enemy.dm;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const kickBackDistance = 2.5;
      const kickBackX = (dx / distance) * kickBackDistance;
      const kickBackY = (dy / distance) * kickBackDistance;
      const newX = player.x + kickBackX;
      const newY = player.y + kickBackY;

      if (!isColliding(newX, newY)) {
        player.x = Math.max(20, Math.min(canvas.width - 20, newX));
        player.y = Math.max(20, Math.min(canvas.height - 20, newY));
      }
    }

    for (let j = 0; j < enemies.length; j++) {
      if (i !== j) {
        const otherEnemy = enemies[j];
        const dx = enemy.x - otherEnemy.x;
        const dy = enemy.y - otherEnemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 42) {
          enemy.x += dx * 0.01;
          enemy.y += dy * 0.01;
        }
      }
    }
  }

  drawPlayer();
  updateEnemies();
  if (boss) {
    updateBoss();
  }
  updateEnemyBullets();
  drawHeader();
  if (waveClear && !enemies.length) {
    enemyBullets.length = 0;
    powerupMenu = true;
    drawPowerupMenu();
  }
  drawCursor();

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].isExpired()) {
      particles.splice(i, 1);
    } else {
      ctx.beginPath();
      ctx.arc(
        particles[i].x,
        particles[i].y,
        particles[i].radius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        Math.random() < 0.5
          ? `rgba(255, 0, 0, ${particles[i].alpha})`
          : `rgba(255, 255, 255, ${particles[i].alpha})`;
      ctx.fill();
      ctx.closePath();
    }
  }

  if (isMouseDown && !powerupMenu) {
    mouseClick();
  } else if (isMouseDown && powerupMenu && !enemies.length && enableClick) {
    detectUpgrade();
  }

  if (powerupMenu && !enableClick && !boss && !enemies.length && !cycle) {
    cycle = true;

    setTimeout(() => {
      enableClick = true;
      cycle = false;
    }, 1500);
  }

  if (keys['d'] || keys['a'] || keys['s'] || keys['w']) {
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    player.a = Math.atan2(dy, dx);
  }

  if (player.hp <= 0 && !curtain) {
    toggleCurtain(() => {
      isGameOver = true;
      const nr = wave.n + 1;
      if (nr > highScore) {
        highScore = `${nr}`;
        localStorage.setItem('ms', nr);
      }
    }, 1000);
  }
}

function detectUpgrade() {
  if (mouseX >= 95 && mouseX <= 380) {
    if (mouseY >= 150 && mouseY <= 206 && checkMaxed(0)) {
      player.pp(powers[0]);
      powers = [];
      wave.n += 1;
      startWave();
    } else if (mouseY >= 250 && mouseY <= 306 && checkMaxed(1)) {
      player.pp(powers[1]);
      powers = [];
      wave.n += 1;
      startWave();
    } else if (mouseY >= 350 && mouseY <= 406 && checkMaxed(2)) {
      player.pp(powers[2]);
      powers = [];
      wave.n += 1;
      startWave();
    }
  }
}

function checkMaxed(i) {
  return powers[i].c !== 0
    ? powers[i].k !== 'cd'
      ? player[powers[i].k] < powers[i].c
      : player[powers[i].k] > powers[i].c
    : true;
}

function generatePowers() {
  const first = pickRandom(
    POWERUP_LIST.filter((item) => item.c === 0),
    1
  );
  const others = pickRandom(
    POWERUP_LIST.filter((item) => item.k !== first[0].k),
    2
  );
  powers = [...first, ...others];
}

function pickRandom(arr, count) {
  let _arr = [...arr];
  return [...Array(count)].map(
    () => _arr.splice(Math.floor(Math.random() * _arr.length), 1)[0]
  );
}

function genParticles(x, y, no) {
  for (let i = 0; i < no; i++) {
    particles.push(new Particle(x, y));
  }
}

const keys = {};

function onKeyDown(event) {
  keys[event.key] = true;

  if (event.key === 'm') {
    toggleMusic();
  }
}

function onKeyUp(event) {
  keys[event.key] = false;
}

function mouseMove(event) {
  const canvasRect = canvas.getBoundingClientRect();
  mouseX = event.clientX - canvasRect.left;
  mouseY = event.clientY - canvasRect.top;
  const dx = mouseX - player.x;
  const dy = mouseY - player.y;
  player.a = Math.atan2(dy, dx);
}

let lastShotTime = 0;
let lastHpTime = 0;

function mouseClick() {
  const currentTime = new Date().getTime();
  if (currentTime - lastShotTime >= player.cd) {
    lastShotTime = currentTime;
    const weaponEndX = player.x - 5;
    const weaponEndY = player.y - 5;
    const blts = [player.a];

    if (player.bn >= 2) {
      blts.push(player.a - Math.PI / 6);
    }
    if (player.bn === 3) {
      blts.push(player.a + Math.PI / 6);
    }

    blts.forEach((b) => {
      bullets.push({
        x: weaponEndX,
        y: weaponEndY,
        dx: Math.cos(b) * 10,
        dy: Math.sin(b) * 10,
        c1: '#f3a7cd',
        c2: '#e71284'
      });
    });
  }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);

function onMouseDown() {
  isMouseDown = true;
}

function onMouseUp() {
  isMouseDown = false;
}

function spawnEnemy() {
  if (!wave.e.length) {
    clearInterval(enemyInterval);
    waveClear = true;
    generatePowers();
    return;
  }
  const side = Math.floor(Math.random() * 3);

  let spawnX, spawnY;

  if (side === 0) {
    spawnX = canvas.width + 16;
    spawnY = canvas.height / 2;
  } else if (side === 1) {
    spawnX = canvas.width / 2;
    spawnY = canvas.height + 16;
  } else {
    spawnX = -16;
    spawnY = canvas.height / 2;
  }

  const angleToPlayer = Math.atan2(player.y - spawnY, player.x - spawnX);
  const stepX = Math.cos(angleToPlayer);
  const stepY = Math.sin(angleToPlayer);
  const dx = spawnX - player.x;
  const dy = spawnY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 66) {
    const t = wave.e.shift();
    const e = ENEMIES[t];

    enemies.push({
      x: spawnX,
      y: spawnY,
      hp: player.inc ? e.hp + ((player.inc * 25) / 100) * e.hp : e.hp,
      mhp: player.inc ? e.hp + ((player.inc * 25) / 100) * e.hp : e.hp,
      shooter: !!e.q,
      stepX,
      stepY,
      angleToPlayer,
      s: e.s,
      dm: player.inc ? e.dm + ((player.inc * 25) / 100) * e.dm : e.dm,
      sdm: player.inc ? e.sdm + ((player.inc * 25) / 100) * e.sdm : e.sdm,
      t,
      c1: e.c1,
      c2: e.c2
    });
  }
}

function startEnemyInterval() {
  enemyInterval = setInterval(
    () => {
      spawnEnemy();
    },
    wave.n ? 1700 : 2200
  );
}

function restartGame() {
  wave = {
    n: 0,
    e: []
  };
  clearInterval(enemyInterval);
  player.res(canvas.width / 2, canvas.height / 2);

  enemies.length = 0;
  enemyBullets.length = 0;
  bullets.length = 0;
  boss = null;
  startWave();
}

function updateBoss() {
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  boss.angleToPlayer = Math.atan2(dy, dx);

  if (Math.abs(boss.l - new Date()) / 1000 >= 3) {
    boss.l = new Date();

    switch (boss.t) {
      case 'b1':
        if (boss.s > 0.5) {
          boss.s -= 1.4;
        }
        if (Math.random() > 0.65) {
          boss.s += 1.4;
        } else {
          const initialRadius = 0;
          const radiusIncrement = 30;
          let currentRadius = initialRadius;
          const angleIncrement = (Math.PI * 2) / 10;
          for (let j = 0; j < 5; j++) {
            for (let i = 0; i < 10; i++) {
              const angle = angleIncrement * i;
              const bulletX = boss.x + currentRadius * Math.cos(angle);
              const bulletY = boss.y + currentRadius * Math.sin(angle);

              const bullet = {
                x: bulletX + 40,
                y: bulletY + 40,
                dx: 6 * Math.cos(angle),
                dy: 6 * Math.sin(angle),
                dm: boss.sdm,
                c1: '#504fa3',
                c2: '#807fd1'
              };

              enemyBullets.push(bullet);
            }
            currentRadius += radiusIncrement;
          }
        }
        break;
      case 'b2':
        if (Math.random() > 0.85) {
          for (var i = 0; i < 3; i++) {
            let spawnX, spawnY;
            if (Math.floor(Math.random() * 2) === 0) {
              spawnX = canvas.width + 16;
              spawnY = canvas.height / 2;
            } else {
              spawnX = -16;
              spawnY = canvas.height / 2;
            }

            const angleToPlayer = Math.atan2(
              player.y - spawnY,
              player.x - spawnX
            );
            const stepX = Math.cos(angleToPlayer);
            const stepY = Math.sin(angleToPlayer);
            const e = ENEMIES.s;

            enemies.push({
              x: spawnX,
              y: spawnY,
              hp: player.inc ? e.hp + ((player.inc * 25) / 100) * e.hp : e.hp,
              mhp: player.inc ? e.hp + ((player.inc * 25) / 100) * e.hp : e.hp,
              shooter: !!e.q,
              stepX,
              stepY,
              angleToPlayer,
              s: e.s,
              dm: player.inc ? e.dm + ((player.inc * 25) / 100) * e.dm : e.dm,
              sdm: player.inc
                ? e.sdm + ((player.inc * 25) / 100) * e.sdm
                : e.sdm,
              t: 's'
            });
          }
        } else {
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((b) => {
            enemyBullets.push({
              x: boss.x + 48,
              y: boss.y + 48,
              dx: Math.cos(b * 10) * 6,
              dy: Math.sin(b * 10) * 6,
              dm: boss.sdm,
              c1: '#e64539',
              c2: '#ff8933'
            });
          });
        }
        break;
      case 'b3':
        if (boss.s > 0.5) {
          boss.s -= 1.4;
        }
        if (Math.random() > 0.75) {
          boss.s += 1.4;
        } else {
          [-1, 1].forEach((a) => {
            enemyBullets.push({
              x: boss.x + 48,
              y: boss.y + 48,
              dx: Math.cos(boss.angleToPlayer - (Math.PI / 6) * a) * 5,
              dy: Math.sin(boss.angleToPlayer - (Math.PI / 6) * a) * 5,
              dm: boss.sdm,
              c1: '#4ba747',
              c2: '#97da3f',
              s: 20
            });
          });
        }
        break;
    }
  }

  drawBoss();
}

function spawnBoss(index) {
  const sX = (canvas.width - 96) / 2;
  const sY = 50;
  const angleToPlayer = Math.atan2(player.y - sX, player.x - sY);
  const stepX = Math.cos(angleToPlayer);
  const stepY = Math.sin(angleToPlayer);
  const e = ENEMIES[index];
  t ? (t = 1) : ((t = 1), shake());

  boss = {
    x: sX,
    y: sY,
    hp: player.inc ? e.hp + ((player.inc * 25) / 100) * e.hp : e.hp,
    mhp: player.inc ? e.hp + ((player.inc * 25) / 100) * e.hp : e.hp,
    stepX,
    stepY,
    angleToPlayer,
    s: e.s,
    dm: player.inc ? e.dm + ((player.inc * 25) / 100) * e.dm : e.dm,
    sdm: player.inc ? e.sdm + ((player.inc * 25) / 100) * e.sdm : e.sdm,
    t: index,
    l: new Date()
  };
}

function startWave() {
  powerupMenu = false;
  waveClear = false;
  enableClick = false;
  player.inc = Math.floor(wave.n / 12);
  const waveInfo = WAVES[wave.n % 12];
  waveInfo.charAt(0) == 'b'
    ? spawnBoss(waveInfo)
    : (waveInfo.split('-').forEach((e) => {
        const a = e.split(':');
        const type = a[0];
        const count = +a[1];
        wave.e = [...wave.e, ...Array(count).fill(type)].sort(
          () => 0.5 - Math.random()
        );
      }),
      startEnemyInterval());
}

var t = 0;

function shake() {
  var a = (Math.random() * 2 - 1) * t;
  var x = (Math.random() * 15 * 2 - 15) * t;
  var y = (Math.random() * 15 - 15 * 0.5) * t;
  var s = Math.max(1, 1.05 * t);
  var tr =
    'rotate(' + a + 'deg) translate(' + x + 'px,' + y + 'px) scale(' + s + ')';

  canvas.style.transform = canvas.style.webkitTransform = tr;
  t -= 0.03;

  if (t > 0) {
    requestAnimationFrame(shake);
  } else {
    t = 0;
    canvas.style.transform = 'matrix(1,0,0,1,0,0)';
  }
}

let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;
let frames = 0;

function animate() {
  requestAnimationFrame(animate);
  const msNow = window.performance.now();
  const msPassed = msNow - msPrev;
  if (msPassed < msPerFrame) return;
  const excessTime = msPassed % msPerFrame;
  msPrev = msNow - excessTime;
  frames++;
  if (!curtain) update();
}

animate();
