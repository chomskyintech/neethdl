import React, { useMemo, useState } from 'react'
import { ChevronRight, Target } from 'lucide-react'
import tracks from './data/tracks'

export default function Tracks({ problems, solved, onOpen }) {
  const [selectedId, setSelectedId] = useState(tracks[0]?.id || '')
  const selected = tracks.find(track => track.id === selectedId) || tracks[0]
  const selectedProblems = useMemo(() => selected ? selected.problemIds.map(id => problems.find(problem => problem.id === id)).filter(Boolean) : [], [selected, problems])
  const solvedCount = selectedProblems.filter(problem => solved.includes(problem.id)).length

  return <div>
    <div className="page-head"><div className="eyebrow">INTERVIEW TRACKS</div><h1>Company & role tracks</h1><p>Practice focused problem sets built from the existing HDLForge catalog.</p></div>
    <div className="tracks-layout">
      <div className="track-list" aria-label="Interview tracks">
        {tracks.map(track => {
          const available = track.problemIds.map(id => problems.find(problem => problem.id === id)).filter(Boolean)
          const complete = available.filter(problem => solved.includes(problem.id)).length
          return <button key={track.id} className={selected?.id === track.id ? 'track-card active' : 'track-card'} onClick={() => setSelectedId(track.id)}>
            <span className="track-card-icon"><Target size={17}/></span>
            <span className="track-card-copy"><strong>{track.name}</strong><small>{complete}/{available.length} solved</small></span>
            <ChevronRight size={16}/>
          </button>
        })}
      </div>
      {selected && <section className="track-detail">
        <div className="track-detail-head"><div><div className="eyebrow">{selected.name.toUpperCase()}</div><h2>{selected.name} preparation</h2><p>{selected.description}</p></div><div className="track-score"><strong>{solvedCount}/{selectedProblems.length}</strong><span>solved</span></div></div>
        <div className="progress-track large"><div style={{ width: `${selectedProblems.length ? Math.round(solvedCount / selectedProblems.length * 100) : 0}%` }}/></div>
        <div className="track-problems">
          {selectedProblems.map((problem, index) => <button className="track-problem" key={problem.id} onClick={() => onOpen(problem)}>
            <span className={solved.includes(problem.id) ? 'check done' : 'check'} aria-label={solved.includes(problem.id) ? 'Solved' : 'Unsolved'}>{solved.includes(problem.id) && <span>✓</span>}</span>
            <span className="track-problem-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="track-problem-copy"><strong>{problem.title}</strong><small>{problem.category} · {problem.difficulty}</small></span>
            <ChevronRight size={16}/>
          </button>)}
        </div>
      </section>}
    </div>
  </div>
}
