#!/usr/bin/env node
import assert from 'node:assert/strict'
import { buildTopicOrderedProblems, adjacentTopicProblems } from '../src/problemNavigation.js'

const topics = ['Combinational Logic','Sequential Logic','FIFOs & Buffers','Memories & Registers']
const source = [
  {id:'combo-a',topic:'Combinational Logic'},
  {id:'fifo-a',topic:'FIFOs & Buffers'},
  {id:'seq-a',topic:'Sequential Logic'},
  {id:'fifo-b',topic:'FIFOs & Buffers'},
  {id:'mem-a',topic:'Memories & Registers'},
  {id:'combo-b',topic:'Combinational Logic'},
  {id:'other-a',topic:'Other'},
]

const ordered = buildTopicOrderedProblems(source,topics)
assert.deepEqual(
  ordered.map(problem=>problem.id),
  ['combo-a','combo-b','seq-a','fifo-a','fifo-b','mem-a','other-a'],
  'navigation must group problems by the same topic order shown on the Problems page'
)

let nav = adjacentTopicProblems(source,topics,'fifo-a')
assert.equal(nav.previous?.id,'seq-a')
assert.equal(nav.next?.id,'fifo-b','next must stay inside the current section first')

nav = adjacentTopicProblems(source,topics,'fifo-b')
assert.equal(nav.previous?.id,'fifo-a')
assert.equal(nav.next?.id,'mem-a','last problem in a section must advance to the next section')

nav = adjacentTopicProblems(source,topics,'combo-b')
assert.equal(nav.previous?.id,'combo-a','previous must stay inside the current section where possible')
assert.equal(nav.next?.id,'seq-a','section boundary must follow topic order')

console.log('Problem navigation regression passed: arrows follow topic sections in display order.')
