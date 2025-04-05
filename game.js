const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 22;
const tileCount = 15;
let snake = [{x: 10, y: 10, visualX: 10, visualY: 10}];
let direction = {x: 0, y: 0};
let food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
let score = 0;
let baseGameSpeed = 125;
let gameRunning = false;
let imagesLoaded = false;
let gameStarted = false;
let walls = [];

function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();
  setTimeout(gameLoop, gameSpeed);
}

function generateWalls() {
  walls = [];
  if (document.getElementById('difficulty').value === 'hard') {
    for (let i = 0; i < 2; i++) {
      let wall;
      do {
        wall = {
          x: Math.floor(Math.random() * (tileCount - 4)) + 2,
          y: Math.floor(Math.random() * (tileCount - 4)) + 2,
          length: Math.floor(Math.random() * 3) + 3,
          isVertical: Math.random() < 0.5
        };
      } while (isWallOverlapping(wall));
      walls.push(wall);
    }
  }
}

function isWallOverlapping(newWall) {
  const SAFE_DISTANCE = 4;
  
  for (const segment of snake) {
    if (Math.abs(newWall.x - segment.x) < SAFE_DISTANCE && Math.abs(newWall.y - segment.y) < SAFE_DISTANCE) return true;
  }
  
  if (Math.abs(newWall.x - food.x) < SAFE_DISTANCE && Math.abs(newWall.y - food.y) < SAFE_DISTANCE) return true;
  
  return walls.some(wall => {
    if (newWall.isVertical === wall.isVertical) {
      if (newWall.isVertical) {
        return Math.abs(newWall.x - wall.x) < SAFE_DISTANCE && 
               Math.abs(newWall.y - wall.y) < newWall.length + wall.length;
      } else {
        return Math.abs(newWall.y - wall.y) < SAFE_DISTANCE && 
               Math.abs(newWall.x - wall.x) < newWall.length + wall.length;
      }
    }
    else {
      const newWallEnd = newWall.isVertical ? newWall.y + newWall.length : newWall.x + newWall.length;
      const wallEnd = wall.isVertical ? wall.y + wall.length : wall.x + wall.length;
      
      if (newWall.isVertical) {
        return (Math.abs(newWall.x - wall.x) < SAFE_DISTANCE && 
                newWall.y < wallEnd && wall.y < newWallEnd);
      } else {
        return (Math.abs(newWall.y - wall.y) < SAFE_DISTANCE && 
                newWall.x < wallEnd && wall.x < newWallEnd);
      }
    }
  });
}

function update() {
  if (!gameStarted) return;
  
  const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
      snake.some(segment => segment.x === head.x && segment.y === head.y) ||
      walls.some(wall => {
        if (wall.isVertical) {
          return head.x === wall.x && head.y >= wall.y && head.y < wall.y + wall.length;
        } else {
          return head.y === wall.y && head.x >= wall.x && head.x < wall.x + wall.length;
        }
      })) {
    gameOver();
    return;
  }

  head.visualX = head.x;
  head.visualY = head.y;
  snake.unshift(head);

  const movementSpeed = 0.25;
  snake.forEach(segment => {
    if (segment.visualX !== segment.x) {
      segment.visualX += (segment.x - segment.visualX) * movementSpeed;
    }
    if (segment.visualY !== segment.y) {
      segment.visualY += (segment.y - segment.visualY) * movementSpeed;
    }
  });

  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('scoreValue').textContent = score;
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
      };
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      walls.some(wall => {
        if (wall.isVertical) {
          return newFood.x === wall.x && newFood.y >= wall.y && newFood.y < wall.y + wall.length;
        } else {
          return newFood.y === wall.y && newFood.x >= wall.x && newFood.x < wall.x + wall.length;
        }
      })
    );
    food = newFood;
  } else {
    snake.pop();
  }
}

const headImage = new Image();
const tailImage = new Image();
const foodImage = new Image();
const wallImage = new Image();
const backgroundImage = new Image();

Promise.all([
  new Promise(resolve => { headImage.onload = resolve; }),
  new Promise(resolve => { tailImage.onload = resolve; }),
  new Promise(resolve => { foodImage.onload = resolve; }),
  new Promise(resolve => { wallImage.onload = resolve; }),
  new Promise(resolve => { backgroundImage.onload = resolve; })
]).then(() => {
  imagesLoaded = true;
  startButton.disabled = false;
});

headImage.src = 'images/drago.png';
tailImage.src = 'images/dragon2-3.png';
foodImage.src = 'images/dragonsnek (3).gif';
wallImage.src = 'images/wall.png';
backgroundImage.src = 'images/floor.jpg';

