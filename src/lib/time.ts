/** 年代格式化与时间刻度 */

/** 把年代数字格式化为中文表述 */
export function formatYear(y: number): string {
  if (y === 0) return '公元元年前后';
  if (y < 0) return `公元前 ${Math.abs(y)} 年`;
  return `公元 ${y} 年`;
}

/** 简短形式，用于坐标轴 */
export function formatYearShort(y: number): string {
  if (y < 0) return `前${Math.abs(y)}`;
  return `${y}`;
}

/** 一段年代区间 */
export function formatSpan(from: number, to: number | null): string {
  const start = from < 0 ? `前${Math.abs(from)}` : `${from}`;
  const end = to === null ? '至今' : to < 0 ? `前${Math.abs(to)}` : `${to}`;
  return `${start} – ${end}`;
}

/** 全站时间域 */
export const TIME_DOMAIN: [number, number] = [-3300, 2030];

/** 文字类型的中文名 */
export const TYPE_LABEL: Record<string, string> = {
  logographic: '语素文字',
  logosyllabic: '语素音节文字',
  syllabary: '音节文字',
  abjad: '辅音音素文字',
  abugida: '元音附标文字',
  alphabet: '全音素文字',
  featural: '特征文字',
  mixed: '混合系统',
  undeciphered: '未破译',
  nonscript: '非文字记录系统',
};

/** 起源性质的中文名 */
export const ORIGIN_LABEL: Record<string, string> = {
  independent: '独立起源',
  derived: '衍生',
  influence: '受影响创制',
  invented: '人为创制',
};

/** 使用状态的中文名 */
export const STATUS_LABEL: Record<string, string> = {
  living: '仍在使用',
  liturgical: '宗教使用',
  historical: '历史文字',
  extinct: '已消亡',
  undeciphered: '未破译',
  revived: '复兴中',
};

/** 谱系分区中文名 */
export const FAMILY_LABEL: Record<string, string> = {
  mesopotamia: '美索不达米亚',
  egypt: '埃及',
  levant: '闪米特',
  greek: '希腊—拉丁',
  indic: '印度',
  seasia: '东南亚',
  sinic: '汉字圈',
  centralasia: '中亚 / 草原',
  mesoamerica: '中美洲',
  africa: '非洲',
  modern: '现代创制',
  other: '其他',
};

/**
 * 谱系配色。
 *
 * 这组颜色按"颜料"而不是"科技色板"来选：土黄、尼罗绿、朱砂、靛青、
 * 藏红、孔雀石、藤黄、灰褐、胭脂、橄榄、石墨、烟灰。
 * 饱和度压低、亮度拉开，目的是让 128 个节点在深色底上像一张
 * 手工上色的地图，而不是一堆霓虹灯。
 */
export const FAMILY_COLOR: Record<string, string> = {
  mesopotamia: '#c99a3f', // 土黄
  egypt: '#6fa08c', // 尼罗绿
  levant: '#c0523c', // 朱砂
  greek: '#5b7fb5', // 靛青
  indic: '#cf7f3a', // 藏红
  seasia: '#3f9a8a', // 孔雀石
  sinic: '#d9b45c', // 藤黄
  centralasia: '#9c8a6e', // 灰褐
  mesoamerica: '#b8446b', // 胭脂
  africa: '#7fa36a', // 橄榄
  modern: '#8b8578', // 石墨
  other: '#6f6a60', // 烟灰
};

/** 轨道性质的中文名 */
export const LINEAGE_MODE_LABEL: Record<string, string> = {
  chain: '单线传承',
  cognate: '同源辐射',
  pair: '借字记音',
};

/** 轨道性质的一句话说清 */
export const LINEAGE_MODE_HINT: Record<string, string> = {
  chain: '后一站由前一站直接演变而来，按年代排列。',
  cognate: '各站是同一祖形的平行后代，共享一个音值。',
  pair: '母字被借去记音，与借字成对出现。',
};
