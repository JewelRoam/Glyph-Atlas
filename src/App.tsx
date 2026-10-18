import { useState } from 'react';
import { AtlasGraph } from './components/AtlasGraph';
import { WalkView } from './components/WalkView';
import { TableView } from './components/TableView';
import { DetailPanel } from './components/DetailPanel';
import {
  graphSystems,
  independentSystems,
  lineages,
  livingSystems,
} from './data';
import './App.css';

type Tab = 'atlas' | 'walk' | 'table';

/**
 * 主导航只写拉丁词：三个词各自指明一种观察尺度，中文名保留在
 * aria-label / title 里，屏幕阅读器与悬停提示仍然是中文。
 */
const TABS: { id: Tab; label: string; name: string }[] = [
  { id: 'atlas', label: 'Macro', name: '演化图谱' },
  { id: 'walk', label: 'Micro', name: '时间街景' },
  { id: 'table', label: 'Index', name: '文字总表' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('atlas');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="topbar">
        <nav aria-label="主导航">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              aria-current={tab === t.id ? 'page' : undefined}
              aria-label={t.name}
              title={t.name}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="stats">
          <div>
            <b>{graphSystems.length}</b>
            <span>书写体系</span>
          </div>
          <div>
            <b>{independentSystems.length}</b>
            <span>独立起源</span>
          </div>
          <div>
            <b>{livingSystems.length}</b>
            <span>今仍使用</span>
          </div>
          <div>
            <b>{lineages.length}</b>
            <span>血统轨道</span>
          </div>
        </div>
      </header>

      <main>
        {tab === 'atlas' && (
          <div className="atlas-layout">
            <AtlasGraph selected={selected} onSelect={setSelected} />
            <DetailPanel id={selected} onSelect={setSelected} />
          </div>
        )}
        {tab === 'walk' && <WalkView />}
        {tab === 'table' && <TableView />}
      </main>
    </div>
  );
}
