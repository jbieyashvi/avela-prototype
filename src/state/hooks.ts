import { useCallback } from 'react'
import { fmtTime } from '../lib/time'
import { useStore } from './store'

/** Shared medication actions so Taken/Undo behave identically everywhere. */
export function useMedicationActions() {
  const { actions, showToast } = useStore()

  const markTaken = useCallback(
    (medId: string) => {
      const log = actions.logTaken(medId)
      showToast({
        message: `Logged as taken at ${fmtTime(log.at)}`,
        tone: 'success',
        action: { label: 'Undo', onClick: () => actions.undoLog(log.id) },
      })
    },
    [actions, showToast],
  )

  const undoTaken = useCallback(
    (logId: string) => {
      actions.undoLog(logId)
      showToast({ message: 'Log removed' })
    },
    [actions, showToast],
  )

  return { markTaken, undoTaken }
}
