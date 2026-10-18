/**
 * public/ 下静态资源的地址。
 *
 * 站点部署在 GitHub Pages 的子目录（/Glyph-Atlas/）下，所以图版路径必须
 * 带上 Vite 的 BASE_URL，不能直接写 "/glyphs/…"。
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const clean = path.replace(/^\/+/, '');
  return base.endsWith('/') ? base + clean : `${base}/${clean}`;
}
