/**
 * 世界书写体系演化地图 —— 数据类型定义
 *
 * 设计原则：
 *  1. writingSystem（书写体系）= 图中的一个节点。可以是字母表、辅音音素文字、
 *     元音附标文字、音节文字、语素文字、特征文字，或尚未破译的文字。
 *  2. lineage（血统轨道）= 一条穿越多个书写体系的"同源字位"路径，
 *     用于字形街景的演进与字形形变动画。
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

/**
 * 一条图谱边凭什么成立。
 *
 * 不能从子节点的 origin 反推：同一个子节点可能既有一条直系来源，又受到
 * 另一套文字的字母形式或造字制度影响。
 */
export type GraphRelationKind =
  | 'descent'    // 直系演变：前一体系的书体或制度连续发展成后一体系
  | 'borrowing'  // 借用：字母、字形或整套书写制度被另一传统采用
  | 'influence'  // 影响：可核实的设计或观念联系，但不声称直系血缘
  | 'model';     // 造字模型：参照另一体系创制，字形本身不一定同源

/** 一条有向的书写体系关系。 */
export interface GraphRelation {
  /** 父系书写体系 id */
  parent: string;
  /** 子系书写体系 id */
  child: string;
  kind: GraphRelationKind;
  /**
   * pending：关系分类已登记，逐边证据仍待补；
   * sourced：已有至少一条针对这条关系的来源。
   */
  evidence: 'pending' | 'sourced';
  /** 只证明这条边、而不是整套文字或字形清单的参考链接 */
  sourceRefs?: string[];
  /** 对关系性质或学界分歧的短注 */
  note?: string;
}

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

/** 谱系分区（用于演化全图的泳道与配色） */
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
  /**
   * 父系书写体系 id 列表，由 graphRelations 投影而来，供现有布局与查询兼容。
   * 新数据应写 graphRelations；不要在这里另加一条没有边语义的父系。
   */
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
  /**
   * 一句话说明。
   */
  note?: string;
  /**
   * 节点进入血统视图时的首选站点。
   *
   * 一个书写体系可能出现在多条轨道里。缺省时使用 lineages.ts 中第一条包含
   * 该体系的轨道及其第一个站点；需要指定更合适的入口时再填写这里。
   */
  lineageEntry?: {
    lineageId: string;
    stopId: string;
  };
  /** 这个书写体系的通用参考链接（字体、Unicode 提案、条目等） */
  sourceRefs?: string[];
}

/** 字形素材的来源与授权信息，随站点一起保存，避免素材与谱系脱节。 */
export interface GlyphAsset {
  kind: 'path' | 'image' | 'font';
  /** 作者、机构或字体项目名 */
  credit?: string;
  /** 授权协议 */
  license?: string;
  /** 素材主页、原始文件或字体项目地址 */
  home?: string;
}

/** 血统轨道上的一个站点 */
export interface GlyphStop {
  /**
   * 轨道内的稳定站点 id。
   *
   * 这是站点在轨道内的持久标识，供体系焦点、反向索引与图谱节点跳转使用。
   * 一旦发布就不要改名；同一轨道出现同一书写体系时更必须各自独立。
   */
  id: string;
  /** 对应书写体系 id */
  script: string;
  /** 用于字体渲染的字符 */
  char?: string;
  /** 用于矢量形变的 SVG path（viewBox 0 0 100 100） */
  path?: string;
  /**
   * 只能看图版的站点：public/ 下的相对路径（隶书、僧侣体、世俗体这类
   * 没有可靠字库的历史书体）。有 path 时优先 path，其次是 image，
   * 再其次是字体，都没有才留空。
   */
  image?: string;
  /** 该字形的名称，如 "ʾālep / 牛头" */
  label?: string;
  /** 音值 */
  phonetic?: string;
  /** 站点自己的证据链接；优先于轨道级 source */
  sourceRef?: string;
  /** 这个站点实际使用的素材与授权 */
  asset?: GlyphAsset;
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
  /**
   * 史实依据：这条轨道凭什么成立——条目正文、Unicode 提案或字形对照表。
   * 体系焦点会把它印在说明下面一行。写不出出处的链条不该上线，
   * tools/validate-data.mjs 把空 source 当错误。
   */
  source: string;
  /**
   * 轨道级参考链接，至少一条。站点没有自己的 sourceRef 时继承这里；
   * 站点有更具体的证据时仍以站点 sourceRef 为准。
   */
  sourceRefs: string[];
  /** 站点顺序：chain 按时间，cognate / pair 按叙事顺序 */
  stops: GlyphStop[];
  /**
   * 轨道级字母槽位覆盖：scriptId → slotId → char。
   *
   * 通用 letterSlots 记录的是书写体系层面的同源关系；同一体系在不同轨道上
   * 可能取不同的代表字形（例如平假名母字与片假名母字），此时由轨道覆盖，
   * 而不复制或污染全局字表。
   */
  alphabetSlotOverrides?: Record<string, Record<string, string>>;
  /**
   * 是否铺开字母场。full 为默认；hidden 用于目前只核实了单字链条、
   * 整表对应关系尚未核清的区段，避免自动补位把错误母字铺到邻站。
   */
  alphabetField?: 'full' | 'hidden';
}
