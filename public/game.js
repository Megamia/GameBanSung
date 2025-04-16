const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let gameState = "start"; // "start", "playing", "gameOver"
let countdown = 5;
let countdownInterval;

// Start button
const startButton = document.createElement("button");

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Player
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  speed: 5,
  color: "blue",
  bullets: [],
  bulletSpeed: 10,
  bulletWidth: 5, // Increased bullet width
  bulletHeight: 20,
  canShoot: true,
  isGameOver: false,
  score: 0,
  lives: 3,
  powerUp: null,
  powerUpDuration: 0,
  powerUpTimer: 0,
};

// Obstacles
const obstacles = [
  { x: 200, y: 200, width: 100, height: 20, color: "gray" },
  { x: 400, y: 300, width: 20, height: 150, color: "gray" },
  { x: 600, y: 100, width: 150, height: 20, color: "gray" },
  { x: 700, y: 400, width: 20, height: 100, color: "gray" },
  { x: 100, y: 500, width: 100, height: 20, color: "gray" },
];

let autoShootInterval;

// Bots
const bots = [];
const numBots = 5;
const botSpeed = 2;
let botsActive = false;

// Power-ups
const powerUps = [];
const powerUpTypes = ["undead", "speedBoost", "moreBullet"];
let powerUpInterval;

function createPowerUp() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 20,
    type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
  };
}

function createBot() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 15,
    color: "red",
  };
}

// Movement
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Update mouse position
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function shoot() {
  if (player.canShoot) {
    // Calculate direction towards the mouse
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let normalizedDx = dx / distance;
    let normalizedDy = dy / distance;

    // Adjust bullet starting position to be at the center of the player circle
    const startX = player.x;
    const startY = player.y;

    // Create bullet
    player.bullets.push({
      x: startX,
      y: startY,
      dx: normalizedDx * player.bulletSpeed, // Use normalized values for direction
      dy: normalizedDy * player.bulletSpeed, // Use normalized values for direction
      width: player.bulletWidth,
      height: player.bulletHeight,
      color: "red",
    });

    player.canShoot = false; // Tắt khả năng bắn
    setTimeout(() => {
      player.canShoot = true;
    }, 100);
  }
}

function checkCollision(rect1, rect2) {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

function checkCircleRectCollision(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.width / 2);
  const distY = Math.abs(circle.y - rect.y - rect.height / 2);
  if (
    distX > rect.width / 2 + circle.size / 2 ||
    distY > rect.height / 2 + circle.size / 2
  )
    return false;
  if (distX <= rect.width / 2 || distY <= rect.height / 2) return true;
  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return dx * dx + dy * dy <= (circle.size / 2) * (circle.size / 2);
}

