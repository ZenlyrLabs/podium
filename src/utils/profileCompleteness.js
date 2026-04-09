// Calculate profile completeness as a percentage (0-100).
// Breakdown:
//   Name + headline (title):     20%
//   Industry:                    15%
//   Expertise:                   20%
//   Target audience:             15%
//   LinkedIn PDF uploaded:       30%
export function calculateProfileCompleteness(profile = {}) {
  let score = 0
  if (profile.name?.trim() && profile.headline?.trim()) score += 20
  if (profile.industry?.trim()) score += 15
  if (profile.expertise?.trim()) score += 20
  if (profile.targetAudience?.trim()) score += 15
  if (profile.pdfUploaded) score += 30
  return score
}

// High-level status tiers used by the quality indicator and prompt selection.
//   'full'    — LinkedIn PDF has been uploaded (rich voice data)
//   'partial' — Some fields filled in but no PDF
//   'none'    — Essentially empty profile
export function getProfileStatus(profile = {}) {
  if (profile.pdfUploaded) return 'full'
  const hasAny =
    profile.name?.trim() ||
    profile.headline?.trim() ||
    profile.summary?.trim() ||
    profile.expertise?.trim() ||
    profile.industry?.trim() ||
    profile.targetAudience?.trim()
  return hasAny ? 'partial' : 'none'
}
