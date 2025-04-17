export function checkCircleRectCollision(circle, rect) {
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
