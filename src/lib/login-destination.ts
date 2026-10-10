import { getRedirectPath } from './auth'

/** Only resume routes belonging to the authenticated role; never external URLs. */
export function loginDestination(role: string, from: unknown): string {
  const fallback = getRedirectPath(role)
  if (typeof from !== 'string' || /[\\\x00-\x20]/.test(from)) return fallback
  if (from !== fallback && !from.startsWith(`${fallback}/`) && !from.startsWith(`${fallback}?`) && !from.startsWith(`${fallback}#`)) return fallback
  const path = from.split(/[?#]/)[0]
  if (path.split('/').some(part => part === '.' || part === '..' || part.includes('%'))) return fallback
  if (path === '/admin/login' || path === '/admin/recuperar-senha') return fallback
  return from
}
