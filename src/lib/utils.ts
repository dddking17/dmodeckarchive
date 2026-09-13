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

/**
 * "듀크몬 크림존모드*(각성)" 같은 이름에서 "*"를 기준으로 나눔.
 * "*" 뒤쪽(예: "(각성)")은 강조 표시용으로 별도 렌더링합니다.
 */
export function splitAwakenName(name: string): { base: string; tag: string | null } {
  const idx = name.indexOf("*");
  if (idx === -1) return { base: name, tag: null };
  return { base: name.slice(0, idx), tag: name.slice(idx + 1) };
}
