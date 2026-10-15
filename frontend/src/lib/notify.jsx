import { createContext, useCallback, useContext, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'

const NotifyContext = createContext(() => {})

/** App-wide toast. `notify('Saved')` or `notify('Failed', 'error')`. */
export function NotifyProvider({ children }) {
  const [toast, setToast] = useState(null)
  const notify = useCallback((message, severity = 'success') => setToast({ message, severity, key: Date.now() }), [])
  const close = (_e, reason) => reason !== 'clickaway' && setToast(null)

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={close} severity={toast?.severity || 'success'} variant="filled" sx={{ width: '100%', boxShadow: 6 }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotify = () => useContext(NotifyContext)
