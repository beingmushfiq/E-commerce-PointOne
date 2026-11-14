/**
 * Persistent Guest & Cart Session Manager
 * Guarantees a stable session identifier across navigation and page reloads.
 */

const SESSION_STORAGE_KEY = 'cp_guest_session_id';

export function getGuestSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return 'guest_fallback_session';
  }
}

export function resetGuestSessionId(): string {
  try {
    const newSession = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    localStorage.setItem(SESSION_STORAGE_KEY, newSession);
    return newSession;
  } catch {
    return 'guest_fallback_session';
  }
}
