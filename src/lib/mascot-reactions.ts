export const GREETING = "Ready to dive in";
export function nextPoke(count: number) {
  const clicks = count + 1;
  return { clicks, cries: clicks > 3 };
}