function update() {
  // Lưu vị trí gốc của player
  let tempX = player.x;
  let tempY = player.y;

  // Di chuyển theo trục X
  if (keys["a"] || keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["d"] || keys["ArrowRight"]) player.x += player.speed;

  // Giới hạn trong canvas
  player.x = Math.max(
    player.size / 2,
    Math.min(canvas.width - player.size / 2, player.x)
  );

  // Kiểm tra va chạm trục X
  for (const obstacle of obstacles) {
    if (
      checkCircleRectCollision(
        { x: player.x, y: tempY, size: player.size },
        obstacle
      )
    ) {
      player.x = tempX;
      break;
    }
  }

  // Di chuyển theo trục Y
  if (keys["w"] || keys["ArrowUp"]) player.y -= player.speed;
  if (keys["s"] || keys["ArrowDown"]) player.y += player.speed;

  // Giới hạn trong canvas
  player.y = Math.max(
    player.size / 2,
    Math.min(canvas.height - player.size / 2, player.y)
  );

  // Kiểm tra va chạm trục Y
  let collidedY = false;
  for (const obstacle of obstacles) {
    if (
      checkCircleRectCollision(
        { x: player.x, y: player.y, size: player.size },
        obstacle
      )
    ) {
      player.y = tempY;
      collidedY = true;
      break;
    }
  }

  // Auto shoot chỉ khi không va chạm
  if (gameState === "playing") {
    if (!autoShootInterval) {
      autoShootInterval = setInterval(shoot, 100); // Bắn liên tục
    }
  }
  if (botsActive) {
    // Di chuyển bot (tránh va chạm vật cản và bot khác)
    bots.forEach((bot) => {
      let dx = player.x - bot.x;
      let dy = player.y - bot.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const moveX = (dx / distance) * botSpeed;
        const moveY = (dy / distance) * botSpeed;

        let newX = bot.x + moveX;
        let newY = bot.y + moveY;

        let collidedX = false;
        let collidedY = false;

        // Kiểm tra va chạm trục X và Y với các vật cản
        for (const obs of obstacles) {
          if (
            checkCircleRectCollision({ x: newX, y: bot.y, size: bot.size }, obs)
          )
            collidedX = true;
          if (
            checkCircleRectCollision({ x: bot.x, y: newY, size: bot.size }, obs)
          )
            collidedY = true;
        }

        if (!collidedX && !collidedY) {
          bot.x = newX;
          bot.y = newY;
        } else if (!collidedX) {
          bot.x = newX;
        } else if (!collidedY) {
          bot.y = newY;
        } else {
          // Nếu bị chặn hoàn toàn, thử trượt theo các hướng phụ
          const slideOffsets = [
            { dx: 0, dy: botSpeed }, // trượt xuống
            { dx: 0, dy: -botSpeed }, // trượt lên
            { dx: botSpeed, dy: 0 }, // trượt phải
            { dx: -botSpeed, dy: 0 }, // trượt trái
          ];

          let moved = false;

          for (const offset of slideOffsets) {
            const testX = bot.x + offset.dx;
            const testY = bot.y + offset.dy;
            let blocked = false;

            for (const obs of obstacles) {
              if (
                checkCircleRectCollision(
                  { x: testX, y: testY, size: bot.size },
                  obs
                )
              ) {
                blocked = true;
                break;
              }
            }

            if (!blocked) {
              bot.x = testX;
              bot.y = testY;
              moved = true;
              break;
            }
          }

          // Nếu vẫn bị kẹt hoàn toàn, lắc nhẹ để tìm đường
          if (!moved) {
            bot.x += (Math.random() - 0.5) * 2;
            bot.y += (Math.random() - 0.5) * 2;
          }
        }
      }
    });
  }

  // Cập nhật đạn và xử lý va chạm với bot và vật cản
  player.bullets.forEach((bullet, bulletIndex) => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    // Loại bỏ đạn ra ngoài màn hình
    if (
      bullet.x < 0 ||
      bullet.x > canvas.width ||
      bullet.y < 0 ||
      bullet.y > canvas.height
    ) {
      player.bullets.splice(bulletIndex, 1);
    } else {
      // Kiểm tra va chạm với bot
      bots.forEach((bot, botIndex) => {
        const dist = Math.sqrt(
          Math.pow(bullet.x - bot.x, 2) + Math.pow(bullet.y - bot.y, 2)
        );
        if (dist < bot.size / 2) {
          // Bot bị bắn
          bots.splice(botIndex, 1);
          player.score += 10; // Cộng điểm cho player
          bots.push(createBot()); // Thêm bot mới
          player.bullets.splice(bulletIndex, 1); // Xóa đạn sau khi bắn trúng
        }
      });

      // Kiểm tra va chạm đạn với vật cản
      for (const obstacle of obstacles) {
        if (checkCollision(bullet, obstacle)) {
          player.bullets.splice(bulletIndex, 1); // Xóa đạn khi va chạm vật cản
          return;
        }
      }
    }
  });

  // Kiểm tra va chạm giữa player và bot
  bots.forEach((bot, botIndex) => {
    const dist = Math.sqrt(
      Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2)
    );

    if (dist < player.size / 2 + bot.size / 2) {
      if (!player.isUndead) {
        // Nếu không phải undead mới trừ mạng
        player.lives--; // Giảm số mạng của người chơi

        if (player.lives <= 0) {
          gameState = "gameOver"; // Đặt trạng thái game là "gameOver"
          player.isGameOver = true; // Đánh dấu là game over
          clearInterval(autoShootInterval); // Dừng auto shoot nếu có
          autoShootInterval = null;
          alert("Điểm của bạn: " + player.score);
          resetGame();
        } else {
          // Nếu còn mạng, xóa bot và tạo bot mới
          bots.splice(botIndex, 1);
          bots.push(createBot());
        }
      }
    }
  });

  // Power-up logic
  if (gameState === "playing" && !countdown) {
    if (!powerUpInterval) {
      powerUpInterval = setInterval(() => {
        if (gameState === "playing") {
          powerUps.push(createPowerUp());
        }
      }, 1000);
    }
  }

  // Check for player collision with power-ups
  powerUps.forEach((powerUp, index) => {
    const dist = Math.sqrt(
      Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)
    );
    if (dist < player.size / 2 + powerUp.size / 2) {
      // Player collected power-up
      player.powerUp = powerUp.type;
      player.powerUpDuration = 3; // Set duration to 3 seconds
      player.powerUpTimer = 0;
      if (powerUp.type === "undead") {
        player.lives;
        player.isUndead = true;
      } else if (powerUp.type === "speedBoost") {
        player.speed += 2;
      } else if (powerUp.type === "moreBullet") {
        player.canShoot = false;
      }

      // console.log("player.powerUp: ", player.powerUp);

      powerUps.splice(index, 1); // Remove power-up
    }
  });

  // Update power-up timer
  if (player.powerUpDuration > 0) {
    player.powerUpTimer += 1 / 60; // Assuming 60 FPS
    if (player.powerUpTimer >= player.powerUpDuration) {
      if (player.powerUp === "speedBoost") {
        player.speed -= 2; // Revert speed boost
      } else if (player.powerUp === "rapidFire") {
        player.canShoot = true;
      }
      player.powerUp = null;
      player.powerUpDuration = 0;
      player.powerUpTimer = 0;
      player.isUndead = false;

      console.log("player.powerUp: ", player.powerUp);

      powerUps.splice(index, 1); // Remove power-up
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw obstacles
  obstacles.forEach((obstacle) => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  // Draw player
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw player's lives
  ctx.fillStyle = "white";
  ctx.fillText("Lives: " + player.lives, 100, 60);

  // Draw power-ups
  powerUps.forEach((powerUp) => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    if (powerUp.type === "unDead") {
      ctx.fillText("UD", powerUp.x, powerUp.y + 3); 
    } else if (powerUp.type === "speedBoost") {
      ctx.fillText("SB", powerUp.x, powerUp.y + 3);
    } else if (powerUp.type === "moreBullet")
      ctx.fillText("MB", powerUp.x, powerUp.y + 3);
  });

  // Draw power-up duration bar
  if (player.powerUpDuration > 0) {
    ctx.fillStyle = "white";
    ctx.fillRect(200, 40, 100, 10);
    ctx.fillStyle = "green";
    const barWidth = (player.powerUpTimer / player.powerUpDuration) * 100;
    ctx.fillRect(200, 40, barWidth, 10);
    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.fillText(player.powerUp, 100, 35);
  }

  // Hiển thị countdown khi trò chơi đang ở trạng thái 'start' hoặc 'playing'
  if (gameState === "start" || (gameState === "playing" && countdown > 0)) {
    ctx.font = "200px Arial";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2 + 50);
  }

  player.bullets.forEach((bullet) => {
    ctx.save();

    ctx.translate(bullet.x, bullet.y);

    // Tính góc và xoay thêm 90 độ để đạn thẳng hướng (vì đạn dài theo trục y)
    const angle = Math.atan2(bullet.dy, bullet.dx);
    ctx.rotate(angle + Math.PI / 2); // ⬅️ xoay thêm 90 độ

    ctx.fillStyle = bullet.color;
    ctx.fillRect(
      -bullet.width / 2,
      -bullet.height / 2,
      bullet.width,
      bullet.height
    );

    ctx.restore();
  });

  // Draw bots
  bots.forEach((bot) => {
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw score
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + player.score, 100, 30);
}
function resetGame() {
  // Reset player state
  player.isUndead = false;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.lives = 3;
  player.score = 0;
  player.isGameOver = false;
  player.bullets = [];
  gameState = "start";
  startButton.style.display = "block";
  powerUps.length = 0;
  clearInterval(powerUpInterval);
  powerUpInterval = null;
  player.speed = 5;

  botsActive = false;

  // Reset bots
  bots.length = 0; // Clear current bots
  for (let i = 0; i < numBots; i++) {
    bots.push(createBot()); // Create new bots
  }

  // Reset obstacles (if needed, else leave as is)
  // obstacles = [...original obstacles]; // Uncomment if obstacles need to be reset

  // Restart auto-shooting
  clearInterval(autoShootInterval);
  autoShootInterval = null;

  // Reset countdown
  countdown = 5;
  clearInterval(countdownInterval);
  countdownInterval = null;
}

function startGame() {
  gameState = "playing";
  countdown = 5; // Reset countdown
  botsActive = false;
  startButton.style.display = "none"; // Ẩn nút start khi game bắt đầu

  // Tạo countdown, sau khi countdown về 0 thì bắt đầu spawn bot
  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdown = 0;
      botsActive = true; // Bắt đầu cho phép bot xuất hiện
      for (let i = 0; i < numBots; i++) {
        bots.push(createBot()); // Tạo bot khi đếm ngược kết thúc
      }
    }
  }, 1000);
}

