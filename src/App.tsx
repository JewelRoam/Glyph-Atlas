import { useCallback, useEffect, useRef, useState } from 'react';
import { AtlasGraph, type AtlasViewport } from './components/AtlasGraph';
import { CatalogOverlay } from './components/CatalogOverlay';
import { FocusView, type FocusLocation } from './components/FocusView';
import {
  graphRelationCount,
  graphSystems,
  independentSystems,
  livingSystems,
  scriptById,
} from './data';
import './App.css';

function focusFromUrl(): FocusLocation | null {
  const params = new URLSearchParams(window.location.search);
  const scriptId = params.get('script');
  if (!scriptId || !scriptById[scriptId]) return null;
  // 旧链接中的 lineage / stop 参数仍可打开对应体系；节点页只以 script 定位。
  return { scriptId };
}

function focusUrl(location: FocusLocation): string {
  const params = new URLSearchParams({ script: location.scriptId });
  return `${window.location.pathname}?${params.toString()}`;
}

function atlasUrl(): string {
  return window.location.pathname;
}

/**
 * 全站只有两层空间：演化全图，以及一个书写体系的节点页。
 * 检索是覆盖在全图上的查找层，不占第三个页面。
 */
export default function App() {
  const [focus, setFocus] = useState<FocusLocation | null>(focusFromUrl);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [atlasView, setAtlasView] = useState<AtlasViewport | null>(null);
  const catalogTriggerRef = useRef<HTMLButtonElement>(null);

  const openScript = useCallback((scriptId: string) => {
    const next: FocusLocation = { scriptId };
    window.history.pushState({ glyphAtlas: 'focus' }, '', focusUrl(next));
    setFocus(next);
  }, []);

  const returnToAtlas = useCallback(() => {
    window.history.pushState({ glyphAtlas: 'atlas' }, '', atlasUrl());
    setFocus(null);
    setCatalogOpen(false);
  }, []);

  const openCatalog = useCallback(() => setCatalogOpen(true), []);
  const closeCatalog = useCallback(() => {
    setCatalogOpen(false);
    requestAnimationFrame(() => catalogTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setFocus(focusFromUrl());
      setCatalogOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCatalogOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <header className={`topbar ${focus ? 'is-focus' : ''}`}>
        <div className="topbar-actions">
          {focus && (
            <button className="topbar-return" onClick={returnToAtlas}>
              <span aria-hidden="true">←</span>
              返回全图
            </button>
          )}
          <button
            ref={catalogTriggerRef}
            className="catalog-trigger"
            onClick={openCatalog}
            aria-haspopup="dialog"
          >
            查找馆藏
            <span className="catalog-trigger-key" aria-hidden="true">⌘ K</span>
          </button>
        </div>

        <div className="stats" aria-label="馆藏统计">
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
            <b>{graphRelationCount}</b>
            <span>演化关系</span>
          </div>
        </div>
      </header>

      <main>
        {focus ? (
          <FocusView location={focus} onOpenScript={openScript} />
        ) : (
          <div className="atlas-layout">
            <AtlasGraph
              initialView={atlasView}
              onViewChange={setAtlasView}
              onOpenScript={openScript}
            />
          </div>
        )}
      </main>

      {catalogOpen && (
        <CatalogOverlay
          onClose={closeCatalog}
          onOpenScript={(scriptId) => {
            setCatalogOpen(false);
            openScript(scriptId);
          }}
        />
      )}
    </div>
  );
}
