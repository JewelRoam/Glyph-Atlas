import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * GitHub Pages 项目站点部署在 https://jewelroam.github.io/Glyph-Atlas/，
 * 因此构建产物的资源路径必须以仓库名为前缀；本地开发仍从根路径提供服务。
 *
 * 仓库改名时，这里的 BASE 与 .github/workflows/deploy.yml 里的地址需要同步。
 */
const BASE = '/Glyph-Atlas/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [react()],
}))
