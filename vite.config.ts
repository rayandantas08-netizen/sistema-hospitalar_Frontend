import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O GitHub Pages publica o projeto em um subdiretório:
// https://<usuario>.github.io/sistema-hospitalar/
// Por isso o build precisa de `base`, senão os assets (/assets/...) são
// procurados na raiz do domínio e o site carrega em branco.
//
// Em `npm run dev` mantemos '/' para continuar acessando em http://localhost:5173/
// Para trocar o caminho publicado, defina a variável de ambiente VITE_BASE_PATH.
//
// ATENÇÃO no Render (e em qualquer host na raiz do domínio): o padrão abaixo é
// '/sistema-hospitalar/', que só serve para o subdiretório do GitHub Pages. Num
// domínio próprio o site fica em branco (os <script src="/sistema-hospitalar/assets/...">
// dão 404) e o BrowserRouter ganha basename errado, então rotas como
// /redefinir-senha não casam. No Render defina VITE_BASE_PATH=/ ANTES do build —
// o Vite embute o valor no bundle, não há runtime para reler depois.
// https://vite.dev/config/
//
// allowedHosts: o `vite preview`/`vite` recusam o Host header que não conheçam
// ("Blocked request. This host is not allowed"), o que quebra o deploy atrás de
// um proxy/domínio próprio como o do Render.
//
// Usamos o hostname EXATO do serviço. Não usar `true` (aceita qualquer host e
// reabre o buraco de DNS rebinding) nem `'.onrender.com'` (qualquer pessoa cria
// subdomínio nesse domínio e passa a conseguir ler o bundle).
//
// `preview.allowedHosts` herda de `server.allowedHosts`
// (node_modules/vite/dist/node/chunks/node.js: `preview?.allowedHosts ?? server.allowedHosts`),
// então não é preciso repetir em `preview`.
const RENDER_HOST = 'sistema-hospitalar-frontend-ju62.onrender.com'

// Hosts extras, vindos do ambiente — útil para previews temporários sem
// precisar commitar um curinga no repositório. Ex.: ALLOWED_HOSTS="a.dev,b.dev"
const extraAllowedHosts = (process.env.ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

const allowedHosts = [
  RENDER_HOST,
  '.e2b.app',
  'localhost',
  '127.0.0.1',
  ...extraAllowedHosts,
]

// Se VITE_BASE_PATH for definido, usa-o.
// Caso contrário:
// - No GitHub Actions (deploy no Pages): default '/sistema-hospitalar/'
// - No Render, preview local ou qualquer deploy na raiz de domínio: default '/'
const defaultBase =
  process.env.GITHUB_ACTIONS && !process.env.RENDER
    ? '/sistema-hospitalar/'
    : '/'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : (process.env.VITE_BASE_PATH ?? defaultBase),
  plugins: [react()],
  server: {
    // Render injeta a porta a escutar; `host: true` => 0.0.0.0, exigido pelo proxy.
    host: true,
    port: Number(process.env.PORT) || 5173,
    allowedHosts,
    // Proxy de desenvolvimento: o navegador chama caminhos relativos /api/...
    // (VITE_API_URL=/api em .env.development) e o Vite repassa para o backend.
    // Assim não há CORS em dev e o preview remoto funciona — o navegador nunca
    // fala com localhost direto (importante quando o dev server roda num
    // sandbox remoto). `ws: true` cobre o WebSocket do painel de TV
    // (/api/chamadas/ws) e o SSE (/api/chamadas/eventos) passa normalmente.
    // Para usar outro backend sem rodar nada local (ex.: o deploy do Render),
    // defina VITE_API_PROXY_TARGET antes de `npm run dev`.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
  },
}))
