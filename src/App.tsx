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
  writingSystems,
} from './data';
import './App.css';

type Tab = 'atlas' | 'walk' | 'table' | 'about';

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: 'atlas', label: '演化图谱', sub: 'Macro' },
  { id: 'walk', label: '时间街景', sub: 'Micro' },
  { id: 'table', label: '文字总表', sub: 'Index' },
  { id: 'about', label: '关于', sub: 'Notes' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('atlas');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            字
          </span>
          <div>
            <h1>字脉</h1>
            <div className="brand-sub">Glyph Atlas · 人类书写体系演化可视化</div>
          </div>
        </div>

        <nav aria-label="主导航">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.sub && <em>{t.sub}</em>}
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
        {tab === 'about' && <About />}
      </main>
    </div>
  );
}

function About() {
  return (
    <div className="about">
      <div className="about-inner">
        <div className="about-eyebrow">About · 字脉</div>
        <h2>人类只独立发明过几次文字，<br />其余都是这几次的后代。</h2>

        <p>
          从苏美尔的泥板到今天的拉丁字母，书写体系像一棵不断分叉的树：
          少量独立起源，无数次借用、改造与传播。字脉把这棵树画出来，
          并且让它动起来。
        </p>

        <h3>两个尺度</h3>
        <ul>
          <li>
            <strong>演化图谱（宏观）</strong>：横轴是年代，纵轴按谱系分成十二个泳道，
            节点是书写体系，连线表示"衍生自"。可以缩放、拖拽，悬停一个节点就能
            看清它的祖先与后代。当前的节点数是 {graphSystems.length}。
          </li>
          <li>
            <strong>时间街景（微观）</strong>：挑一条血统轨道，沿时间前后移动。
            中心字形在两站之间连续变形，两侧是这条街上的邻居，
            底部的站点尺可以直接跳到任意一站。当前有 {lineages.length} 条轨道。
          </li>
        </ul>

        <h3>字形是怎么变的</h3>
        <p>
          凡是有矢量轮廓的字形，都走真正的<strong>路径形变</strong>：把两端路径按弧长
          均匀采样成等量点，再逐点插值；子路径数量不一致时，用从质心长出的
          退化子路径补齐，配合 <code>fill-rule: evenodd</code>，表现为一个洞
          从无到有地张开。这正是 PPT 平滑过渡在字形上要做的事，只是这里
          由我们自己控制采样与配对。
        </p>
        <p>
          只有字符、没有轮廓的字形（绝大多数现役文字），则走
          <strong>淡变 + 缩放平移</strong>，并在身后留下下一站的残影，
          于是任何文字都能有"沿街往前走"的连续感。
        </p>

        <h3>收录范围</h3>
        <ul>
          <li>
            <strong>独立起源</strong>：苏美尔、埃及、中国、印度河、中美洲，
            以及克里特象形文字、朗格朗格文等起源仍有争议的候选体系。
            当前标注为独立起源的有 {independentSystems.length} 个。
          </li>
          <li>
            <strong>字母、音节文字与元音附标文字</strong>：沿主要谱系收录历史文字、
            现役文字、礼仪文字和未破译文字。
          </li>
          <li>
            <strong>语素文字</strong>：汉字系选甲骨文、金文、篆书、隶书、楷书、
            行草等代表阶段，并纳入假名、女书、契丹文等衍生体系。
          </li>
          <li>
            奇普（结绳）等非文字记录保存在总表中，不进入演化图，
            也不计作独立起源。
          </li>
        </ul>

        <h3>诚实的边界</h3>
        <p>
          古字形目前是<strong>示意性重构</strong>，用来演示演变机制，
          不等于古文字学意义上的精确摹本；年代是约数，学界分歧之处按主流观点取值。
          没有开源 Web 字体的文字（如线形文字 A、恩西比底文字），
          页面会显示一枚码位名片而不是假装画得出来——缺字体这件事本身，
          也是这套文字流传现状的一部分。
        </p>

        <h3>技术</h3>
        <p>
          数据是纯 TypeScript 对象（<code>src/data</code>），字形按需从开源
          Noto 字体加载，图谱用 D3 的缩放与分段的年代轴，形变引擎自行实现，
          构建产物是纯静态文件，可以直接丢到任何静态托管上。
          全部内容 {writingSystems.length} 条记录。
        </p>

        <div className="about-note">
          <p>
            数据与字形都可以复核、替换和补充；如发现问题，欢迎提 issue / PR。
          </p>
        </div>
      </div>
    </div>
  );
}
