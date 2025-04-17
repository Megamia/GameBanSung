import { player, createPlayer } from "../entities/player.js";

import { obstacles } from "../entities/obstacles.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "start"; // "start", "playing", "gameOver"
let countdown = 3;
let countdownInterval;

// Start butt
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

// Bot configuration
const botConfig = {
  size: 15,
  color: "red",
  hp: 3,
  speed: 3,
};

// Boss configuration
const bossConfig = {
  speed: 2,
  hp: 100000,
  size: 40,
  color: "purple",
};

const bosses = [];
let bossActive = false;
let autoShootInterval;
const bots = [];
const numBots = 5;
const weaponTypes = ["5hp", "slow", "spread"]; // Các loại vũ khí
const weapon = {
  x: 0,
  y: 0,
  size: 20,
  type: "",
}; // Đối tượng vũ khí
let weaponSelectWindow = false;
let botsActive = false;

// Power-ups
const powerUps = [];
const powerUpTypes = ["unDead", "speedBoost", "moreBullet"];
let powerUpInterval;

function createPowerUp() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 20,
    type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
  };
}
let selectedWeapon = null;
let selectedWeaponIndex = null;
const weapons = [];
function createBot() {
  return Object.assign({}, botConfig, {
    x: Math.random() * (canvas.width - botConfig.size) + botConfig.size / 2,
    y: Math.random() * (canvas.height - botConfig.size) + botConfig.size / 2,
    size: botConfig.size,
    color: botConfig.color,
    hp: botConfig.hp,
  });
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
  const now = Date.now();

  if (now - player.lastShotTime >= player.fireCooldown) {
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let normalizedDx = dx / distance;
    let normalizedDy = dy / distance;

    if (player.weapon === "normal") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * player.bulletSpeed,
        dy: normalizedDy * player.bulletSpeed,
        width: player.bulletWidth,
        height: player.bulletHeight,
        color: "red",
        damage: 1,
      });
    } else if (player.weapon === "5hp") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * player.bulletSpeed,
        dy: normalizedDy * player.bulletSpeed,
        width: player.bulletWidth,
        height: player.bulletHeight,
        color: "green",
        damage: 5,
      });
    } else if (player.weapon === "slow") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * (player.bulletSpeed / 2),
        dy: normalizedDy * (player.bulletSpeed / 2),
        width: player.bulletWidth,
        height: player.bulletHeight,
        color: "blue",
        slow: true,
        damage: 1,
      });
    } else if (player.weapon === "spread") {
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(dy, dx) + (i * Math.PI) / 12;
        const spreadDx = Math.cos(angle);
        const spreadDy = Math.sin(angle);
        player.bullets.push({
          x: player.x,
          y: player.y,
          dx: spreadDx * (player.bulletSpeed / 2),
          dy: spreadDy * (player.bulletSpeed / 2),
          width: player.bulletWidth,
          height: player.bulletHeight,
          color: "yellow",
          damage: 2,
        });
      }
    }

    player.lastShotTime = now;
  }
}

