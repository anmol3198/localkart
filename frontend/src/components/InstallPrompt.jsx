import { useEffect, useState } from 'react'
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import IosShareIcon from '@mui/icons-material/IosShare'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import InstallMobileIcon from '@mui/icons-material/InstallMobile'
import { OPEN_EVENT, isIos, isPhone, isStandalone, recentlyDismissed, rememberDismissed } from '../lib/install.js'

/**
 * Invites phone visitors to add LocalKart to their home screen. Android/Chrome gets a one-tap Install button
 * (the browser's own prompt); iPhone gets the two Share-menu steps, since Safari has no install button.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState(false) // opened from a link, so show even on desktop

  useEffect(() => {
    if (isStandalone()) return undefined
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      if (isPhone() && !recentlyDismissed()) setOpen(true)
    }
    const onOpen = () => { setManual(true); setOpen(true) }
    const onInstalled = () => { setOpen(false); setDeferred(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener(OPEN_EVENT, onOpen)
    window.addEventListener('appinstalled', onInstalled)
    // iPhone never fires beforeinstallprompt; offer the steps after a short look around.
    const timer = isIos() && isPhone() && !recentlyDismissed() ? setTimeout(() => setOpen(true), 8000) : null
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener(OPEN_EVENT, onOpen)
      window.removeEventListener('appinstalled', onInstalled)
      clearTimeout(timer)
    }
  }, [])

  const close = () => { setOpen(false); if (!manual) rememberDismissed(); setManual(false) }

  const install = async () => {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    setOpen(false)
    if (outcome !== 'accepted') rememberDismissed()
  }

  if (!open) return null
  const ios = isIos()
  const installed = isStandalone()

  return (
    <Card role="dialog" aria-label="Install LocalKart" sx={{
      position: 'fixed', zIndex: 1300, left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))',
      mx: 'auto', maxWidth: 440, p: 2, boxShadow: '0 12px 40px rgba(5,61,48,0.25)',
    }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box component="img" src="/icons/icon-192.png" alt="" sx={{ width: 48, height: 48, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }}>Get the LocalKart app</Typography>
          {installed ? (
            <Typography variant="body2" color="text.secondary">You’re already using the installed app.</Typography>
          ) : ios ? (
            <Typography variant="body2" color="text.secondary" component="div">
              Free, no download needed. In Safari, tap <IosShareIcon sx={{ fontSize: 18, verticalAlign: 'text-bottom', color: 'primary.main' }} /> <b>Share</b>,
              then <AddBoxOutlinedIcon sx={{ fontSize: 18, verticalAlign: 'text-bottom', color: 'primary.main' }} /> <b>Add to Home Screen</b>.
            </Typography>
          ) : deferred ? (
            <Typography variant="body2" color="text.secondary">Free and tiny. Opens straight to shops near you, right from your home screen.</Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.
            </Typography>
          )}
          {deferred && !ios && !installed && (
            <Button variant="contained" size="small" startIcon={<InstallMobileIcon />} onClick={install} sx={{ mt: 1.25 }}>Install</Button>
          )}
        </Box>
        <IconButton size="small" aria-label="Not now" onClick={close} sx={{ mt: -0.5, mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
      </Stack>
    </Card>
  )
}
