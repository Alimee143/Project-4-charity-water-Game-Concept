const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDiv = document.getElementById('score');
const factBox = document.getElementById('factBox');

const facts = [
  "771 million people lack access to clean water.",
  "Women and girls spend 200 million hours every day collecting water.",
  "Access to clean water can improve education and health.",
  "charity: water has funded over 100,000 water projects worldwide."
];

let gameActive = false;
let score = 0;
let drop = { x: 200, y: 500, radius: 20 };
let obstacles = [];
let collectibles = [];
let speed = 2;

function resetGame() {
  score = 0;
  drop = { x: 200, y: 500, radius: 20 };
  obstacles = [];
  collectibles = [];
  speed = 2;
  scoreDiv.textContent = "Score: 0";
}

function randomX() {
  return Math.random() * (canvas.width - 40) + 20;
}

function spawnObstacle() {
  // Gradually increase obstacle spawn rate as score increases
  let baseChance = 0.008; // very easy at first
  if (score > 50) baseChance = 0.012;
  if (score > 100) baseChance = 0.018;
  if (score > 200) baseChance = 0.025;
  if (score > 350) baseChance = 0.035;
  if (Math.random() < baseChance) {
    obstacles.push({ x: randomX(), y: -20, size: 30 });
  }
}

function spawnCollectible() {
  // Optionally, make collectibles a bit less frequent as score increases
  let dropChance = 0.018;
  if (score > 100) dropChance = 0.014;
  if (score > 200) dropChance = 0.011;
  if (score > 350) dropChance = 0.009;
  if (Math.random() < dropChance) {
    collectibles.push({ x: randomX(), y: -20, size: 20 });
  }
}

function drawDrop() {
  // Draw a bucket instead of a drop
  const bucketWidth = 50;
  const bucketHeight = 30;
  const bucketX = drop.x - bucketWidth / 2;
  const bucketY = drop.y - bucketHeight / 2;

  // Bucket base
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(bucketX, bucketY, bucketWidth, bucketHeight);

  // Bucket rim (arc)
  ctx.beginPath();
  ctx.ellipse(drop.x, bucketY, bucketWidth / 2, 10, 0, 0, Math.PI, true);
  ctx.fillStyle = '#a1887f';
  ctx.fill();
  ctx.closePath();

  // Optional: bucket handle
  ctx.beginPath();
  ctx.arc(drop.x, bucketY, bucketWidth / 2, Math.PI, 2 * Math.PI, false);
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.closePath();
}

function drawObstacles() {
  obstacles.forEach(o => {
    ctx.save();
    ctx.translate(o.x, o.y);

    // Draw dirty water drop shape
    ctx.beginPath();
    ctx.moveTo(0, -o.size); // Top point
    ctx.bezierCurveTo(
      o.size, -o.size / 2,   // Right control point
      o.size, o.size,        // Right bottom control
      0, o.size              // Bottom point
    );
    ctx.bezierCurveTo(
      -o.size, o.size,       // Left bottom control
      -o.size, -o.size / 2,  // Left control point
      0, -o.size             // Back to top
    );
    ctx.closePath();
    ctx.fillStyle = '#4e342e'; // dark brown for dirty water
    ctx.fill();

    // Add some "dirt" spots
    ctx.beginPath();
    ctx.arc(-o.size / 3, o.size / 3, o.size / 6, 0, Math.PI * 2);
    ctx.arc(o.size / 4, o.size / 4, o.size / 8, 0, Math.PI * 2);
    ctx.arc(0, o.size / 2.5, o.size / 10, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();

    ctx.restore();
  });
}

function drawCollectibles() {
  collectibles.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);

    // Draw water drop shape
    ctx.beginPath();
    ctx.moveTo(0, -c.size); // Top point
    ctx.bezierCurveTo(
      c.size, -c.size / 2,   // Right control point
      c.size, c.size,        // Right bottom control
      0, c.size              // Bottom point
    );
    ctx.bezierCurveTo(
      -c.size, c.size,       // Left bottom control
      -c.size, -c.size / 2,  // Left control point
      0, -c.size             // Back to top
    );
    ctx.closePath();
    ctx.fillStyle = '#2196f3';
    ctx.fill();
    ctx.restore();
  });
}

function moveEntities() {
  obstacles.forEach(o => o.y += speed);
  collectibles.forEach(c => c.y += speed);
}

function checkCollisions() {
  // Obstacles
  for (let o of obstacles) {
    let dx = drop.x - o.x;
    let dy = drop.y - o.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < drop.radius + o.size) {
      endGame();
      return;
    }
  }
  // Collectibles
  collectibles = collectibles.filter(c => {
    let dx = drop.x - c.x;
    let dy = drop.y - c.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < drop.radius + c.size) {
      score += 10;
      scoreDiv.textContent = "Score: " + score;
      return false;
    }
    return true;
  });
}

function endGame() {
  gameActive = false;
  factBox.textContent = facts[Math.floor(Math.random() * facts.length)];
  factBox.classList.remove('hidden');
  startBtn.disabled = false;
}

function gameLoop() {
  if (!gameActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawDrop();
  drawObstacles();
  drawCollectibles();
  moveEntities();
  checkCollisions();

  // Remove off-screen
  obstacles = obstacles.filter(o => o.y < canvas.height + 30);
  collectibles = collectibles.filter(c => c.y < canvas.height + 20);

  // Spawn new
  spawnObstacle();
  spawnCollectible();

  // Gradually increase speed as score increases
  if (score < 100) {
    speed = 2 + score * 0.01;
  } else if (score < 200) {
    speed = 3 + (score - 100) * 0.015;
  } else {
    speed = 4.5 + (score - 200) * 0.02;
  }

  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
  if (!gameActive) return;
  if (e.key === 'ArrowLeft' && drop.x - drop.radius > 0) drop.x -= 20;
  if (e.key === 'ArrowRight' && drop.x + drop.radius < canvas.width) drop.x += 20;
});

// Add mouse movement for the bucket
canvas.addEventListener('mousemove', (e) => {
  if (!gameActive) return;
  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  let mouseX = e.clientX - rect.left;
  // Clamp bucket within canvas bounds
  const bucketWidth = 50;
  if (mouseX < bucketWidth / 2) mouseX = bucketWidth / 2;
  if (mouseX > canvas.width - bucketWidth / 2) mouseX = canvas.width - bucketWidth / 2;
  drop.x = mouseX;
});

startBtn.addEventListener('click', () => {
  resetGame();
  factBox.classList.add('hidden');
  startBtn.disabled = true;
  gameActive = true;
  gameLoop();
});