function checkCollision(rect1, rect2) {
  //check collision between 2 rectangle
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

function checkCircleRectCollision(circle, rect) {
  //check collision between circle and rectangle
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
  if (weaponSelectWindow) return;
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
        const moveX = (dx / distance) * (bot.speed || botConfig.speed);
        const moveY = (dy / distance) * (bot.speed || botConfig.speed);

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
            { dx: 0, dy: botConfig.speed }, // trượt xuống
            { dx: 0, dy: -botConfig.speed }, // trượt lên
            { dx: botConfig.speed, dy: 0 }, // trượt phải
            { dx: -botConfig.speed, dy: 0 }, // trượt trái
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
  if (bossActive) {
    // Di chuyển boss (tránh va chạm vật cản và boss khác)
    bosses.forEach((boss) => {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const moveX = (dx / distance) * bossConfig.speed;
        const moveY = (dy / distance) * bossConfig.speed;

        let newX = boss.x + moveX;
        let newY = boss.y + moveY;

        let collidedX = false;
        let collidedY = false;

        // Kiểm tra va chạm trục X và Y với các vật cản
        for (const obs of obstacles) {
          if (
            checkCircleRectCollision(
              { x: newX, y: boss.y, size: boss.size },
              obs
            )
          )
            collidedX = true;
          if (
            checkCircleRectCollision(
              { x: boss.x, y: newY, size: boss.size },
              obs
            )
          )
            collidedY = true;
        }

        if (!collidedX && !collidedY) {
          boss.x = newX;
          boss.y = newY;
        } else if (!collidedX) {
          boss.x = newX;
        } else if (!collidedY) {
          boss.y = newY;
        } else {
          // Nếu bị chặn hoàn toàn, thử trượt theo các hướng phụ
          const slideOffsets = [
            { dx: 0, dy: bossConfig.speed }, // trượt xuống
            { dx: 0, dy: -bossConfig.speed }, // trượt lên
            { dx: bossConfig.speed, dy: 0 }, // trượt phải
            { dx: -bossConfig.speed, dy: 0 }, // trượt trái
          ];

          let moved = false;

          for (const offset of slideOffsets) {
            const testX = boss.x + offset.dx;
            const testY = boss.y + offset.dy;
            let blocked = false;

            for (const obs of obstacles) {
              if (
                checkCircleRectCollision(
                  { x: testX, y: testY, size: boss.size },
                  obs
                )
              ) {
                blocked = true;
                break;
              }
            }

            if (!blocked) {
              boss.x = testX;
              boss.y = testY;
              moved = true;
              break;
            }
          }
        }
      }
    });
  }

  // Cập nhật đạn và xử lý va chạm với bot và vật cản
  player.bullets.forEach((bullet, bulletIndex) => {
    if (gameState === "playing") {
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
        bots.forEach((currentBot, botIndex) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - currentBot.x, 2) +
              Math.pow(bullet.y - currentBot.y, 2)
          );
          if (dist < currentBot.size / 2) {
            currentBot.hp -= bullet.damage || 1;
            player.bullets.splice(bulletIndex, 1);
            if (bullet.slow) {
              currentBot.speed = 1;
              currentBot.color = "#56C6E6";
            }

            if (currentBot.hp <= 0) {
              bots.splice(botIndex, 1);
              player.score += 10;
              if (player.score % 100 === 0) {
                bossActive = true;
                bosses.push({
                  x:
                    Math.random() * (canvas.width - bossConfig.size) +
                    bossConfig.size / 2,
                  y:
                    Math.random() * (canvas.height - bossConfig.size) +
                    bossConfig.size / 2,
                  size: bossConfig.size,
                  color: bossConfig.color,
                  speed: bossConfig.speed, // Add speed property
                  hp: 10,
                });
              } else {
                bots.push(createBot());
              }
            }
          }
        });

        // Kiểm tra va chạm với boss
        bosses.forEach((currentBoss, bossIndex) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - currentBoss.x, 2) +
              Math.pow(bullet.y - currentBoss.y, 2)
          );
          if (dist < currentBoss.size / 2) {
            currentBoss.hp -= bullet.damage || 1;
            player.bullets.splice(bulletIndex, 1);
            if (bullet.slow) {
              currentBoss.speed = 1;
              currentBoss.color = "#56C6E6";
            }
            if (currentBoss.hp <= 0) {
              bosses.splice(bossIndex, 1);
              player.score += 100;
              // Mở cửa sổ chọn vũ khí
              weapons.length = 0; // Xóa các vũ khí cũ
              weapons.push({ type: "5hp" }); // Thêm vũ khí mới
              weapons.push({ type: "slow" });
              weapons.push({ type: "spread" });
              weaponSelectWindow = true;
              player.weaponSelect = true;
              clearInterval(autoShootInterval);
              autoShootInterval = null;
              bossActive = false;
            }
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
          clearInterval(autoShootInterval); // Dừng auto shoot nếu có
          autoShootInterval = null;
          alert("Điểm của bạn: " + player.score);
          resetGame();
        } else {
          // Nếu còn mạng, xóa bot và tạo bot mới
          bots.splice(botIndex, 1);
          player.score += 10; // Cộng điểm cho player
          bots.push(createBot()); // Thêm bot mới
        }
      }
    }
  });

  // Kiểm tra va chạm giữa player và bot
  bosses.forEach((currentBoss, bossIndex) => {
    const dist = Math.sqrt(
      Math.pow(player.x - currentBoss.x, 2) +
        Math.pow(player.y - currentBoss.y, 2)
    );
    if (dist < player.size / 2 + currentBoss.size / 2) {
      if (!player.isUndead) {
        player.lives--; // Giảm số mạng của người chơi
        if (player.lives <= 0) {
          gameState = "gameOver";
          clearInterval(autoShootInterval);
          autoShootInterval = null;
          alert("Điểm của bạn: " + player.score);
          resetGame();
        } else {
          bosses.splice(bossIndex, 1);
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
  // Power-ups collection
  powerUps.forEach((powerUp, index) => {
    const dist = Math.sqrt(
      Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)
    );
    if (dist < player.size / 2 + powerUp.size / 2) {
      // Check if the power-up type already exists in activePowerUps
      const existingPowerUpIndex = player.activePowerUps.findIndex(
        (pu) => pu.type === powerUp.type
      );

      if (existingPowerUpIndex !== -1) {
        // If the power-up type exists, reset its timer
        player.activePowerUps[existingPowerUpIndex].timer = 0;
      } else {
        // If the power-up type doesn't exist, add it to the active list
        player.activePowerUps.push({
          type: powerUp.type,
          timer: 0,
          duration: 300, // seconds
        });

        // Apply immediate effect
        if (powerUp.type === "speedBoost") {
          player.speed += 2;
        } else if (powerUp.type === "moreBullet") {
          player.fireCooldown = 100;
        } else if (powerUp.type === "unDead") {
          player.isUndead = true;
        }
      }

      powerUps.splice(index, 1); // Remove collected power-up
    }
  });

  if (selectedWeapon) {
    if (player.weaponSelect) {
      player.weaponSelect = false;
    }
  }

  if (selectedWeapon) {
    player.weapon = selectedWeapon;
    player.weaponDuration += 1 / 60;
    if (player.weaponDuration >= 10) {
      player.weapon = "normal";
      player.weaponDuration = 0;
      selectedWeapon = null;
    }
  }

  // Power-up timer update and effect removal
  player.activePowerUps = player.activePowerUps.filter((pu) => {
    pu.timer += 1 / 60;

    // Increase timer by 1 frame (assuming 60 FPS)

    if (pu.timer >= pu.duration) {
      // Revert the effect when time is up
      if (pu.type === "speedBoost") {
        player.speed -= 2;
      } else if (pu.type === "moreBullet") {
        player.fireCooldown = 500;
      } else if (pu.type === "unDead") {
        player.isUndead = false;
      }

      return false; // Remove the expired power-up
    }

    return true; // Keep the power-up active
  });
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

  // Draw score
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + player.score, 100, 30);

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
  // Draw weapons

  // Draw weapon select window
  if (weaponSelectWindow && weapons.length > 0) {
    const weaponButtonWidth = 80;
    const weaponButtonHeight = 30;
    const weaponButtonSpacing = 10;
    const startX =
      canvas.width / 2 -
      (weaponButtonWidth * weapons.length +
        weaponButtonSpacing * (weapons.length - 1)) /
        2;
    const startY = canvas.height / 2 + 40;
    weapons.forEach((weapon, index) => {
      const buttonX =
        startX + index * (weaponButtonWidth + weaponButtonSpacing);
      const buttonY = startY;
      ctx.fillStyle = "orange";
      ctx.fillRect(buttonX, buttonY, weaponButtonWidth, weaponButtonHeight);
      ctx.fillStyle = "black";
      ctx.font = "15px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        weapon.type,
        buttonX + weaponButtonWidth / 2,
        buttonY + weaponButtonHeight / 2 + 5
      );
      canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (
          mouseX >= buttonX &&
          mouseX <= buttonX + weaponButtonWidth &&
          mouseY >= buttonY &&
          mouseY <= buttonY + weaponButtonHeight
        ) {
          selectedWeapon = weapon.type;
          weaponSelectWindow = false;
          player.speed = 5;
          botsActive = true;
          autoShootInterval = setInterval(shoot, 100);
        }
      });
    });
  }

  let barY = 100; // Starting Y position for the first bar
  const barHeight = 10;
  const barWidth = 100;
  const barSpacing = 15; // Space between bars

  for (const pu of player.activePowerUps) {
    // Draw background bar (empty)
    ctx.fillStyle = "white";
    ctx.fillRect(250, barY, barWidth, barHeight);

    // Draw power-up progress bar (filled)
    ctx.fillStyle = "green";
    const currentBarWidth = (pu.timer / pu.duration) * barWidth;
    ctx.fillRect(250, barY, currentBarWidth, barHeight);

    // Draw power-up type text, adjust to center vertically with the bar
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "start";
    ctx.fillText(pu.type, 100, barY + barHeight / 2 + 7); // Center text vertically

    barY += barHeight + barSpacing; // Move to the next Y position for the next bar
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

  // Draw bosses
  bosses.forEach((currentBoss) => {
    ctx.fillStyle = currentBoss.color;
    ctx.beginPath();
    ctx.arc(currentBoss.x, currentBoss.y, currentBoss.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw score
}
function resetGame() {
  // Reset player state
  player.isUndead = false;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.lives = 3;
  player.score = 0;
  player.bullets = [];
  player.activePowerUps = [];
  gameState = "start";
  startButton.style.display = "block";
  player.weaponSelect = false;
  bossActive = false;
  weapons.length = 0;
  powerUps.length = 0;
  clearInterval(powerUpInterval);
  powerUpInterval = null;
  player.speed = 5;
  bosses.length = 0;

  selectedWeaponIndex = null;
  weaponSelectWindow = false;
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
  countdown = 3;
  clearInterval(countdownInterval);
  countdownInterval = null;
}

function startGame() {
  player.isUndead = true;
  gameState = "playing";
  countdown = 3; // Reset countdown
  botsActive = false;
  startButton.style.display = "none"; // Ẩn nút start khi game bắt đầu
  player.speed = 0; // dừng player
  player.activePowerUps = [];

  // Tạo countdown, sau khi countdown về 0 thì bắt đầu spawn bot
  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdown = 0;
      player.speed = 5;
      botsActive = true; // Bắt đầu cho phép bot xuất hiện
      for (let i = 0; i < numBots; i++) {
        bossActive = false;
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
