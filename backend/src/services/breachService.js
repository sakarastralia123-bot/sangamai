const crypto = require('crypto');

// HaveIBeenPwned Pwned Passwords screening (k-anonymity).
// Only the first 5 chars of the SHA-1 ever leave the server — the full hash
// and the password itself never touch the wire. A match means this exact
// password is in known breach corpora, i.e. the first thing a credential-
// stuffing list will try.
//
// Design choices:
//  - Fail-OPEN: if HIBP is unreachable/slow, registration proceeds (logged).
//    Availability of signup beats a screening check; stuffing is still
//    throttled by rate limits + lockout.
//  - Prefix cache (1h TTL): popular prefixes resolve without a network call.
//  - 3s timeout so a slow HIBP never hangs registration.
const RANGE_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;
const HIBP_TIMEOUT_MS = 3000;

function getCachedRange(prefix) {
  const entry = RANGE_CACHE.get(prefix);
  if (entry && Date.now() - entry.at < CACHE_TTL_MS) return entry.body;
  RANGE_CACHE.delete(prefix);
  return null;
}

function setCachedRange(prefix, body) {
  if (RANGE_CACHE.size > 5000) RANGE_CACHE.clear();
  RANGE_CACHE.set(prefix, { at: Date.now(), body });
}

function clearBreachCache() {
  RANGE_CACHE.clear();
}

async function fetchRange(prefix) {
  const cached = getCachedRange(prefix);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);
  try {
    const res = await globalThis.fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'sangam-ai-auth' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HIBP status ${res.status}`);
    const body = await res.text();
    setCachedRange(prefix, body);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

// Returns true if the password appears in known breaches.
// Never throws — returns false (allow) on any infrastructure failure.
async function isPasswordBreached(plainPassword) {
  try {
    if (!plainPassword || typeof plainPassword !== 'string') return false;
    const sha1 = crypto.createHash('sha1').update(plainPassword, 'utf8').digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const body = await fetchRange(prefix);
    return body.split('\n').some((line) => line.split(':')[0].trim() === suffix);
  } catch (err) {
    console.warn('Breach check unavailable, failing open', { error: err.message });
    return false;
  }
}

module.exports = { isPasswordBreached, clearBreachCache };
