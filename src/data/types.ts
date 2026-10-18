/**
 * 世界书写体系演化地图 —— 数据类型定义
 *
 * 设计原则：
 *  1. writingSystem（书写体系）= 图中的一个节点。可以是字母表、辅音音素文字、
 *     元音附标文字、音节文字、语素文字、特征文字，或尚未破译的文字。
 *  2. lineage（血统轨道）= 一条穿越多个书写体系的"同源字位"路径，
 *     用于微观维度的"街景"演进与字形形变动画。
 *  3. glyph（字形）= 轨道上的一个站点，既能用字体渲染，也能用矢量路径渲染。
 */

/** 文字的类型学分类 */
export type ScriptType =
  | 'logographic'      // 语素文字（汉字）
  | 'logosyllabic'     // 语素音节文字（楔形文字、玛雅）
  | 'syllabary'        // 音节文字（线形文字B、切罗基）
  | 'abjad'            // 辅音音素文字（腓尼基、阿拉伯）
  | 'abugida'          // 元音附标文字（天城文、泰文）
  | 'alphabet'         // 全音素文字（希腊、拉丁）
  | 'featural'         // 特征文字（谚文）
  | 'shorthand'        // 速记文字（杜普洛伊）
  | 'mixed'            // 混合系统
  | 'undeciphered'     // 未破译
  | 'nonscript';       // 非文字记录系统（奇普）

/** 起源性质 */
export type Origin =
  | 'independent'  // 独立起源（独立发明）
  | 'derived'      // 衍生自其他文字
  | 'influence'    // 受其他文字影响而创制
  | 'invented'     // 现代人为创制

/** 使用状态 */
export type Status =
  | 'living'       // 仍作为日常文字使用
  | 'liturgical'   // 仅宗教/仪式使用
  | 'historical'   // 历史文字，已不在通用
  | 'extinct'      // 已消亡
  | 'undeciphered' // 未破译
  | 'revived';     // 复兴中

/** 书写方向 */
export type Direction = 'ltr' | 'rtl' | 'ttb' | 'boustrophedon' | 'mixed';

/** 谱系分区（用于宏观图的泳道与配色） */
export type Family =
  | 'mesopotamia'   // 美索不达米亚
  | 'egypt'         // 埃及
  | 'levant'        // 黎凡特 / 闪米特
  | 'greek'         // 希腊—拉丁
  | 'indic'         // 印度
  | 'seasia'        // 东南亚
  | 'sinic'         // 汉字圈
  | 'centralasia'   // 中亚 / 草原
  | 'mesoamerica'   // 中美洲
  | 'africa'        // 非洲
  | 'modern'        // 现代创制
  | 'other';        // 其他 / 未归类

export interface WritingSystem {
  id: string;
  nameZh: string;
  nameEn: string;
  /** 别名（中文） */
  alias?: string[];
  origin: Origin;
  /** 父系书写体系 id 列表（用于绘制有向图的边） */
  parents: string[];
  /** 起始年代，负数表示公元前 */
  dateFrom: number;
  /** 终止年代；null 表示仍在用 */
  dateTo: number | null;
  family: Family;
  region: string;
  /** 今天主要在哪些国家/地区使用（中文名） */
  countries: string[];
  type: ScriptType;
  status: Status;
  direction?: Direction;
  /** Unicode 区块名 */
  unicodeBlock?: string;
  /** 用于渲染示例的字符 */
  sample?: string;
  /** Google Fonts 家族名，缺省则用系统字体 */
  fontFamily?: string;
  /** 一句话说明 */
  note?: string;
}

/** 血统轨道上的一个站点 */
export interface GlyphStop {
  /** 对应书写体系 id */
  script: string;
  /** 用于字体渲染的字符 */
  char?: string;
  /** 用于矢量形变的 SVG path（viewBox 0 0 100 100） */
  path?: string;
  /** 该字形的名称，如 "ʾālep / 牛头" */
  label?: string;
  /** 音值 */
  phonetic?: string;
}

/**
 * 轨道的性质，决定"往前一步"意味着什么：
 *  - chain   单线传承，后一站由前一站演变而来（如 牛头 → A）
 *  - cognate 同源辐射，各站是同一祖形的平行后代（如 婆罗米 ka → 各国 ka）
 *  - pair    借字记音，母字与借字成对出现（如 汉字 → 假名）
 */
export type LineageMode = 'chain' | 'cognate' | 'pair';

/** 一条血统轨道 */
export interface Lineage {
  id: string;
  /** 轨道名称，如 "字母 A 的八千年" */
  nameZh: string;
  nameEn: string;
  /** 一句话说明这条轨道在演示什么 */
  description: string;
  /** 轨道的性质；缺省视为 chain */
  mode?: LineageMode;
  /** 站点顺序：chain 按时间，cognate / pair 按叙事顺序 */
  stops: GlyphStop[];
}
