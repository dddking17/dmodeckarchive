export function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export function avatarColor(name: string): string {
  return `hsl(${hashHue(name)}, 60%, 46%)`;
}

export function initials(name: string): string {
  const t = (name || "?").trim();
  return t.slice(0, 2) || "?";
}
