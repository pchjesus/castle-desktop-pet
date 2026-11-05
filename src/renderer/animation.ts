export function playFrames(frames: string[], duration: number, show: (frame: string) => void): () => void {
  let index = 0;
  show(frames[0]);
  if (frames.length < 2) return () => {};
  const timer = setInterval(() => { index = (index + 1) % frames.length; show(frames[index]); }, duration);
  return () => clearInterval(timer);
}
