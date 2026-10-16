// Form rules shared by the website forms. They mirror the API's checks, so people see problems next to the
// field instead of after submitting. The API remains the final check.

export const PHONE_MSG = 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9 (or a landline with STD code, e.g. 080 2345 6789)'

/** "+91 98765-43210" -> "9876543210"; landlines keep their 0 + STD code. Same rules as the API. */
export function normalizePhone(raw) {
  const s = (raw ?? '').trim()
  if (!s) return ''
  let d = s.replace(/[\s\-().]/g, '')
  if (d.startsWith('+91')) d = d.slice(3)
  else if (d.startsWith('+')) return s
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  // Only 09… is surely "0 + mobile": STD codes never start with 9, but 080 (Bengaluru) etc. are landlines.
  if (d.length === 11 && d.startsWith('09')) d = d.slice(1)
  return d
}

const allSame = (s) => new Set(s).size === 1
export const isMobile = (n) => /^[6-9]\d{9}$/.test(n) && !allSame(n)
export const isLandline = (n) => /^0[1-9]\d{9}$/.test(n) && !allSame(n.slice(1))
export const isValidPhone = (n) => isMobile(n) || isLandline(n)

/** 98765 43210 / 080 2345 6789, for display. */
export function formatPhone(n) {
  if (isMobile(n)) return `${n.slice(0, 5)} ${n.slice(5)}`
  if (isLandline(n)) return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
  return n
}

export const EMAIL_MSG = 'Enter a valid email, like name@gmail.com'
const EMAIL = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/
export const isValidEmail = (e) => e.length <= 254 && EMAIL.test(e)

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.in', 'hotmail.com', 'outlook.com', 'rediffmail.com', 'icloud.com', 'live.com']

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

/** "asha@gmial.com" -> "asha@gmail.com", or null when the domain looks fine. */
export function emailSuggestion(email) {
  const at = email.lastIndexOf('@')
  if (at < 1) return null
  const domain = email.slice(at + 1).toLowerCase()
  if (!domain || COMMON_DOMAINS.includes(domain)) return null
  const best = COMMON_DOMAINS.map((d) => [d, distance(domain, d)]).sort((x, y) => x[1] - y[1])[0]
  return best && best[1] > 0 && best[1] <= 2 ? `${email.slice(0, at)}@${best[0]}` : null
}

export const PASSWORD_MSG = 'Password must be 8-72 characters with at least one letter and one number'
export const isValidPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d)\S.{6,70}\S$/.test(p)

/** 0-4 with a label, for the strength bar. */
export function passwordStrength(p) {
  if (!p) return { score: 0, label: '' }
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p) || (/[a-z]/.test(p) && /[A-Z]/.test(p))) score++
  if (!isValidPassword(p)) score = Math.min(score, 1)
  return { score, label: ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][score] }
}

export const NAME_MSG = 'Enter your name using letters (2-80 characters)'
// \p{M}: vowel signs in Indian scripts (e.g. प्रिया) are marks, not letters.
export const isValidName = (n) => /^(?=.*\p{L})[\p{L}\p{M} .'-]{2,80}$/u.test(n.trim().replace(/\s+/g, ' '))

/** Text that must have 2+ characters and at least one letter/number (shop and item names). */
export const hasRealText = (s, min, max) => {
  const t = (s ?? '').trim()
  return t.length >= min && t.length <= max && /[\p{L}\p{N}]/u.test(t)
}

export const inIndia = (lat, lng) => lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 97.5

/** Money: >= 0, at most 2 decimals and at most `max`. Returns an error message or null. */
export function moneyError(value, label, max) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  if (Number.isNaN(n)) return `${label} must be a number`
  if (n < 0) return `${label} cannot be negative`
  if (n > max) return `${label} can be at most ₹${max.toLocaleString('en-IN')}`
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return `${label} can have at most 2 decimal places`
  return null
}
