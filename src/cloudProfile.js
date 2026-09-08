import { getUser, handleAuthCallback, login, logout, onAuthChange, signup } from '@netlify/identity'

export async function initializeAuth() {
  try { await handleAuthCallback() } catch {}
  try { return await getUser() } catch { return null }
}

export function watchAuth(callback) {
  return onAuthChange((_event, user) => callback(user || null))
}

export async function signIn(email, password) {
  return login(email, password)
}

export async function signUp(email, password) {
  return signup(email, password)
}

export async function signOut() {
  await logout()
}

export async function loadCloudProfile() {
  const response = await fetch('/api/profile', { credentials: 'same-origin' })
  if (!response.ok) throw new Error(response.status === 401 ? 'Sign in to sync progress.' : 'Could not load cloud progress.')
  const data = await response.json()
  return data.profile || {}
}

export async function saveCloudProfile(profile) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  })
  if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Sign in again to sync.' : 'Could not save cloud progress.')
  const data = await response.json()
  return data.profile || profile
}

const time = value => {
  const parsed = Date.parse(value || '')
  return Number.isNaN(parsed) ? 0 : parsed
}

export function mergeProfiles(localProfile, cloudProfile) {
  const local = localProfile || {}, cloud = cloudProfile || {}
  const solved = [...new Set([...(cloud.solved || []), ...(local.solved || [])])]
  const activityDays = [...new Set([...(cloud.activityDays || []), ...(local.activityDays || [])])].sort()
  const drafts = {}, draftUpdatedAt = {}
  const ids = new Set([...Object.keys(cloud.drafts || {}), ...Object.keys(local.drafts || {})])

  for (const id of ids) {
    const localDraft = local.drafts?.[id]
    const cloudDraft = cloud.drafts?.[id]
    const localTime = time(local.draftUpdatedAt?.[id])
    const cloudTime = time(cloud.draftUpdatedAt?.[id])

    if (localDraft !== undefined && (localTime > cloudTime || cloudDraft === undefined)) {
      drafts[id] = localDraft
      if (local.draftUpdatedAt?.[id]) draftUpdatedAt[id] = local.draftUpdatedAt[id]
    } else if (cloudDraft !== undefined) {
      drafts[id] = cloudDraft
      if (cloud.draftUpdatedAt?.[id]) draftUpdatedAt[id] = cloud.draftUpdatedAt[id]
    }
  }

  return { solved, drafts, draftUpdatedAt, activityDays }
}
