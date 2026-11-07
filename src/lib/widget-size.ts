export function clampWidgetSize(width: number, height: number, viewportWidth: number, viewportHeight: number) {
  const maxWidth = Math.max(1, viewportWidth - 24);
  const maxHeight = Math.max(1, viewportHeight - 48);
  return { width: Math.min(maxWidth, Math.max(Math.min(320, maxWidth), width)), height: Math.min(maxHeight, Math.max(Math.min(420, maxHeight), height)) };
}