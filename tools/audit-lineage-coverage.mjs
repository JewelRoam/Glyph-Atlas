#!/usr/bin/env node
/**
 * 血统入口覆盖率审计。
 *
 * 用法：
 *   npm run audit:coverage
 *   npm run audit:coverage -- --json
 *   npm run audit:coverage -- --strict
 *
 * 这个脚本不是构建门禁。它把“从 MACRO 任意节点进入前后演变”还缺什么
 * 列成可执行队列：哪些书写体系已有可前后行走的轨道，哪些只能以单体系
 * 打开，哪些站点还缺出处或素材登记。
 *
 * --strict 会把覆盖率不足当成失败，供未来覆盖率达标后的 CI 使用。
 */
import {
  graphChildrenByScript,
  graphConnectionBetween,
  graphRelations,
  lineages,
  scriptContextFor,
  writingSystems,
} from '../src/data/index.ts';
import {
  adjacentGraphLinks,
  adjacentStops,
  graphLinksForLineage,
  lineageEntryFor,
  stopRefFor,
} from '../src/data/lineageIndex.ts';
import { glyphSets } from '../src/data/glyphSets.ts';
import { glyphSourceFor } from '../src/data/glyphSources.ts';
import { hasLetterMap, hasRoster, rosterFor } from '../src/data/letterSlots.ts';

const json = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

const systems = writingSystems.filter((system) => system.type !== 'nonscript');
const stopRefs = lineages.flatMap((lineage) =>
  lineage.stops.map((stop, index) => ({ lineage, stop, index })),
);

const entries = systems.map((system) => {
  const entry = lineageEntryFor(system.id);
  const neighbors = entry?.track ? adjacentStops(entry.track) : {};
  const graphAdjacency = entry?.track ? adjacentGraphLinks(entry.track) : {};
  return {
    id: system.id,
    nameZh: system.nameZh,
    nameEn: system.nameEn,
    origin: system.origin,
    family: system.family,
    type: system.type,
    status: system.status,
    sourceRefs: system.sourceRefs?.length ?? 0,
    tracks: entry?.tracks.length ?? 0,
    entryMode: !entry?.track ? 'none' : system.lineageEntry ? 'explicit' : 'fallback',
    entry: entry?.track
      ? {
          lineageId: entry.track.lineage.id,
          stopId: entry.track.stop.id,
          key: entry.track.key,
          position: entry.track.index + 1,
          length: entry.track.lineage.stops.length,
        }
      : null,
    neighbors: {
      previous: neighbors.previous
        ? {
            lineageId: neighbors.previous.lineage.id,
            stopId: neighbors.previous.stop.id,
            script: neighbors.previous.stop.script,
            nameZh: neighbors.previous.stop.label ?? neighbors.previous.stop.script,
            graphStatus: graphAdjacency.previous?.status ?? null,
          }
        : null,
      next: neighbors.next
        ? {
            lineageId: neighbors.next.lineage.id,
            stopId: neighbors.next.stop.id,
            script: neighbors.next.stop.script,
            nameZh: neighbors.next.stop.label ?? neighbors.next.stop.script,
            graphStatus: graphAdjacency.next?.status ?? null,
          }
        : null,
    },
  };
});

