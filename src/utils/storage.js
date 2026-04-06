const DRAFTS_KEY = 'podium_drafts'
const PROFILE_KEY = 'podium_profile'

export function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || []
  } catch {
    return []
  }
}

export function saveDraft(draft) {
  const drafts = getDrafts()
  const existing = drafts.findIndex((d) => d.id === draft.id)
  if (existing >= 0) {
    drafts[existing] = { ...draft, updatedAt: Date.now() }
  } else {
    drafts.unshift({ ...draft, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() })
  }
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  return drafts
}

export function deleteDraft(id) {
  const drafts = getDrafts().filter((d) => d.id !== id)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  return drafts
}

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}
