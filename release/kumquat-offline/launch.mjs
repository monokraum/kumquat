import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const host = '127.0.0.1'
const port = Number(process.argv[2] ?? 8080)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Utilisation : node launch.mjs [port de 1 à 65535]')
  process.exit(1)
}

const root = fileURLToPath(new URL('./app/', import.meta.url))
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname)
    const filename = resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`)
    const fromRoot = relative(root, filename)
    if (fromRoot === '..' || fromRoot.startsWith('../') || fromRoot.startsWith('..\\') || isAbsolute(fromRoot)) {
      response.writeHead(404).end()
      return
    }

    const entry = await stat(filename)
    if (!entry.isFile()) {
      response.writeHead(404).end()
      return
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filename)] ?? 'application/octet-stream',
      'Content-Length': entry.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    })
    if (request.method === 'HEAD') {
      response.end()
      return
    }

    createReadStream(filename)
      .on('error', () => response.destroy())
      .pipe(response)
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end()
  }
})

server.on('error', (error) => {
  console.error(`Démarrage impossible sur le port ${port}. ${error.message}`)
  process.exitCode = 1
})
server.listen(port, host, () => console.log(`Ouvrir http://${host}:${port} dans Edge ou Chrome.`))
