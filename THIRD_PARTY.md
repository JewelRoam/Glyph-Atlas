# 第三方资源

本仓库的代码（形变引擎、布局、视图与数据处理）由项目自己维护。
下面列出站点运行时加载、或随仓库分发的第三方资源。

## 1. 字体

### 1.1 随仓库分发的子集字体（`public/fonts/`）

历史书体没有现成的开源字库，或字库体积过大，因此按详情面板实际要展示的
字符做了子集后自托管。**这些文件按字体自身的许可分发，不是项目代码的一部分。**

| 文件 | 字面来源 | 授权 | 出处 |
| --- | --- | --- | --- |
| `glyph-atlas-oracle-bone.woff2` | Oracular 鏡原甲骨文（Peichao Qin） | SIL OFL 1.1 | https://github.com/Ivan666jjj/yigezi |
| `glyph-atlas-small-seal.woff2` | 開元小篆（frankslin）＋ 全字庫《說文解字》 | SIL OFL 1.1 / OGDL-Taiwan-1.0 | https://github.com/frankslin/kaiyuan-small-seal-font |
| `glyph-atlas-khojki.woff2` | Noto Sans Khojki 2.005（Noto Project Authors）Khojki 区段子集 | SIL OFL 1.1 | https://github.com/notofonts/khojki |

### 1.2 Google Fonts

其余字形通过 Google Fonts 的 CSS API 加载，绝大多数是 **Noto Sans / Noto Serif
系列**（约 150 个字族，覆盖各书写体系的 Unicode 区块），另有中文排印用的
Noto Serif SC / Noto Serif JP / Noto Serif KR 与 LXGW WenKai TC。
这些字体各自遵循自己的许可（Noto 系列为 SIL OFL 1.1）。
站点只在需要展示某套书写体系时才请求对应的那一款字体。

## 2. 图版

`public/glyphs/` 下的实物照片与摹本全部来自 Wikimedia Commons，逐条登记在
[`public/glyphs/CREDITS.md`](public/glyphs/CREDITS.md)，包括作者、授权与
原始文件页面。常见授权为公有领域、CC0 与 CC BY / CC BY-SA。
这些图片以未修改或仅等比缩放的方式使用。

## 3. 运行依赖

| 依赖 | 用途 | 授权 |
| --- | --- | --- |
| [React](https://react.dev/) | 界面 | MIT |
| [D3](https://d3js.org/) | 图谱布局与缩放 | ISC |
| [Vite](https://vite.dev/) | 构建 | MIT |
