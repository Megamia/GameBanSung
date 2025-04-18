import { canvas } from "../engine/canvas.js";

export const botConfig = {
  size: 15,
  color: "red",
  hp: 5,
  speed: 2,
};

export function createBot() {
  return Object.assign({}, botConfig, {
    x: Math.random() * (canvas.width - botConfig.size) + botConfig.size / 2,
    y: Math.random() * (canvas.height - botConfig.size) + botConfig.size / 2,
    size: botConfig.size,
    color: botConfig.color,
    hp: botConfig.hp,
  });
}
