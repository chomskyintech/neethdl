import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const exercisePage = '/learn/automation-exercises/index.html'
const exercisePaths = new Set([
  '/learn/automation-exercises',
  '/learn/automation-exercises/',
  '/automation-exercises',
  '/automation-exercises/',
  '/tooling-exercises',
  '/tooling-exercises/',
  '/learn/tooling-exercises',
  '/learn/tooling-exercises/',
  '/learn/automation',
  '/learn/automation/',
])

function serveAutomationExercises() {
  const rewriteExercisePath = (req, _res, next) => {
    if (req.url) {
      const queryIndex = req.url.indexOf('?')
      const pathname = queryIndex === -1 ? req.url : req.url.slice(0, queryIndex)
      if (exercisePaths.has(pathname)) {
        req.url = exercisePage + (queryIndex === -1 ? '' : req.url.slice(queryIndex))
      }
    }
    next()
  }

  return {
    name: 'hdlforge-automation-exercise-routes',
    configureServer(server) {
      server.middlewares.use(rewriteExercisePath)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteExercisePath)
    },
  }
}

export default defineConfig({
  plugins: [serveAutomationExercises(), react()],
  build: { outDir: 'dist' }
})
