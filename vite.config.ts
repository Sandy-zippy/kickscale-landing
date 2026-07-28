import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BUILD_ID = String(Date.now())

/**
 * Writes dist/version.json so a client running a stale bundle can detect it.
 * closeBundle fires after Vite has finished writing the output directory, so a
 * plain fs write is more reliable here than emitFile.
 */
const emitVersion = {
  name: 'emit-version',
  closeBundle() {
    const dir = resolve(process.cwd(), 'dist')
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, 'version.json'), JSON.stringify({ build: BUILD_ID }))
  },
}

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), tailwindcss(), emitVersion],
  build: {
    outDir: 'dist',
  },
})
