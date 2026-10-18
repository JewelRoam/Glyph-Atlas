import { useEffect, useState } from 'react';
import { coverageOf } from '../lib/coverage';
import { fontStack, formatCodePoint, isPrivateUse, isLocalFamily, loadFont, verifyFont } from '../lib/fonts';

/**
 * 用字体渲染的字形。
 *
 * 判定顺序（宁可空着，也不画错）：
 *  1. 覆盖表（lib/coverage.ts）说"字库里没有这个字形" → 直接留空；
 *  2. 覆盖表说"有" → 立刻渲染，不再等待；
 *  3. 覆盖表里没有这个字族（老数据 / 新字族）→ 退回 document.fonts 探测，
 *     探测失败仍然留空。自托管字体的覆盖表由构建脚本生成，正常不会走到这里。
 *
 * 留空时渲染一枚写着码位的小名片，明确告诉读者"这里缺字形"，
 * 而不是让浏览器悄悄换成宋体或豆腐块。
 */
export function FontGlyph({
  char,
  fontFamily,
  size = 120,
  color,
}: {
  char?: string;
  fontFamily?: string;
  size?: number;
  color?: string;
}) {
  // 探测结果按 "字族 + 字符" 缓存；换字族或换字符时自动视为未探测，
  // 因此不需要在 effect 里同步改状态。
  const key = `${fontFamily ?? ''}\u0000${char ?? ''}`;
  const [probed, setProbed] = useState<{ key: string; ok: boolean } | null>(null);

  const coverage = coverageOf(fontFamily, char);
  const privateUse = char ? isPrivateUse(char) : true;
  const needsProbe = Boolean(char) && !privateUse && coverage === 'unknown';

  useEffect(() => {
    if (!char || privateUse) return;
    // 自托管字体的 @font-face 要显式注入；Google Fonts 只在真正要渲染时才拉样式表
    if (coverage === 'yes' || isLocalFamily(fontFamily)) {
      loadFont(fontFamily);
      return;
    }
    if (!needsProbe) return;
    let alive = true;
    verifyFont(fontFamily, char).then((ok) => {
      if (alive) setProbed({ key, ok });
    });
    return () => {
      alive = false;
    };
  }, [char, coverage, fontFamily, key, needsProbe, privateUse]);

  if (!char) return <GlyphTile char="?" size={size} />;
  if (privateUse) return <GlyphTile char={char} size={size} />;
  if (coverage === 'no') return <GlyphTile char={char} size={size} />;

  const settled = needsProbe ? (probed?.key === key ? probed.ok : null) : true;
  if (settled === false) return <GlyphTile char={char} size={size} />;

  return (
    <span
      className="font-glyph"
      style={{
        fontFamily: fontStack(fontFamily),
        fontSize: size,
        lineHeight: 1,
        color,
        // 探测期间先藏起来，免得豆腐块闪一下
        visibility: settled === null ? 'hidden' : 'visible',
      }}
    >
      {char}
    </span>
  );
}

/** 没有字形时的替代展示：一张写着码位的小名片 */
function GlyphTile({ char, size }: { char: string; size: number }) {
  const code = formatCodePoint(char).split(' ')[0].replace('U+', '');
  const showLabel = size >= 52;
  return (
    <span
      className="glyph-tile"
      style={{ width: size, height: size }}
      title={`${formatCodePoint(char)} · 字库未收这个字形`}
    >
      <span
        className="glyph-tile-code"
        style={{ fontSize: Math.max(7, Math.round(size * (showLabel ? 0.17 : 0.2))) }}
      >
        {/* 没有样本字符的记录（比如奇普）不显示码位，只留一个破折号 */}
        {char === '?' ? '—' : code}
      </span>
      {showLabel && <span className="glyph-tile-label">字库未收</span>}
    </span>
  );
}

/** 用矢量路径渲染的字形（手绘轮廓与字体提取轮廓都走这条路） */
export function PathGlyph({
  d,
  size = 120,
  color = 'currentColor',
}: {
  d: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d={d} fill={color} fillRule="nonzero" />
    </svg>
  );
}