const lineageAudits = lineages.map((lineage) => {
  const refs = lineage.stops
    .map((stop) => stopRefFor(lineage.id, stop))
    .filter(Boolean);
  const links = graphLinksForLineage(lineage);
  const adjacencies = refs.slice(0, -1).map((from) => {
    const pair = adjacentGraphLinks(from).next;
    const kind = pair?.link?.relation.kind ?? null;
    return {
      from: { stopId: from.stop.id, script: from.stop.script },
      to: pair
        ? { stopId: pair.to.stop.id, script: pair.to.stop.script }
        : null,
      status: pair?.status ?? 'unrelated',
      direction: pair?.connection.direction ?? null,
      path: pair?.connection.path
        ? pair.connection.path.steps.map(
            (step) => `${step.relation.parent}>${step.relation.child}`,
          )
        : [],
      kind,
      relation: pair?.link
        ? `${pair.link.relation.parent}>${pair.link.relation.child}`
        : null,
    };
  });
  const directAdjacencies = adjacencies.filter((item) => item.status === 'direct');
  const directDescent = directAdjacencies.filter((item) => item.kind === 'descent');
  const directOther = directAdjacencies.filter((item) => item.kind !== 'descent');
  const indirectAdjacencies = adjacencies.filter((item) => item.status === 'indirect');
  const unrelatedAdjacencies = adjacencies.filter((item) => item.status === 'unrelated');
  const reverseAdjacencies = adjacencies.filter((item) => item.direction === 'reverse');
  const mode = lineage.mode ?? 'chain';
  const chainAdjacenciesWithoutDescent =
    mode === 'chain'
      ? adjacencies.filter(
          (item) => item.status !== 'direct' || item.kind !== 'descent',
        )
      : [];
  const chainDirectOther = chainAdjacenciesWithoutDescent.filter(
    (item) => item.status === 'direct',
  );
  const chainIndirect = chainAdjacenciesWithoutDescent.filter(
    (item) => item.status === 'indirect',
  );
  const chainUnrelated = chainAdjacenciesWithoutDescent.filter(
    (item) => item.status === 'unrelated',
  );

  return {
    id: lineage.id,
    nameZh: lineage.nameZh,
    mode,
    stops: refs.length,
    graphLinks: links.length,
    directAdjacencies: directAdjacencies.length,
    directDescent: directDescent.length,
    directOther: directOther.length,
    indirectAdjacencies: indirectAdjacencies.length,
    unrelatedAdjacencies: unrelatedAdjacencies.length,
    reverseAdjacencies: reverseAdjacencies.length,
    chainAdjacenciesWithoutDescent,
    chainDirectOther,
    chainIndirect,
    chainUnrelated,
    adjacencies,
    links: links.map((link) => ({
      parent: link.relation.parent,
      child: link.relation.child,
      kind: link.relation.kind,
      evidence: link.relation.evidence,
      direction: link.direction,
      parentStop: link.parentStop.stop.id,
      childStop: link.childStop.stop.id,
      parentIndex: link.parentIndex,
      childIndex: link.childIndex,
    })),
  };
});

const lineageGraphLinkCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.graphLinks,
  0,
);
const directAdjacencyCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.directAdjacencies,
  0,
);
const directDescentAdjacencyCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.directDescent,
  0,
);
const directOtherAdjacencyCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.directOther,
  0,
);
const indirectAdjacencyCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.indirectAdjacencies,
  0,
);
const unrelatedAdjacencyCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.unrelatedAdjacencies,
  0,
);
const reverseAdjacencyCount = lineageAudits.reduce(
  (total, lineage) => total + lineage.reverseAdjacencies,
  0,
);
const chainTracksWithoutDescent = lineageAudits.filter(
  (lineage) => lineage.mode === 'chain' && lineage.chainAdjacenciesWithoutDescent.length,
);
const chainAdjacenciesWithoutDescent = chainTracksWithoutDescent.reduce(
  (total, lineage) => total + lineage.chainAdjacenciesWithoutDescent.length,
  0,
);

const linked = entries.filter((entry) => entry.entry);
const isolated = entries.filter((entry) => !entry.entry);
const withNeighbors = entries.filter(
  (entry) => entry.neighbors.previous || entry.neighbors.next,
);

const independent = entries.filter((entry) => entry.origin === 'independent');
const independentIsolated = independent.filter((entry) => !entry.entry);
const systemsWithSourceRefs = entries.filter((entry) => entry.sourceRefs > 0);
const multiTrack = entries.filter((entry) => entry.tracks > 1);
const multiTrackWithoutExplicitEntry = multiTrack.filter(
  (entry) => entry.entryMode !== 'explicit',
);
const fallbackEntries = entries.filter((entry) => entry.entryMode === 'fallback');
const linkedWithoutExplicitEntry = entries.filter((entry) => entry.entryMode === 'fallback');
const relationsByKind = Object.fromEntries(
  ['descent', 'borrowing', 'influence', 'model'].map((kind) => [
    kind,
    graphRelations.filter((relation) => relation.kind === kind).length,
  ]),
);
const sourcedRelations = graphRelations.filter((relation) => relation.evidence === 'sourced');
const pendingRelations = graphRelations.filter((relation) => relation.evidence === 'pending');
const systemsWithoutParents = systems.filter((system) => system.parents.length === 0);
const independentRoots = systemsWithoutParents.filter((system) => system.origin === 'independent');
const inventedRoots = systemsWithoutParents.filter((system) => system.origin === 'invented');

// 节点上下文是未来 MACRO 详情与 MICRO 合流时共用的读模型。这里把它与
// writingSystems.parents、轨道反向索引逐项对照，防止两套查询在界面合流后分叉。
const contextMismatches = [];
const sameIds = (left, right) =>
  left.length === right.length && left.every((id, index) => id === right[index]);
const mismatch = (id, message) => contextMismatches.push({ id, message });

