import { useEffect, useState } from 'react'
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import IosShareIcon from '@mui/icons-material/IosShare'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import AndroidIcon from '@mui/icons-material/Android'
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen'
import { ANDROID_APK_URL, OPEN_EVENT, isAndroid, isIos, isPhone, isStandalone, recentlyDismissed, rememberDismissed } from '../lib/install.js'

const Steps = () => (
  <Typography variant="body2" color="text.secondary" component="div">
    In Safari, tap <IosShareIcon sx={{ fontSize: 18, verticalAlign: 'text-bottom', color: 'primary.main' }} /> <b>Share</b>,
    then <AddBoxOutlinedIcon sx={{ fontSize: 18, verticalAlign: 'text-bottom', color: 'primary.main' }} /> <b>Add to Home Screen</b>. Free, no download.
  </Typography>
)

/**
 * "Get the app" card. Android: download the full app (APK), or add the website to the home screen in one tap when
 * the browser allows it. iPhone: Safari's Add to Home Screen steps (no other free way onto iPhones).
 * Opens by itself once for phone visitors, and any time from the footer link.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      if (isPhone() && !isStandalone() && !recentlyDismissed()) setOpen(true)
    }
    const onOpen = () => { setManual(true); setOpen(true) }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener(OPEN_EVENT, onOpen)
    window.addEventListener('appinstalled', onInstalled)
    // iPhone never fires beforeinstallprompt; offer the steps after a short look around.
    const timer = isIos() && isPhone() && !isStandalone() && !recentlyDismissed() ? setTimeout(() => setOpen(true), 8000) : null
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener(OPEN_EVENT, onOpen)
      window.removeEventListener('appinstalled', onInstalled)
      clearTimeout(timer)
    }
  }, [])

  const close = () => { setOpen(false); if (!manual) rememberDismissed(); setManual(false) }

  const addToHome = async () => {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    if (outcome === 'accepted') setOpen(false)
  }

  if (!open) return null
  const ios = isIos()
  const android = isAndroid()

  return (
    <Card role="dialog" aria-label="Get the LocalKart app" sx={{
      position: 'fixed', zIndex: 1300, left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))',
      mx: 'auto', maxWidth: 440, p: 2, boxShadow: '0 12px 40px rgba(5,61,48,0.25)',
    }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box component="img" src="/icons/icon-192.png" alt="" sx={{ width: 48, height: 48, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Get the LocalKart app</Typography>
          {ios ? <Steps /> : (
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary">
                {android
                  ? 'Download the Android app, open the file and allow the install when asked.'
                  : 'On Android, download the app below. On iPhone, open this site in Safari and add it to your Home Screen.'}
              </Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<AndroidIcon />} href={ANDROID_APK_URL} onClick={() => setTimeout(() => setOpen(false), 500)}>
                  Download for Android
                </Button>
                {deferred && (
                  <Button variant="outlined" size="small" startIcon={<AddToHomeScreenIcon />} onClick={addToHome}>Add to home screen</Button>
                )}
              </Stack>
              {deferred && <Typography variant="caption" color="text.secondary">“Add to home screen” is a lighter, instant option that needs no download.</Typography>}
            </Stack>
          )}
        </Box>
        <IconButton size="small" aria-label="Close" onClick={close} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
      </Stack>
    </Card>
  )
}
