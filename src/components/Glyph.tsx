import { useEffect, useState } from 'react';
import {
  fontStack,
  formatCodePoint,
  isPrivateUse,
  loadFont,
  verifyFont,
} from '../lib/fonts';

/**
 * 用字体渲染的字形。
 *
 * 三种结果：
 *  - ready   → 正常显示字符
 *  - missing → 该文字没有可用的 Web 字体（或码位落在私有区），
 *              改为渲染一枚"码位名片"，明确告诉读者这里缺字体，
 *              而不是让它变成一个豆腐块。
 *  - checking→ 探测期间隐藏，避免豆腐块一闪而过。
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

  const privateUse = char ? isPrivateUse(char) : true;

  useEffect(() => {
    if (!char || privateUse) return;
    let alive = true;
    loadFont(fontFamily);
    verifyFont(fontFamily, char).then((ok) => {
      if (alive) setProbed({ key, ok });
    });
    return () => {
      alive = false;
    };
  }, [char, fontFamily, key, privateUse]);

  if (!char) return <GlyphTile char="?" size={size} />;
  if (privateUse) return <GlyphTile char={char} size={size} />;

  const settled = probed?.key === key ? probed.ok : null;
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

/** 没有字体时的替代展示：一张写着码位的小名片 */
function GlyphTile({ char, size }: { char: string; size: number }) {
  const code = formatCodePoint(char).split(' ')[0].replace('U+', '');
  const showLabel = size >= 52;
  return (
    <span
      className="glyph-tile"
      style={{ width: size, height: size }}
      title={`${formatCodePoint(char)} · 暂无可用字体`}
    >
      <span
        className="glyph-tile-code"
        style={{ fontSize: Math.max(7, Math.round(size * (showLabel ? 0.17 : 0.2))) }}
      >
        {/* 没有样本字符的记录（比如奇普）不显示码位，只留一个破折号 */}
        {char === '?' ? '—' : code}
      </span>
      {showLabel && <span className="glyph-tile-label">无字形样本</span>}
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