for (const system of systems) {
  const context = scriptContextFor(system.id);
  if (!context) {
    mismatch(system.id, 'scriptContextFor() 没有返回节点');
    continue;
  }

  const expectedChildren = systems
    .filter((candidate) => candidate.parents.includes(system.id))
    .map((candidate) => candidate.id);
  const mappedChildren = (graphChildrenByScript.get(system.id) ?? []).map(
    (candidate) => candidate.id,
  );
  const contextChildren = context.graph.children.map((candidate) => candidate.id);
  if (!sameIds(context.graph.parents.map((candidate) => candidate.id), system.parents)) {
    mismatch(system.id, '上下文 parents 与 writingSystems.parents 不一致');
  }
  if (!sameIds(contextChildren, expectedChildren)) {
    mismatch(system.id, '上下文 children 与 writingSystems.parents 反向索引不一致');
  }
  if (!sameIds(mappedChildren, expectedChildren)) {
    mismatch(system.id, 'graphChildrenByScript 与 writingSystems.parents 不一致');
  }

  const expectedParentRelations = graphRelations.filter(
    (relation) => relation.child === system.id,
  );
  const expectedChildRelations = graphRelations.filter(
    (relation) => relation.parent === system.id,
  );
  if (
    !sameIds(
      context.graph.parentRelations.map((relation) => `${relation.parent}>${relation.child}`),
      expectedParentRelations.map((relation) => `${relation.parent}>${relation.child}`),
    )
  ) {
    mismatch(system.id, '上下文 parentRelations 与边表不一致');
  }
  if (
    !sameIds(
      context.graph.childRelations.map((relation) => `${relation.parent}>${relation.child}`),
      expectedChildRelations.map((relation) => `${relation.parent}>${relation.child}`),
    )
  ) {
    mismatch(system.id, '上下文 childRelations 与边表不一致');
  }

  const expectedAncestors = new Set();
  const visitAncestors = (id) => {
    const current = systems.find((candidate) => candidate.id === id);
    for (const parentId of current?.parents ?? []) {
      if (expectedAncestors.has(parentId)) continue;
      expectedAncestors.add(parentId);
      visitAncestors(parentId);
    }
  };
  visitAncestors(system.id);
  if (
    !sameIds(
      [...context.graph.ancestors.map((node) => node.id)].sort(),
      [...expectedAncestors].sort(),
    )
  ) {
    mismatch(system.id, '上下文 ancestors 与完整祖先遍历不一致');
  }

  const expectedDescendants = new Set();
  const visitDescendants = (id) => {
    for (const candidate of systems) {
      if (!candidate.parents.includes(id) || expectedDescendants.has(candidate.id)) continue;
      expectedDescendants.add(candidate.id);
      visitDescendants(candidate.id);
    }
  };
  visitDescendants(system.id);
  if (
    !sameIds(
      [...context.graph.descendants.map((node) => node.id)].sort(),
      [...expectedDescendants].sort(),
    )
  ) {
    mismatch(system.id, '上下文 descendants 与完整后代遍历不一致');
  }

  const pathIsChronological = (nodes) =>
    nodes.every(
      (node, index) => index === 0 || node.dateFrom >= nodes[index - 1].dateFrom,
    );

  for (const path of context.graph.ancestryPaths) {
    if (path.nodes.at(-1)?.id !== system.id) {
      mismatch(system.id, 'ancestryPaths 有一条路径未终止于当前节点');
      break;
    }
    if (path.nodes.length - 1 !== path.steps.length) {
      mismatch(system.id, 'ancestryPaths 的节点数与边数不一致');
      break;
    }
    if (path.nodes[0] && systems.find((candidate) => candidate.id === path.nodes[0].id)?.parents.length) {
      mismatch(system.id, 'ancestryPaths 有一条未从图根开始');
      break;
    }
    if (!pathIsChronological(path.nodes)) {
      mismatch(system.id, 'ancestryPaths 有一条节点年代倒退');
      break;
    }
    const brokenStep = path.steps.findIndex(
      (step, index) =>
        step.from.id !== path.nodes[index]?.id ||
        step.to.id !== path.nodes[index + 1]?.id ||
        step.relation.parent !== step.from.id ||
        step.relation.child !== step.to.id,
    );
    if (brokenStep !== -1) {
      mismatch(system.id, `ancestryPaths 第 ${brokenStep + 1} 步与节点序列不一致`);
      break;
    }
  }
  for (const path of context.graph.descendantPaths) {
    if (path.nodes[0]?.id !== system.id) {
      mismatch(system.id, 'descendantPaths 有一条路径未从当前节点开始');
      break;
    }
    if (path.nodes.length - 1 !== path.steps.length) {
      mismatch(system.id, 'descendantPaths 的节点数与边数不一致');
      break;
    }
    const lastId = path.nodes.at(-1)?.id;
    if (lastId && systems.some((candidate) => candidate.parents.includes(lastId))) {
      mismatch(system.id, 'descendantPaths 有一条未到叶节点');
      break;
    }
    if (!pathIsChronological(path.nodes)) {
      mismatch(system.id, 'descendantPaths 有一条节点年代倒退');
      break;
    }
    const brokenStep = path.steps.findIndex(
      (step, index) =>
        step.from.id !== path.nodes[index]?.id ||
        step.to.id !== path.nodes[index + 1]?.id ||
        step.relation.parent !== step.from.id ||
        step.relation.child !== step.to.id,
    );
    if (brokenStep !== -1) {
      mismatch(system.id, `descendantPaths 第 ${brokenStep + 1} 步与节点序列不一致`);
      break;
    }
  }

  const expectedEntry = lineageEntryFor(system.id);
  if (!expectedEntry?.track) {
    if (context.lineage) mismatch(system.id, '没有轨道却返回了 lineage 上下文');
    continue;
  }
  if (!context.lineage) {
    mismatch(system.id, '有轨道却没有返回 lineage 上下文');
    continue;
  }

  const { entry, previous, next, alternatives } = context.lineage;
  if (entry.key !== expectedEntry.track.key) {
    mismatch(system.id, `lineage.entry 应为 ${expectedEntry.track.key}，实际为 ${entry.key}`);
  }
  if (entry.stop.script !== system.id) {
    mismatch(system.id, `lineage.entry 指向其他体系 ${entry.stop.script}`);
  }
  const expectedNeighbors = adjacentStops(expectedEntry.track);
  if (previous?.key !== expectedNeighbors.previous?.key) {
    mismatch(system.id, 'lineage.previous 与轨道邻站不一致');
  }
  if (next?.key !== expectedNeighbors.next?.key) {
    mismatch(system.id, 'lineage.next 与轨道邻站不一致');
  }

  const expectedLinks = graphLinksForLineage(expectedEntry.track.lineage);
  const contextLinkKeys = (context.lineage.graphLinks ?? []).map(
    (link) => `${link.relation.parent}>${link.relation.child}`,
  );
  const expectedLinkKeys = expectedLinks.map(
    (link) => `${link.relation.parent}>${link.relation.child}`,
  );
  if (!sameIds(contextLinkKeys, expectedLinkKeys)) {
    mismatch(system.id, 'lineage.graphLinks 与轨道图边计算不一致');
  }
  for (const link of context.lineage.graphLinks ?? []) {
    if (link.parentStop.stop.script !== link.relation.parent) {
      mismatch(system.id, `lineage.graphLinks 的父站点 ${link.parentStop.key} 与边表不符`);
    }
    if (link.childStop.stop.script !== link.relation.child) {
      mismatch(system.id, `lineage.graphLinks 的子站点 ${link.childStop.key} 与边表不符`);
    }
    if (link.parentIndex !== link.parentStop.index || link.childIndex !== link.childStop.index) {
      mismatch(system.id, `lineage.graphLinks 的 ${link.relation.parent}>${link.relation.child} 索引不一致`);
    }
    const expectedDirection =
      link.parentIndex < link.childIndex ? 'forward' : 'reverse';
    if (link.direction !== expectedDirection) {
      mismatch(system.id, `lineage.graphLinks 的 ${link.relation.parent}>${link.relation.child} 方向错误`);
    }
  }
  const expectedAdjacency = adjacentGraphLinks(expectedEntry.track);
  for (const side of ['previous', 'next']) {
    const actual = context.lineage.adjacency?.[side];
    const expected = expectedAdjacency[side];
    if (actual?.status !== expected?.status) {
      mismatch(system.id, `lineage.adjacency.${side} 状态不一致`);
    }
    if (actual?.from.key !== expected?.from.key || actual?.to.key !== expected?.to.key) {
      mismatch(system.id, `lineage.adjacency.${side} 站点对不一致`);
    }
  }

  const expectedAlternativeKeys = expectedEntry.tracks.slice(1).map((track) => track.key);
  const alternativeKeys = alternatives.map((track) => track.key);
  if (!sameIds(alternativeKeys, expectedAlternativeKeys)) {
    mismatch(system.id, 'lineage.alternatives 与去重后的轨道入口不一致');
  }
  const seenLineages = new Set();
  for (const alternative of alternatives) {
    if (alternative.stop.script !== system.id) {
      mismatch(system.id, `lineage.alternatives 含其他体系的站点 ${alternative.key}`);
    }
    if (seenLineages.has(alternative.lineage.id)) {
      mismatch(system.id, `lineage.alternatives 重复轨道 ${alternative.lineage.id}`);
    }
    seenLineages.add(alternative.lineage.id);
  }

  const expectedTrackKeys = expectedEntry.tracks.map((track) => track.key);
  const trackKeys = context.lineage.tracks.map((track) => track.entry.key);
  if (!sameIds(trackKeys, expectedTrackKeys)) {
    mismatch(system.id, 'lineage.tracks 与去重后的轨道入口不一致');
  }
  const seenTrackLineages = new Set();
  for (const track of context.lineage.tracks) {
    if (track.entry.stop.script !== system.id) {
      mismatch(system.id, `lineage.tracks 含其他体系的站点 ${track.entry.key}`);
    }
    if (seenTrackLineages.has(track.entry.lineage.id)) {
      mismatch(system.id, `lineage.tracks 重复轨道 ${track.entry.lineage.id}`);
    }
    seenTrackLineages.add(track.entry.lineage.id);

    const expectedTrackNeighbors = adjacentStops(track.entry);
    if (track.previous?.key !== expectedTrackNeighbors.previous?.key) {
      mismatch(system.id, `${track.entry.lineage.id} 轨道 previous 不一致`);
    }
    if (track.next?.key !== expectedTrackNeighbors.next?.key) {
      mismatch(system.id, `${track.entry.lineage.id} 轨道 next 不一致`);
    }

    const expectedTrackLinks = graphLinksForLineage(track.entry.lineage);
    const actualTrackLinkKeys = track.graphLinks.map(
      (link) => `${link.relation.parent}>${link.relation.child}`,
    );
    if (
      !sameIds(
        actualTrackLinkKeys,
        expectedTrackLinks.map((link) => `${link.relation.parent}>${link.relation.child}`),
      )
    ) {
      mismatch(system.id, `${track.entry.lineage.id} 轨道 graphLinks 不一致`);
    }

    const expectedTrackAdjacency = adjacentGraphLinks(track.entry);
    for (const side of ['previous', 'next']) {
      const actual = track.adjacency[side];
      const expected = expectedTrackAdjacency[side];
      if (actual?.status !== expected?.status) {
        mismatch(system.id, `${track.entry.lineage.id} 轨道 adjacency.${side} 状态不一致`);
      }
      if (actual?.from.key !== expected?.from.key || actual?.to.key !== expected?.to.key) {
        mismatch(system.id, `${track.entry.lineage.id} 轨道 adjacency.${side} 站点对不一致`);
      }
      const path = actual?.connection.path;
      if (path) {
        if (path.from.id !== actual.connection.path?.from.id) {
          mismatch(system.id, `${track.entry.lineage.id} 轨道 adjacency.${side} 路径起点缺失`);
        }
        const brokenStep = path.steps.findIndex(
          (step, index) =>
            step.relation.parent !== step.from.id ||
            step.relation.child !== step.to.id ||
            (index > 0 && path.steps[index - 1]?.to.id !== step.from.id),
        );
        if (brokenStep !== -1) {
          mismatch(system.id, `${track.entry.lineage.id} 轨道 adjacency.${side} 路径第 ${brokenStep + 1} 步断裂`);
        }
      }
    }
  }

  const expectedMaterials = {
    source: glyphSourceFor(system),
    glyphSet: glyphSets[system.id],
    hasRoster: hasRoster(system.id),
    hasManualMap: hasLetterMap(system.id),
  };
  if (context.materials.source.kind !== expectedMaterials.source.kind) {
    mismatch(system.id, 'materials.source 与字形来源解析不一致');
  }
  if (context.materials.glyphSet !== expectedMaterials.glyphSet) {
    mismatch(system.id, 'materials.glyphSet 与样本集不一致');
  }
  if (Boolean(context.materials.letterSlots) !== expectedMaterials.hasRoster) {
    mismatch(system.id, 'materials.letterSlots 与字母表索引不一致');
  }
  if (
    context.materials.letterSlots &&
    Object.keys(context.materials.letterSlots.roster).length !==
      Object.keys(rosterFor(system.id)).length
  ) {
    mismatch(system.id, 'materials.letterSlots.roster 与字母表索引不一致');
  }
  if (
    context.materials.letterSlots &&
    context.materials.letterSlots.hasManualMap !== expectedMaterials.hasManualMap
  ) {
    mismatch(system.id, 'materials.letterSlots.hasManualMap 与手工槽位表不一致');
  }
}

