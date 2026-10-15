import { useEffect } from 'react'

/** Sets the browser tab title for the current page. */
export default function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · LocalKart` : 'LocalKart - Shops near you'
  }, [title])
}