function draw() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  walls.forEach(wall => {
    if (wall.isVertical) {
      for (let i = 0; i < wall.length; i++) {
        ctx.drawImage(wallImage, wall.x * gridSize, (wall.y + i) * gridSize, gridSize, gridSize);
      }
    } else {
      for (let i = 0; i < wall.length; i++) {
        ctx.drawImage(wallImage, (wall.x + i) * gridSize, wall.y * gridSize, gridSize, gridSize);
      }
    }
  });

  if (!gameStarted && snake.length > 0) {
    const head = snake[0];
    ctx.save();
    ctx.translate(head.x * gridSize + gridSize/2, head.y * gridSize + gridSize/2);
    ctx.rotate(Math.PI * 1.5);
    ctx.drawImage(headImage, -gridSize/2, -gridSize/2, gridSize, gridSize);
    ctx.restore();
  }

  snake.forEach((segment, index) => {
    const ctx_save = ctx.save();
    
    if (index === 0) {
      let rotation = Math.PI * 1.5;
      if (direction.x === 1) rotation = Math.PI * 1.5;
      else if (direction.x === -1) rotation = Math.PI * 0.5;
      else if (direction.y === -1) rotation = Math.PI;
      else if (direction.y === 1) rotation = 0;
      
      ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
      ctx.rotate(rotation);
      ctx.drawImage(headImage, -gridSize/2, -gridSize/2, gridSize, gridSize);
    } else {
      const prevSegment = snake[index - 1];
      const dx = segment.x - prevSegment.x;
      const dy = segment.y - prevSegment.y;
      let rotation = 0;
      
      if (dx === 1) rotation = Math.PI/2;
      else if (dx === -1) rotation = -Math.PI/2;
      else if (dy === -1) rotation = 0;
      else if (dy === 1) rotation = Math.PI;
      
      ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
      ctx.rotate(rotation);
      ctx.drawImage(tailImage, -gridSize/2, -gridSize/2, gridSize, gridSize);
    }
    
    ctx.restore();
  });

  ctx.drawImage(foodImage, food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function gameOver() {
  gameRunning = false;
  startButton.disabled = false;
  pauseButton.disabled = true;
  document.getElementById('scoreValue').textContent = `${score} (Game Over!)`;
}

const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

let gameSpeed = baseGameSpeed;

function updateGameSpeed() {
  const difficulty = document.getElementById('difficulty').value;
  switch (difficulty) {
    case 'easy':
      gameSpeed = baseGameSpeed * 1.2;
      break;
    case 'hard':
      gameSpeed = baseGameSpeed * 0.95;
      break;
    default:
      gameSpeed = baseGameSpeed;
  }
  generateWalls();
}

document.getElementById('difficulty').addEventListener('change', () => {
  updateGameSpeed();
});

startButton.addEventListener('click', () => {
  if (!imagesLoaded) return;
  snake = [{x: 10, y: 10}];
  direction = {x: 0, y: 0};
  score = 0;
  gameStarted = false;
  updateGameSpeed();
  generateWalls();
  document.getElementById('scoreValue').textContent = score;
  gameRunning = true;
  startButton.disabled = true;
  pauseButton.disabled = false;
  gameLoop();
});

pauseButton.addEventListener('click', () => {
  if (!gameRunning) return;
  gameRunning = !gameRunning;
  pauseButton.textContent = gameRunning ? 'Pause' : 'Resume';
  if (gameRunning) gameLoop();
});

startButton.disabled = true;
pauseButton.disabled = true;

let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', e => {
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', e => {
  if (!gameRunning) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) return;
  
  let newDirection = {...direction};
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0 && direction.x === 0) {
      newDirection = {x: 1, y: 0};
    } else if (deltaX < 0 && direction.x === 0) {
      newDirection = {x: -1, y: 0};
    }
  } else {
    if (deltaY > 0 && direction.y === 0) {
      newDirection = {x: 0, y: 1};
    } else if (deltaY < 0 && direction.y === 0) {
      newDirection = {x: 0, y: -1};
    }
  }
  
  if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
    gameStarted = true;
  }
  direction = newDirection;
});

const dPadButtons = document.querySelectorAll('.d-pad button');
dPadButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!gameRunning) return;
    
    let newDirection = {...direction};
    switch (button.className) {
      case 'up':
        if (direction.y === 0) newDirection = {x: 0, y: -1};
        break;
      case 'down':
        if (direction.y === 0) newDirection = {x: 0, y: 1};
        break;
      case 'left':
        if (direction.x === 0) newDirection = {x: -1, y: 0};
        break;
      case 'right':
        if (direction.x === 0) newDirection = {x: 1, y: 0};
        break;
    }
    
    if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
      gameStarted = true;
    }
    direction = newDirection;
  });
});

document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;
  
  let newDirection = {...direction};
  switch (e.key) {
    case 'ArrowUp':
      if (direction.y === 0) newDirection = {x: 0, y: -1};
      break;
    case 'ArrowDown':
      if (direction.y === 0) newDirection = {x: 0, y: 1};
      break;
    case 'ArrowLeft':
      if (direction.x === 0) newDirection = {x: -1, y: 0};
      break;
    case 'ArrowRight':
      if (direction.x === 0) newDirection = {x: 1, y: 0};
      break;
  }
  
  if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
    gameStarted = true;
  }
  direction = newDirection;
});

canvas.width = tileCount * gridSize;
canvas.height = tileCount * gridSize;