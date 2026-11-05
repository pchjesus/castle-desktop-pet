export function constrain(bounds, areas) {
  if (!areas.length) return bounds;
  const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2;
  const distance = a => Math.hypot(cx - Math.max(a.x, Math.min(cx, a.x + a.width)), cy - Math.max(a.y, Math.min(cy, a.y + a.height)));
  const a = areas.reduce((best, next) => distance(next) < distance(best) ? next : best);
  const width = Math.min(bounds.width, a.width), height = Math.min(bounds.height, a.height);
  return {x: Math.round(Math.max(a.x, Math.min(bounds.x, a.x + a.width - width))), y: Math.round(Math.max(a.y, Math.min(bounds.y, a.y + a.height - height))), width, height};
}
