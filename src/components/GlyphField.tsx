import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ScriptContext } from '../data/scriptContext';
import { hasRoster, manualSharedSlotCount } from '../data/letterSlots';
import { graphRelations } from '../data/graphRelations';
import { AlphabetField } from './AlphabetField';
import { CrossFade } from './CrossFade';
import { GlyphBoard } from './GlyphBoard';

const MORPH_MS = 960;

const directTransmission = new Set(
  graphRelations
    .filter(
      (relation) => relation.kind === 'descent' || relation.kind === 'borrowing',
    )
    .map((relation) => `${relation.parent}>${relation.child}`),
);

function hasDirectTransmission(from: string, to: string): boolean {
  return (
    directTransmission.has(`${from}>${to}`) ||
    directTransmission.has(`${to}>${from}`)
  );
}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function letterSourceLink(context: ScriptContext): string | undefined {
  return context.materials.source.home;
}

function letterSourceLabel(context: ScriptContext): string {
  const source = context.materials.source;
  return source.credit ?? source.family ?? '字形来源';
}

/**
 * 节点中央的唯一字形场。
 *
 * 有完整字表的体系铺开整个字表；语素文字、未破译文字与历史书体改用代表字
 * 或授权图版。只有前后节点确实共享人工核对的槽位时，才逐字形变；其余情况
 * 只让整场内容交叉替换，绝不按图谱边或字形轮廓猜一个对应关系。
 */
export function GlyphField({
  context,
}: {
  context: ScriptContext;
}) {
  const scriptId = context.system.id;
  const canRender = context.materials.materialReady;
  const letterField = hasRoster(scriptId);
  const [fromScript, setFromScript] = useState<string | null>(null);
  const [morphT, setMorphT] = useState(1);
  const previousRef = useRef(scriptId);
  const frameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const from = previousRef.current;
    previousRef.current = scriptId;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (from === scriptId) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sharedSlots = manualSharedSlotCount(from, scriptId);
    if (
      !reducedMotion &&
      hasDirectTransmission(from, scriptId) &&
      sharedSlots > 0 &&
      hasRoster(from) &&
      hasRoster(scriptId)
    ) {
      setFromScript(from);
      setMorphT(0);
      return;
    }
    setFromScript(null);
    setMorphT(1);
  }, [scriptId]);

  useEffect(() => {
    if (!fromScript) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / MORPH_MS);
      setMorphT(easeInOutCubic(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
        return;
      }
      frameRef.current = null;
      setFromScript(null);
      setMorphT(1);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [fromScript, scriptId]);

  if (!canRender) return null;

  const field = letterField ? (
    <div className="glyph-field-letter">
      <AlphabetField
        a={fromScript ?? scriptId}
        b={scriptId}
        t={fromScript ? morphT : 1}
        showHeading={Boolean(fromScript)}
        showNote={Boolean(fromScript)}
      />
      {!fromScript && (
        <footer className="glyph-field-source">
          <span>{letterSourceLabel(context)}</span>
          {context.materials.source.license ? (
            <span>{context.materials.source.license}</span>
          ) : null}
          {letterSourceLink(context) ? (
            <a href={letterSourceLink(context)} target="_blank" rel="noreferrer">
              字形来源 ↗
            </a>
          ) : null}
        </footer>
      )}
    </div>
  ) : (
    <GlyphBoard system={context.system} />
  );

  return (
    <section
      className={`glyph-field ${letterField ? 'is-alphabet' : 'is-board'}`}
      aria-label={`${context.system.nameZh}字形`}
    >
      {fromScript ? field : <CrossFade token={scriptId}>{field}</CrossFade>}
    </section>
  );
}
