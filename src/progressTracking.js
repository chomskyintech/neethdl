const DAY_MS = 24 * 60 * 60 * 1000
const pointsByDifficulty = { Easy: 100, Medium: 200, Hard: 300 }

export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addActivityDay(days, date = new Date()) {
  return Array.from(new Set([...(Array.isArray(days) ? days : []), dayKey(date)])).sort()
}

export function calculateStreak(days, now = new Date()) {
  const set = new Set(Array.isArray(days) ? days : [])
  if (!set.size) return 0
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const today = dayKey(cursor)
  const yesterdayDate = new Date(cursor.getTime() - DAY_MS)
  if (!set.has(today) && !set.has(dayKey(yesterdayDate))) return 0
  if (!set.has(today)) cursor.setTime(yesterdayDate.getTime())
  let streak = 0
  while (set.has(dayKey(cursor))) {
    streak += 1
    cursor.setTime(cursor.getTime() - DAY_MS)
  }
  return streak
}

export function calculatePoints(problems, solvedIds) {
  const solved = new Set(Array.isArray(solvedIds) ? solvedIds : [])
  return problems.reduce((total, problem) => total + (solved.has(problem.id) ? (pointsByDifficulty[problem.difficulty] || 100) : 0), 0)
}

export function topicProgress(problems, solvedIds) {
  const solved = new Set(Array.isArray(solvedIds) ? solvedIds : [])
  const result = {}
  for (const problem of problems) {
    if (!result[problem.category]) result[problem.category] = { solved: 0, total: 0 }
    result[problem.category].total += 1
    if (solved.has(problem.id)) result[problem.category].solved += 1
  }
  return result
}
