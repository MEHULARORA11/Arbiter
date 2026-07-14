export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, options);

  if (res.status === 401) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        // Refresh succeeded, retry the original request once
        res = await fetch(url, options);
      } else {
        // Refresh failed, dispatch event to trigger client logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-failed'));
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-failed'));
      }
    }
  }

  return res;
}
