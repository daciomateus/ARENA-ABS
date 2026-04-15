const STORAGE_KEY = 'arena_abs_pending_reservation'

export function savePendingReservation(payload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function loadPendingReservation() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearPendingReservation() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export { STORAGE_KEY }
