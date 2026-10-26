import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs'

let pyodidePromise

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'
    })
  }
  return pyodidePromise
}

self.onmessage = async event => {
  const { source, testCases } = event.data || {}
  try {
    const pyodide = await getPyodide()
    pyodide.globals.set('__hdlforge_source', String(source || ''))
    pyodide.globals.set('__hdlforge_cases', JSON.stringify(Array.isArray(testCases) ? testCases : []))
    const result = await pyodide.runPythonAsync(`
import contextlib as __ctx
import io as __io
import json as __json
import traceback as __traceback

__output = __io.StringIO()
__results = []
__namespace = {"__builtins__": __builtins__}

try:
    with __ctx.redirect_stdout(__output), __ctx.redirect_stderr(__output):
        exec(compile(__hdlforge_source, "<solution>", "exec"), __namespace)
except BaseException as __error:
    __message = str(__error) or __error.__class__.__name__
    __trace = __traceback.format_exc()
    __payload = {
        "passed": False,
        "output": "Python execution error: " + __error.__class__.__name__ + ": " + __message + "\\n" + __trace,
        "tests": []
    }
else:
    __cases = __json.loads(__hdlforge_cases)
    for __case in __cases:
        __start = __io.StringIO()
        try:
            with __ctx.redirect_stdout(__start), __ctx.redirect_stderr(__start):
                exec(compile(__case.get("code", ""), "<test>", "exec"), __namespace)
            __results.append({"name": __case.get("name", "Test"), "passed": True, "time": 0})
        except BaseException as __error:
            __results.append({"name": __case.get("name", "Test"), "passed": False, "time": 0, "error": __error.__class__.__name__ + ": " + (str(__error) or "assertion failed")})
    __passed = bool(__results) and all(__test["passed"] for __test in __results)
    __lines = [("PASS" if __test["passed"] else "FAIL") + " · " + __test["name"] + ((" — " + __test["error"]) if not __test["passed"] and __test.get("error") else "") for __test in __results]
    __payload = {
        "passed": __passed,
        "output": __output.getvalue() + "\\n".join(__lines),
        "tests": __results
    }

__json.dumps(__payload)
`)
    self.postMessage({ ok: true, result: JSON.parse(result) })
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error && error.message ? error.message : 'Unable to initialize the Python runtime.'
    })
  }
}
