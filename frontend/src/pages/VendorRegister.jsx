import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, FormHelperText, LinearProgress, Link, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import api, { errorMessage } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useNotify } from '../lib/notify.jsx'
import useTitle from '../lib/useTitle.js'
import ShopForm, { cleanShop, emptyShop, validateShop } from '../components/ShopForm.jsx'
import { EMAIL_MSG, NAME_MSG, PASSWORD_MSG, emailSuggestion, isValidEmail, isValidName, isValidPassword, passwordStrength } from '../lib/validation.js'
import AuthLayout from '../components/AuthLayout.jsx'
import FormSection from '../components/FormSection.jsx'
import PasswordField from '../components/PasswordField.jsx'

const STEPS = ['Your account', 'Shop details', 'Location', 'Delivery']
const SECTIONS = [null, ['details'], ['location'], ['delivery']]
const STRENGTH_COLOR = ['error', 'error', 'warning', 'success', 'success']

function validateAccount(a) {
  const e = {}
  if (!a.ownerName.trim()) e.ownerName = 'Your name is required'
  else if (!isValidName(a.ownerName)) e.ownerName = NAME_MSG
  if (!a.email.trim()) e.email = 'Email is required'
  else if (!isValidEmail(a.email.trim())) e.email = EMAIL_MSG
  if (!a.password) e.password = 'Password is required'
  else if (!isValidPassword(a.password)) e.password = PASSWORD_MSG
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
  const [touched, setTouched] = useState({})
  const [agreed, setAgreed] = useState(false)
  const setAcc = (key) => (e) => setAccount({ ...account, [key]: e.target.value })
  const liveAccount = validateAccount(account)
  const accErr = (key) => errors[key] || (touched[key] ? liveAccount[key] : undefined)
  const err = (key) => ({ error: Boolean(accErr(key)), helperText: accErr(key), onBlur: () => setTouched((t) => ({ ...t, [key]: true })) })
  const suggestion = isValidEmail(account.email.trim()) ? emailSuggestion(account.email.trim()) : null
  const strength = passwordStrength(account.password)
  const last = step === STEPS.length - 1

  const validate = (s) => (s === 0 ? validateAccount(account) : validateShop(shop, SECTIONS[s]))

  const next = async (e) => {
    e.preventDefault()
    const found = validate(step)
    if (last && !agreed) found.terms = 'Please accept the Terms of Use and Privacy Policy'
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
      const { data } = await api.post('/auth/register', { ...account, ownerName: account.ownerName.trim(), email: account.email.trim().toLowerCase(), ...cleanShop(shop), acceptTerms: agreed })
      login(data.token)
      notify('Shop registered! We’ll review it shortly. Add your items meanwhile.')
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
                <Box>
                  <TextField label="Email" type="email" required fullWidth autoComplete="email" value={account.email} onChange={setAcc('email')} {...err('email')} />
                  {suggestion && (
                    <Alert severity="warning" sx={{ mt: 1 }} action={<Button color="inherit" size="small" onClick={() => setAccount({ ...account, email: suggestion })}>Use it</Button>}>
                      Did you mean <b>{suggestion}</b>?
                    </Alert>
                  )}
                </Box>
                <Box>
                  <PasswordField label="Password" required fullWidth autoComplete="new-password" value={account.password} onChange={setAcc('password')} {...err('password')}
                    helperText={accErr('password') || 'At least 8 characters, with letters and numbers'} />
                  {account.password && (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1, px: 0.5 }}>
                      <LinearProgress variant="determinate" value={(strength.score / 4) * 100} color={STRENGTH_COLOR[strength.score]} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 64, color: `${STRENGTH_COLOR[strength.score]}.main` }}>{strength.label}</Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </FormSection>
          )}
          {step > 0 && <ShopForm value={shop} onChange={setShop} errors={errors} sections={SECTIONS[step]} />}
          {last && (
            <Box>
              <FormControlLabel
                control={<Checkbox checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((errs) => ({ ...errs, terms: undefined })) }} />}
                label={<Typography variant="body2">
                  I own this shop or am authorised to list it, I’m 18 or older, and I agree to the{' '}
                  <Link component={RouterLink} to="/terms" target="_blank" rel="noopener">Terms of Use</Link> and{' '}
                  <Link component={RouterLink} to="/privacy" target="_blank" rel="noopener">Privacy Policy</Link>.
                </Typography>}
                sx={{ alignItems: 'flex-start', '& .MuiCheckbox-root': { mt: -0.75 } }}
              />
              {errors.terms && <FormHelperText error sx={{ ml: 4 }}>{errors.terms}</FormHelperText>}
            </Box>
          )}

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
