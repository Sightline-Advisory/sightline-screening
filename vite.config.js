import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'anthropic-proxy',
        configureServer(server) {
          server.middlewares.use('/api/analyze', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200)
              res.end()
              return
            }

            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              const apiKey = env.ANTHROPIC_API_KEY
              const payload = Buffer.from(body)

              const options = {
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': payload.length,
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                },
              }

              const proxyReq = https.request(options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                })
                proxyRes.pipe(res)
              })

              proxyReq.on('error', (e) => {
                console.error('Proxy error:', e)
                res.writeHead(500)
                res.end(JSON.stringify({ error: e.message }))
              })

              proxyReq.write(payload)
              proxyReq.end()
            })
          })
        }
      }
    ]
  }
})