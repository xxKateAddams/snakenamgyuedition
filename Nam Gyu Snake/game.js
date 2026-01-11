const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const scoreDisplay = document.getElementById("score");

const CELL = 32;
const HEAD_SIZE = 48;
let SPEED = 140;

let snake = [];
let direction = { x: 1, y: 0 };
let lastDir = { x: 1, y: 0 };
let pill = { x: 5, y: 5, img: null };
let score = 0;
let gameOver = false;
let gameStarted = false;
let eating = false;
let chewTimer = 0;

const eatSound = new Audio("assets/eat.wav");
const crashSound = new Audio("assets/crash.wav");
const bgMusic = new Audio("assets/bg_music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

const headClosed = new Image();
headClosed.src = "assets/head_closed.png";
const headOpen = new Image();
headOpen.src = "assets/head_open.png";
const headDead = new Image();
headDead.src = "assets/head_dead.png";
const bodyStraight = new Image();
bodyStraight.src = "assets/body_straight.png";
const bodyTurn = new Image();
bodyTurn.src = "assets/body_turn.png";
const tailImg = new Image();
tailImg.src = "assets/tail.png";

const pillImgs = [
  new Image(),
  new Image(),
  new Image()
];
pillImgs[0].src = "assets/pill1.png";
pillImgs[1].src = "assets/pill2.png";
pillImgs[2].src = "assets/pill3.png";

const startScreen = document.createElement("div");
startScreen.className = "game-window";
startScreen.innerHTML = `
  <h2>Snake: Nam Gyu Edition*</h2>
  <button id="startBtn">Start Game</button>
`;
document.body.appendChild(startScreen);

const endScreen = document.createElement("div");
endScreen.className = "game-window hidden";
endScreen.innerHTML = `
  <h2>Snake: Nam Gyu Edition*</h2>
  <p>Nam Gyu is dead.</p>
  <p id="finalScore"></p>
  <button id="restartBtn">Play Again</button>
`;
document.body.appendChild(endScreen);

document.getElementById("startBtn").onclick = () => {
  startScreen.classList.add("hidden");
  startGame();
};
document.getElementById("restartBtn").onclick = () => {
  endScreen.classList.add("hidden");
  startGame();
};

document.addEventListener("keydown", (e) => {
  if (!gameStarted) return;
  if (e.key === "ArrowUp" && lastDir.y !== 1) direction = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && lastDir.y !== -1) direction = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && lastDir.x !== 1) direction = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && lastDir.x !== -1) direction = { x: 1, y: 0 };
});

function startGame() {
  const startX = Math.floor((canvas.width / CELL) / 2);
  const startY = Math.floor((canvas.height / CELL) / 2);

  snake = [
    { x: startX, y: startY, dir: { x: 1, y: 0 } },
    { x: startX - 1, y: startY, dir: { x: 1, y: 0 } },
  ];

  direction = { x: 1, y: 0 };
  lastDir = { x: 1, y: 0 };
  score = 0;
  scoreDisplay.textContent = 0;
  gameOver = false;
  gameStarted = true;
  eating = false;
  chewTimer = 0;
  pill = randomPill();

  bgMusic.currentTime = 0;
  bgMusic.play();
}

function randomPill() {
  const img = pillImgs[Math.floor(Math.random() * pillImgs.length)];
  return {
    x: Math.floor(Math.random() * (canvas.width / CELL)),
    y: Math.floor(Math.random() * (canvas.height / CELL)),
    img: img
  };
}

function update() {
  if (!gameStarted || gameOver) return;

  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;
  head.dir = { ...direction };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= canvas.width / CELL ||
    head.y >= canvas.height / CELL ||
    snake.some((seg) => seg.x === head.x && seg.y === head.y)
  ) {
    bgMusic.pause();
    crashSound.play();
    gameOver = true;
    gameStarted = false;
    document.getElementById("finalScore").textContent = `Score: ${score}`;
    endScreen.classList.remove("hidden");
    return;
  }

  snake.unshift(head);

  if (head.x === pill.x && head.y === pill.y) {
    eatSound.play();
    score++;
    scoreDisplay.textContent = score;
    pill = randomPill();
    eating = true;
    chewTimer = 6;
  } else {
    snake.pop();
  }

  if (chewTimer > 0) {
    chewTimer--;
    if (chewTimer === 0) eating = false;
  }

  lastDir = { ...direction };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameStarted && !gameOver) return;

  if (pill.img) ctx.drawImage(pill.img, pill.x * CELL, pill.y * CELL, CELL, CELL);

  for (let i = 1; i < snake.length - 1; i++) {
    const prev = snake[i - 1];
    const seg = snake[i];
    const next = snake[i + 1];
    const dxPrev = prev.x - seg.x;
    const dyPrev = prev.y - seg.y;
    const dxNext = next.x - seg.x;
    const dyNext = next.y - seg.y;

    ctx.save();
    ctx.translate(seg.x * CELL + CELL / 2, seg.y * CELL + CELL / 2);

    if (dxPrev !== dxNext && dyPrev !== dyNext) {
      let angle = 0;
      if ((dxPrev === 1 && dyNext === -1) || (dyPrev === -1 && dxNext === 1))
        angle = 0;
      else if (
        (dxPrev === 0 && dyPrev === 1 && dxNext === -1 && dyNext === 0) ||
        (dxPrev === -1 && dyPrev === 0 && dxNext === 0 && dyNext === 1)
      )
        angle = Math.PI;
      else if ((dxPrev === 1 && dyNext === 1) || (dyPrev === 1 && dxNext === 1))
        angle = Math.PI / 2;
      else angle = (3 * Math.PI) / 2;

      ctx.rotate(angle);
      ctx.drawImage(bodyTurn, -CELL / 2, -CELL / 2, CELL, CELL);
    } else {
      if (dxPrev !== 0) ctx.rotate(Math.PI / 2);
      ctx.drawImage(bodyStraight, -CELL / 2, -CELL / 2, CELL, CELL);
    }

    ctx.restore();
  }

  if (snake.length > 1) {
    const tail = snake[snake.length - 1];
    const beforeTail = snake[snake.length - 2];
    const dx = beforeTail.x - tail.x;
    const dy = beforeTail.y - tail.y;

    ctx.save();
    ctx.translate(tail.x * CELL + CELL / 2, tail.y * CELL + CELL / 2);
    if (dx === 1 && dy === 0) ctx.rotate(0);
    else if (dx === -1 && dy === 0) ctx.rotate(Math.PI);
    else if (dx === 0 && dy === 1) ctx.rotate(Math.PI / 2);
    else if (dx === 0 && dy === -1) ctx.rotate((3 * Math.PI) / 2);
    ctx.drawImage(tailImg, -CELL / 2, -CELL / 2, CELL, CELL);
    ctx.restore();
  }

  const head = snake[0];
  ctx.save();
  const chewScale = eating ? 1.15 : 1.0;
  const img = gameOver ? headDead : eating ? headOpen : headClosed;
  const flip = head.dir.x === 1;
  let x = head.x * CELL - (HEAD_SIZE - CELL) / 2;
  let y = head.y * CELL - (HEAD_SIZE - CELL) / 2;
  if (head.dir.x !== 0) y -= 10;
  ctx.translate(x + HEAD_SIZE / 2, y + HEAD_SIZE / 2);
  ctx.scale(flip ? -chewScale : chewScale, chewScale);
  ctx.drawImage(img, -HEAD_SIZE / 2, -HEAD_SIZE / 2, HEAD_SIZE, HEAD_SIZE);
  ctx.restore();
}

function loop() {
  update();
  draw();
  setTimeout(loop, SPEED);
}

loop();