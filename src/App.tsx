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
 * 主导航只写拉丁词：三个词各自指明一种观察尺度。
 */
const TABS: { id: Tab; label: string }[] = [
  { id: 'atlas', label: 'MACRO' },
  { id: 'walk', label: 'MICRO' },
  { id: 'table', label: 'INDEX' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('atlas');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="topbar">
        <nav aria-label="Primary navigation">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              aria-current={tab === t.id ? 'page' : undefined}
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
