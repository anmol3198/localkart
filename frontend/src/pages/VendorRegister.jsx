import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Link, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import api, { errorMessage } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useNotify } from '../lib/notify.jsx'
import useTitle from '../lib/useTitle.js'
import ShopForm, { emptyShop, validateShop } from '../components/ShopForm.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import FormSection from '../components/FormSection.jsx'
import PasswordField from '../components/PasswordField.jsx'

const STEPS = ['Your account', 'Shop details', 'Location', 'Delivery']
const SECTIONS = [null, ['details'], ['location'], ['delivery']]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateAccount(a) {
  const e = {}
  if (!a.ownerName.trim()) e.ownerName = 'Your name is required'
  if (!EMAIL.test(a.email)) e.email = 'Enter a valid email'
  if (a.password.length < 6) e.password = 'Use at least 6 characters'
  return e
}

export default function VendorRegister() {
  useTitle('Register your shop')
  const { login } = useAuth()
  const notify = useNotify()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [account, setAccount] = useState({ ownerName: '', email: '', password: '' })
  const [shop, setShop] = useState(emptyShop)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setAcc = (key) => (e) => setAccount({ ...account, [key]: e.target.value })
  const err = (key) => ({ error: Boolean(errors[key]), helperText: errors[key] })
  const last = step === STEPS.length - 1

  const validate = (s) => (s === 0 ? validateAccount(account) : validateShop(shop, SECTIONS[s]))

  const next = async (e) => {
    e.preventDefault()
    const found = validate(step)
    setErrors(found)
    if (Object.keys(found).length) return
    if (!last) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register', { ...account, ...shop })
      login(data.token)
      notify('Your shop is live! Now add the items you sell.')
      navigate('/vendor')
    } catch (err) {
      const msg = errorMessage(err)
      setError(msg)
      // Most sign-up failures (e.g. email already registered) are fixed on the first step.
      if (/email|password|owner/i.test(msg)) setStep(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  const back = () => { setErrors({}); setStep(step - 1) }

  return (
    <AuthLayout>
      <Box component="form" onSubmit={next} noValidate>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1">Register your shop</Typography>
            <Typography color="text.secondary">Takes about 2 minutes. You can change everything later.</Typography>
          </Box>

          <Stepper activeStep={step} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: 11, sm: 13 } } }}>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {error && <Alert severity="error">{error}</Alert>}

          {step === 0 && (
            <FormSection icon={<PersonIcon />} title="Owner account" subtitle="You'll use this email and password to log in">
              <Stack spacing={2}>
                <TextField label="Your name" required autoComplete="name" autoFocus value={account.ownerName} onChange={setAcc('ownerName')} {...err('ownerName')} />
                <TextField label="Email" type="email" required autoComplete="email" value={account.email} onChange={setAcc('email')} {...err('email')} />
                <PasswordField label="Password" required autoComplete="new-password" value={account.password} onChange={setAcc('password')} {...err('password')} helperText={errors.password || 'At least 6 characters'} />
              </Stack>
            </FormSection>
          )}
          {step > 0 && <ShopForm value={shop} onChange={setShop} errors={errors} sections={SECTIONS[step]} />}

          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
            {step > 0 ? <Button onClick={back} startIcon={<ArrowBackIcon />} size="large">Back</Button> : <span />}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={busy}
              endIcon={busy ? <CircularProgress size={18} color="inherit" /> : last ? <CheckIcon /> : <ArrowForwardIcon />}
            >
              {last ? (busy ? 'Creating your shop…' : 'Create my shop') : 'Continue'}
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already registered? <Link component={RouterLink} to="/vendor/login" sx={{ fontWeight: 600 }}>Log in</Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
