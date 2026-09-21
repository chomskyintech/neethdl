export function buildTopicOrderedProblems(problems = [], topicOrder = []) {
  const knownTopics = new Set(topicOrder)
  const ordered = topicOrder.flatMap(topic =>
    problems.filter(problem => problem.topic === topic)
  )
  const ungrouped = problems.filter(problem => !knownTopics.has(problem.topic))
  return [...ordered, ...ungrouped]
}

export function adjacentTopicProblems(problems, topicOrder, currentId) {
  const ordered = buildTopicOrderedProblems(problems, topicOrder)
  const index = ordered.findIndex(problem => problem.id === currentId)
  return {
    ordered,
    index,
    previous: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  }
}
