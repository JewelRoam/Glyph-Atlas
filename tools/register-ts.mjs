// 让 node 直接 import src/ 下的 TS 数据模块：相对导入缺扩展名时补 .ts / .tsx。
// 用法：node --import ./tools/register-ts.mjs tools/xxx.mjs
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./ts-hook.mjs', pathToFileURL(import.meta.dirname + '/'));
