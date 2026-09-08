import { getStore, getDeployStore } from '@netlify/blobs'
import { getUser, verifyRequestOrigin } from '@netlify/identity'
import type { Config, Context } from '@netlify/functions'

declare const Netlify: any

type Profile = {
  solved: string[]
  drafts: Record<string, string>
  draftUpdatedAt: Record<string, string>
  activityDays: string[]
  updatedAt: string
}

const emptyProfile = (): Profile => ({ solved: [], drafts: {}, draftUpdatedAt: {}, activityDays: [], updatedAt: new Date(0).toISOString() })

function profileStore() {
  if (Netlify.context?.deploy?.context === 'production') return getStore('hdlforge-profiles', { consistency: 'strong' })
  return getDeployStore('hdlforge-profiles')
}

function normalize(input: any): Profile {
  const solved = Array.isArray(input?.solved) ? [...new Set(input.solved.filter((value: unknown) => typeof value === 'string').slice(0, 500))] as string[] : []
  const activityDays = Array.isArray(input?.activityDays) ? [...new Set(input.activityDays.filter((value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)).slice(-730))] as string[] : []
  const drafts: Record<string, string> = {}
  const draftUpdatedAt: Record<string, string> = {}
  if (input?.drafts && typeof input.drafts === 'object') {
    for (const [key, value] of Object.entries(input.drafts).slice(0, 500)) {
      if (typeof value === 'string') drafts[key] = value.slice(0, 20000)
    }
  }
  if (input?.draftUpdatedAt && typeof input.draftUpdatedAt === 'object') {
    for (const [key, value] of Object.entries(input.draftUpdatedAt).slice(0, 500)) {
      if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) draftUpdatedAt[key] = value
    }
  }
  return { solved, drafts, draftUpdatedAt, activityDays, updatedAt: new Date().toISOString() }
}

export default async (req: Request, _context: Context) => {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const store = profileStore()
  const key = `users/${user.id}.json`

  if (req.method === 'GET') {
    const profile = await store.get(key, { type: 'json' }) as Profile | null
    return Response.json({ profile: profile || emptyProfile() })
  }

  if (req.method === 'PUT') {
    verifyRequestOrigin(req)
    const profile = normalize(await req.json())
    await store.setJSON(key, profile)
    return Response.json({ profile })
  }

  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, PUT' } })
}

export const config: Config = {
  path: '/api/profile'
}
