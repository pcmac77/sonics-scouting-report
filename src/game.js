export const RIM = { x: 0, y: 3.7, z: -6.5 };
export const START = { x: 0, y: 1.05, z: 1.8 };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function evaluateSwipe(dx, dy, width, height) {
  if (![dx,dy,width,height].every(Number.isFinite) || width <= 0 || height <= 0 || dy > -35) return null;
  const x = dx / width * 5.4;
  const depth = (clamp(-dy / height, 0.08, 0.9) - 0.4) * 5;
  return { x, depth, made: Math.abs(x) < 0.48 && Math.abs(depth) < 0.62 };
}

export function shotPosition(t, shot) {
  const p = clamp(t, 0, 1);
  // End the first arc at rim height, then let the ball drop through or miss.
  return { x: START.x + (shot.x - START.x) * p,
    y: START.y + (RIM.y - START.y) * p + Math.sin(Math.PI * p) * 3.0,
    z: START.z + (RIM.z - shot.depth - START.z) * p };
}