function drawStartScreen() {
  // console.log(gameState);
  ctx.fillStyle = "white";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press Start to Play", canvas.width / 2, canvas.height / 2 - 50);
}
function drawGameOverScreen() {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Game Over! Your score: " + player.score,
    canvas.width / 2,
    canvas.height / 2 - 50
  );
  ctx.fillText(
    "Press Play Again to restart",
    canvas.width / 2,
    canvas.height / 2 + 50
  );
}

function setupStartButton() {
  startButton.textContent = "Start";
  startButton.style.position = "absolute";
  startButton.style.left = "50%";
  startButton.style.top = "50%";
  startButton.style.transform = "translate(-50%, -50%)";
  startButton.style.padding = "10px 20px";
  startButton.style.fontSize = "20px";
  startButton.style.cursor = "pointer";
  startButton.style.display = "block";

  // Khi nhấn start, trò chơi bắt đầu hoặc reset lại
  startButton.addEventListener("click", () => {
    if (gameState === "start") {
      startGame(); // Bắt đầu game khi nhấn "Start"
    } else if (gameState === "gameOver") {
      resetGame(); // Reset game khi game over và nhấn start lại
      startGame();
    }
  });

  document.body.appendChild(startButton);
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "gameOver") {
    drawGameOverScreen();
    draw();
  }
  if (gameState === "playing") {
    update();
    draw();
  }
}

setupStartButton();

gameLoop();