// 关键缺口的历史判断已经核过：三条隔着未入轨节点，一条是姐妹支。
// 这里把结论固定成回归检查，防止以后为了“审计全绿”误补直系边。
const expectedGraphConnections = [
  {
    from: 'greek',
    to: 'etruscan',
    status: 'indirect',
    steps: ['greek>old-italic', 'old-italic>etruscan'],
  },
  {
    from: 'greek',
    to: 'latin',
    status: 'indirect',
    steps: ['greek>old-italic', 'old-italic>etruscan', 'etruscan>latin'],
  },
  {
    from: 'linear-b',
    to: 'cypriot',
    status: 'none',
    steps: [],
  },
  {
    from: 'aramaic',
    to: 'inscriptional-pahlavi',
    status: 'indirect',
    steps: ['aramaic>pahlavi', 'pahlavi>inscriptional-pahlavi'],
  },
];
const graphConnectionChecks = expectedGraphConnections.map((expected) => {
  const actual = graphConnectionBetween(expected.from, expected.to);
  const steps = actual.path?.steps.map(
    (step) => `${step.relation.parent}>${step.relation.child}`,
  ) ?? [];
  const matches =
    actual.status === expected.status &&
    steps.length === expected.steps.length &&
    steps.every((step, index) => step === expected.steps[index]);
  if (!matches) {
    contextMismatches.push({
      id: `${expected.from}>${expected.to}`,
      message:
        `关键图连接应为 ${expected.status} ` +
        `[${expected.steps.join(' → ')}]，实际为 ${actual.status} [${steps.join(' → ')}]`,
    });
  }
  return {
    ...expected,
    actualStatus: actual.status,
    actualSteps: steps,
    matches,
  };
});

