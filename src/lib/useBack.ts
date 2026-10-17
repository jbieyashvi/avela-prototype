import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/** Go back in history, or to `fallback` when the screen was opened directly (deep link / demo navigator). */
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
