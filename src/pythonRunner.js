const PYTHON_TIMEOUT_MS = 20000

export function runPython(problem, source) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./pythonWorker.js', import.meta.url), {
      type: 'module'
    })
    let settled = false

    const finish = callback => value => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      worker.terminate()
      callback(value)
    }

    const fail = finish(reject)
    const succeed = finish(resolve)
    const timeout = setTimeout(() => {
      fail(new Error('Python execution timed out after 20 seconds. Check for an infinite loop and run again.'))
    }, PYTHON_TIMEOUT_MS)

    worker.onmessage = event => {
      const message = event.data || {}
      if (!message.ok) {
        fail(new Error(message.error || 'Python runtime failed to start. Check your internet connection and try again.'))
        return
      }
      succeed(message.result)
    }

    worker.onerror = event => {
      event.preventDefault?.()
      fail(new Error('The browser Python runtime could not start. Check your internet connection and try again.'))
    }

    worker.postMessage({
      source: String(source || ''),
      testCases: Array.isArray(problem?.testCases) ? problem.testCases : []
    })
  })
}
