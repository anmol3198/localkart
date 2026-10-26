/** Helpers for installing the website as an app (Add to Home Screen). */
const DISMISS_KEY = 'localkart_install_dismissed'
const DISMISS_DAYS = 30
export const OPEN_EVENT = 'localkart:install'

// Always the newest Android build: attach the APK as "localkart.apk" to a GitHub release and this link follows it.
export const ANDROID_APK_URL = import.meta.env.VITE_ANDROID_APK_URL || 'https://github.com/anmol3198/localkart/releases/latest/download/localkart.apk'

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

// iPhone/iPad Safari has no install button; people add it from the Share menu. (iPadOS reports itself as a Mac with touch.)
export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isAndroid = () => /android/i.test(navigator.userAgent)

export const isPhone = () => window.matchMedia?.('(max-width: 900px) and (pointer: coarse)').matches

export function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return at > 0 && Date.now() - at < DISMISS_DAYS * 864e5
  } catch {
    return false
  }
}

export function rememberDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* private mode: ask again next time */ }
}

/** Opens the install card from anywhere, e.g. a "Get the app" link. */
export const openInstall = () => window.dispatchEvent(new Event(OPEN_EVENT))
