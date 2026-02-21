// client/src/hooks/useCsrf.js
/**
 * Hook to read the CSRF token from the cookie and provide it
 * for use in fetch/axios headers on state-changing requests.
 */
export function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Returns headers object with CSRF token included.
 * Use this for any POST/PUT/DELETE from the browser.
 */
export function csrfHeaders(extra = {}) {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
        ...extra,
    };
}
