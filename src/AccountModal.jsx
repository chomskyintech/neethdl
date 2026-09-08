import React, { useState } from 'react'
import { Cloud, LogOut, X } from 'lucide-react'
import { signIn, signOut, signUp } from './cloudProfile'

export default function AccountModal({ open, user, onClose, syncStatus }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (!open) return null

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const nextUser = await signUp(email.trim(), password)
        setMessage(nextUser?.confirmed === false ? 'Account created. Check your email to confirm your address.' : 'Account created and signed in.')
      } else {
        await signIn(email.trim(), password)
        setMessage('Signed in. Your progress is syncing.')
      }
    } catch (error) {
      setMessage(error?.message || 'Account action failed.')
    } finally {
      setBusy(false)
    }
  }

  const doSignOut = async () => {
    setBusy(true)
    setMessage('')
    try {
      await signOut()
      onClose()
    } catch (error) {
      setMessage(error?.message || 'Could not sign out.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="account-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="account-modal" role="dialog" aria-modal="true" aria-label="HDLForge account">
      <button className="account-close" aria-label="Close account dialog" onClick={onClose}><X size={17}/></button>
      <div className="account-icon"><Cloud size={20}/></div>
      {user ? <>
        <div className="account-heading"><h2>Your HDLForge account</h2><p>{user.email}</p></div>
        <div className="account-sync"><strong>Cloud sync</strong><span>{syncStatus || 'Synced'}</span></div>
        <p className="account-note">Solved problems, drafts, streak activity and progress are synced to this account. Local storage remains available offline.</p>
        {message && <div className="account-message">{message}</div>}
        <button className="secondary account-submit" disabled={busy} onClick={doSignOut}><LogOut size={15}/> Sign out</button>
      </> : <>
        <div className="account-heading"><h2>{mode === 'signup' ? 'Create an account' : 'Sign in to HDLForge'}</h2><p>Sync your progress and drafts across devices.</p></div>
        <div className="account-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage('') }}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage('') }}>Create account</button></div>
        <form className="account-form" onSubmit={submit}>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" required minLength="8" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} /></label>
          {message && <div className="account-message">{message}</div>}
          <button className="primary account-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        </form>
      </>}
    </section>
  </div>
}