const tracksWithoutSourceRefs = lineages.filter((lineage) => !lineage.sourceRefs?.length);
const incompleteStops = stopRefs.filter(
  ({ lineage, stop }) => !stop.sourceRef && !lineage.sourceRefs?.length,
);
const undocumentedAssets = stopRefs.filter(
  ({ stop }) => (stop.path || stop.image) && !stop.asset,
);

const result = {
  summary: {
    graphSystems: entries.length,
    graphRelations: graphRelations.length,
    graphRelationsByKind: relationsByKind,
    graphRelationsSourced: sourcedRelations.length,
    graphRelationsPendingEvidence: pendingRelations.length,
    graphRoots: systemsWithoutParents.length,
    independentGraphRoots: independentRoots.length,
    inventedGraphRoots: inventedRoots.length,
    lineageTracks: lineages.length,
    lineageStops: stopRefs.length,
    systemsWithEntry: linked.length,
    systemsWithNeighbors: withNeighbors.length,
    systemsIsolated: isolated.length,
    systemsWithSourceRefs: systemsWithSourceRefs.length,
    systemsWithoutSourceRefs: entries.length - systemsWithSourceRefs.length,
    systemsWithMultipleTracks: multiTrack.length,
    multiTrackWithoutExplicitEntry: multiTrackWithoutExplicitEntry.length,
    systemsUsingFallbackEntry: fallbackEntries.length,
    linkedSystemsWithoutExplicitEntry: linkedWithoutExplicitEntry.length,
    contextMismatches: contextMismatches.length,
    independentSystems: independent.length,
    independentSystemsWithEntry: independent.length - independentIsolated.length,
    independentSystemsIsolated: independentIsolated.length,
    tracksWithoutSourceRefs: tracksWithoutSourceRefs.length,
    stopsWithoutSource: incompleteStops.length,
    stopsWithoutAssetMetadata: undocumentedAssets.length,
    lineageGraphLinks: lineageGraphLinkCount,
    lineageDirectAdjacencies: directAdjacencyCount,
    lineageDirectDescentAdjacencies: directDescentAdjacencyCount,
    lineageDirectOtherAdjacencies: directOtherAdjacencyCount,
    lineageIndirectAdjacencies: indirectAdjacencyCount,
    lineageUnrelatedAdjacencies: unrelatedAdjacencyCount,
    lineageReverseAdjacencies: reverseAdjacencyCount,
    chainTracksWithoutDescent: chainTracksWithoutDescent.length,
    chainAdjacenciesWithoutDescent,
    chainDirectOtherAdjacencies: chainTracksWithoutDescent.reduce(
      (total, lineage) => total + lineage.chainDirectOther.length,
      0,
    ),
    chainIndirectAdjacencies: chainTracksWithoutDescent.reduce(
      (total, lineage) => total + lineage.chainIndirect.length,
      0,
    ),
    chainUnrelatedAdjacencies: chainTracksWithoutDescent.reduce(
      (total, lineage) => total + lineage.chainUnrelated.length,
      0,
    ),
  },
  independentIsolated: independentIsolated.map((entry) => ({
    id: entry.id,
    nameZh: entry.nameZh,
  })),
  systemsWithoutSourceRefs: entries
    .filter((entry) => entry.sourceRefs === 0)
    .map((entry) => ({
      id: entry.id,
      nameZh: entry.nameZh,
      origin: entry.origin,
      family: entry.family,
    })),
  multiTrackWithoutExplicitEntry: multiTrackWithoutExplicitEntry.map((entry) => ({
    id: entry.id,
    nameZh: entry.nameZh,
    tracks: entry.tracks,
  })),
  fallbackEntries: fallbackEntries.map((entry) => ({
    id: entry.id,
    nameZh: entry.nameZh,
    entry: entry.entry,
  })),
  contextMismatches,
  graphConnectionChecks,
  indirectAdjacencies: lineageAudits
    .flatMap((lineage) =>
      lineage.adjacencies
        .filter((item) => item.status === 'indirect')
        .map((item) => ({
          lineageId: lineage.id,
          nameZh: lineage.nameZh,
          ...item,
        })),
    ),
  chainTracksWithoutDescent: chainTracksWithoutDescent.map((lineage) => ({
    id: lineage.id,
    nameZh: lineage.nameZh,
    missing: lineage.chainAdjacenciesWithoutDescent,
  })),
  reverseAdjacencies: lineageAudits
    .filter((lineage) => lineage.reverseAdjacencies)
    .map((lineage) => ({
      id: lineage.id,
      nameZh: lineage.nameZh,
      adjacencies: lineage.adjacencies.filter((item) => item.status === 'reverse'),
    })),
  lineageAudits,
  relationsPendingEvidence: pendingRelations.map((relation) => ({
    parent: relation.parent,
    child: relation.child,
    kind: relation.kind,
  })),
  isolated: isolated.map((entry) => ({
    id: entry.id,
    nameZh: entry.nameZh,
    origin: entry.origin,
    family: entry.family,
  })),
  tracksWithoutSourceRefs: tracksWithoutSourceRefs.map((lineage) => ({
    id: lineage.id,
    nameZh: lineage.nameZh,
    stopCount: lineage.stops.length,
  })),
  incompleteStops: incompleteStops.map(({ lineage, stop, index }) => ({
    lineageId: lineage.id,
    stopId: stop.id,
    index,
    script: stop.script,
  })),
  undocumentedAssets: undocumentedAssets.map(({ lineage, stop, index }) => ({
    lineageId: lineage.id,
    stopId: stop.id,
    index,
    script: stop.script,
    kind: stop.path ? 'path' : 'image',
  })),
  entries,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const pct = (n, d) => `${Math.round((n / d) * 100)}%`;
  console.log('血统入口覆盖');
  console.log(
    `  节点 ${entries.length} · 可进入轨道 ${linked.length} (${pct(linked.length, entries.length)}) · ` +
      `可前后行走 ${withNeighbors.length} (${pct(withNeighbors.length, entries.length)}) · ` +
      `单体系待补 ${isolated.length}`,
  );
  console.log(
    `  独立起源 ${independent.length} · 已有入口 ${independent.length - independentIsolated.length} · ` +
      `待补 ${independentIsolated.length}`,
  );
  console.log(
    `  体系级来源 ${systemsWithSourceRefs.length}/${entries.length} · ` +
      `多轨道节点 ${multiTrack.length} · 未定首选入口 ${multiTrackWithoutExplicitEntry.length}`,
  );
  console.log(
    `  已入轨但未明确首选入口 ${linkedWithoutExplicitEntry.length}`,
  );
  console.log(
    `  节点上下文一致性 ${contextMismatches.length ? `✘ ${contextMismatches.length} 处不一致` : '✔'}`,
  );
  console.log(
    `  图谱边 ${graphRelations.length} · 直系 ${relationsByKind.descent} · 借用 ${relationsByKind.borrowing} · ` +
      `影响 ${relationsByKind.influence} · 模型 ${relationsByKind.model} · 已有逐边来源 ${sourcedRelations.length}`,
  );
  console.log(
    `  图根 ${systemsWithoutParents.length} · 独立起源根 ${independentRoots.length} · ` +
      `现代创制根 ${inventedRoots.length}（后两类不能混算）`,
  );
  console.log(
    `  站点 ${stopRefs.length} · 缺来源 ${incompleteStops.length} · 缺素材登记 ${undocumentedAssets.length}`,
  );
  console.log(
    `  轨道—图边 ${lineageGraphLinkCount} · 直接 ${directAdjacencyCount} ` +
      `(直系 ${directDescentAdjacencyCount} / 其他 ${directOtherAdjacencyCount}) · ` +
      `间接路径 ${indirectAdjacencyCount} · 无关 ${unrelatedAdjacencyCount} · ` +
      `反向 ${reverseAdjacencyCount}`,
  );
  console.log(
    `  轨道 ${lineages.length} · 已有轨道级来源 ${lineages.length - tracksWithoutSourceRefs.length} · ` +
      `待补 ${tracksWithoutSourceRefs.length}`,
  );

  if (independentIsolated.length) {
    console.log('\n独立起源待补：');
    for (const entry of independentIsolated) {
      console.log(`  · ${entry.id}  ${entry.nameZh}`);
    }
  }

  if (multiTrackWithoutExplicitEntry.length) {
    console.log('\n多轨道节点尚未指定首选入口：');
    for (const entry of multiTrackWithoutExplicitEntry) {
      console.log(`  · ${entry.id}  ${entry.nameZh} (${entry.tracks} 个站点)`);
    }
  }

  if (linkedWithoutExplicitEntry.length) {
    console.log('\n已入轨但尚未明确首选入口：');
    for (const entry of linkedWithoutExplicitEntry) {
      console.log(`  · ${entry.id}  ${entry.nameZh} → ${entry.entry.lineageId}:${entry.entry.stopId}`);
    }
  }

  if (chainTracksWithoutDescent.length) {
    console.log('\nchain 轨道中相邻站不是直接直系边（审计项，不阻断构建）：');
    for (const lineage of chainTracksWithoutDescent) {
      for (const item of lineage.chainAdjacenciesWithoutDescent) {
        const label =
          item.status === 'direct'
            ? `直接${item.kind ? ` ${item.kind}` : ''}`
            : item.status === 'indirect'
              ? '间接路径'
              : '无有向路径';
        console.log(
          `  · ${lineage.id}: ${item.from.script}:${item.from.stopId} → ` +
            `${item.to?.script}:${item.to?.stopId} (${label}` +
            `${item.direction ? `, ${item.direction}` : ''}` +
            `${item.path?.length > 1 ? `, 经 ${item.path.join(' → ')}` : ''})`,
        );
      }
    }
  }

  if (result.indirectAdjacencies.length) {
    console.log('\n轨道相邻站的间接图路径：');
    for (const item of result.indirectAdjacencies) {
      console.log(
        `  · ${item.lineageId}: ${item.from.script}:${item.from.stopId} → ` +
          `${item.to.script}:${item.to.stopId} (${item.path.join(' → ')})`,
      );
    }
  }

  if (reverseAdjacencyCount) {
    console.log('\n轨道顺序与图边方向相反：');
    for (const lineage of lineageAudits.filter((item) => item.reverseAdjacencies)) {
      for (const item of lineage.adjacencies.filter((entry) => entry.direction === 'reverse')) {
        console.log(
          `  · ${lineage.id}: ${item.from.script}:${item.from.stopId} → ` +
            `${item.to?.script}:${item.to?.stopId} (${item.relation ?? '间接路径'})`,
        );
      }
    }
  }

  if (contextMismatches.length) {
    console.log('\n节点上下文不一致：');
    for (const item of contextMismatches) {
      console.log(`  · ${item.id}  ${item.message}`);
    }
  }

  if (fallbackEntries.length) {
    console.log('\n按数据顺序回退入口：');
    for (const entry of fallbackEntries) {
      console.log(`  · ${entry.id}  ${entry.nameZh} → ${entry.entry.lineageId}:${entry.entry.stopId}`);
    }
  }

  if (isolated.length) {
    console.log('\n单体系待补（不代表都应有血统链）：');
    const byFamily = new Map();
    for (const entry of isolated) {
      const list = byFamily.get(entry.family) ?? [];
      list.push(entry);
      byFamily.set(entry.family, list);
    }
    for (const [family, list] of byFamily) {
      console.log(`  ${family} (${list.length}): ${list.map((entry) => entry.id).join(', ')}`);
    }
  }

  if (tracksWithoutSourceRefs.length) {
    console.log('\n轨道缺来源链接：');
    for (const lineage of tracksWithoutSourceRefs) {
      console.log(`  · ${lineage.id}  ${lineage.nameZh} (${lineage.stops.length} 站)`);
    }
  }

  if (incompleteStops.length) {
    console.log('\n站点缺来源：');
    for (const item of result.incompleteStops) {
      console.log(`  · ${item.lineageId}:${item.stopId} (${item.script})`);
    }
  }

  if (undocumentedAssets.length) {
    console.log('\n站点缺素材登记：');
    for (const item of result.undocumentedAssets) {
      console.log(`  · ${item.lineageId}:${item.stopId} (${item.script}, ${item.kind})`);
    }
  }
}

if (contextMismatches.length) {
  console.error(`\n✘ ${contextMismatches.length} 处节点上下文与源数据不一致`);
  process.exit(1);
}

if (strict && isolated.length) {
  console.error(`\n✘ ${isolated.length} 个图谱节点还没有血统入口`);
  process.exit(1);
}
