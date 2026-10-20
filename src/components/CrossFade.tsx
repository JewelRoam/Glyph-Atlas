import { useEffect, useState, type ReactNode } from 'react';

/**
 * 交叉淡变：内容换掉时，上一份留在原位当底，新的一份盖在上面淡入。
 *
 * 直接按 key 重挂一层，旧内容会先消失、新内容再淡入，中间空一拍，读起来
 * 就是一次硬切。这里把上一份内容留成底层，等新的淡入盖满再撤：整个过程中
 * 底下始终是完整可读的旧内容，两层叠出真正的交叉淡变。
 *
 * `token` 必须完整决定 children 的内容。同一段里父级重渲染时底层不跟着变，
 * 所以底层只要在换段的那一刻捕一次。
 */
const FADE_MS = 320;
/** 新的一份等一拍再上：先让旧的淡大半，两层叠着的糊字窗口就短 */
const FADE_DELAY = 90;
/** 撤底层时多等一点，保证淡入已经走完，撤的时候不会露出一条缝 */
const HOLD_MS = FADE_MS + FADE_DELAY + 60;

type Layer = { token: string; node: ReactNode };

export function CrossFade({
  token,
  className,
  children,
}: {
  /** 内容的分段标识。只有它变了才会触发一次交叉淡变 */
  token: string;
  /** 挂在内外两层上的类名：排版样式由调用方给，两层用同一套 */
  className?: string;
  children: ReactNode;
}) {
  const [current, setCurrent] = useState<Layer>({ token, node: children });
  const [stale, setStale] = useState<Layer | null>(null);

  // 换段：上一段的内容留成底层。这里是 React 文档里那条"props 变了就顺手调
  // 一次自己的 state"的写法——它在渲染期就完成重算并立刻重渲染，浏览器还没
  // 画第一帧，所以不会先闪一下新内容再补动画。
  if (current.token !== token) {
    setStale(current);
    setCurrent({ token, node: children });
  }

  /** 新的淡入走完，撤掉底层。换段太快时以后一次为准 */
  useEffect(() => {
    if (!stale) return;
    const timer = window.setTimeout(() => setStale(null), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [stale]);

  return (
    <div className="xfade">
      {stale && (
        <div className={`xfade-stale ${className ?? ''}`} aria-hidden="true">
          {stale.node}
        </div>
      )}
      <div className={`xfade-live ${className ?? ''}`} key={token}>
        {children}
      </div>
    </div>
  );
}
