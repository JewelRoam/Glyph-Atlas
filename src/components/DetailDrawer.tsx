import { useEffect } from 'react';
import { scriptById } from '../data';
import { ScriptDetail } from './ScriptDetail';

interface Props {
  id: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * 详情浮层 —— 只有选中了某个书写体系才出现，MACRO 与 INDEX 共用。
 *
 * 刻意不用遮罩：面板浮在内容上方，图谱节点和表格行仍然可以直接点，
 * 于是"点一个看一个"不用先关掉再打开。Esc 与右上角的 ✕ 负责关闭。
 */
export function DetailDrawer({ id, onSelect }: Props) {
  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelect(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, onSelect]);

  const system = id ? scriptById[id] : null;
  if (!system) return null;

  return (
    <div className="detail-layer">
      <aside className="detail" role="dialog" aria-label={`${system.nameZh} 详情`}>
        <button className="detail-close" onClick={() => onSelect(null)} aria-label="关闭详情">
          ✕
        </button>
        <ScriptDetail key={system.id} system={system} onSelect={onSelect} />
      </aside>
    </div>
  );
}
