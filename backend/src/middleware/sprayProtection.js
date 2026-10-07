const { authEvent } = require('../utils/logger');
const { redactLogData } = require('../utils/redact');

// Cross-email velocity guard — the credential-STUFFING signature.
//
// Per-account lockout and per-IP+email rate limits both miss stuffing,
// because a spray tries each account only once or twice from rotating IPs.
// What a spray cannot hide is VELOCITY: one IP touching many DISTINCT
// emails inside a short window. A normal NAT/household IP almost never
// logs into 20+ different accounts in 15 minutes; a spray rig does.
//
// On trip: generic 429 (reveals nothing about the detection) + a structured
// alert event (`stuffing_spray_detected`) carrying IP, distinct-email count
// and path — this is the hook a SIEM/email alerter consumes in production.
//
// Notes:
//  - In-memory store: correct for a single instance (same trade-off as the
//    existing rate limiters). Multi-instance deployments must move this to
//    Redis — the store is isolated here so the swap is one function.
//  - Threshold/window are read from the environment per request (not cached
//    at boot) so tests can exercise the trip point without restarts.
//  - Only counts requests that CARRY an email field; unknowns don't pollute
//    the signal.
const buckets = new Map(); // ip -> { emails: Map<email, count>, windowStart }

function sprayConfig() {
  return {
    threshold: Math.max(parseInt(process.env.SPRAY_EMAIL_THRESHOLD || '20', 10) || 20, 1),
    windowMs: Math.max(parseInt(process.env.SPRAY_WINDOW_MS || '900000', 10) || 900000, 1),
  };
}

function pruneBucket(bucket, now, windowMs) {
  if (now - bucket.windowStart >= windowMs) {
    bucket.emails.clear();
    bucket.windowStart = now;
  }
}

function sprayGuard() {
  return (req, res, next) => {
    const { threshold, windowMs } = sprayConfig();
    const ip = req.ip || 'unknown';
    const rawEmail = req.body && typeof req.body.email === 'string' ? req.body.email : '';
    const email = rawEmail.toLowerCase().trim();

    if (!email) return next();

    const now = Date.now();
    let bucket = buckets.get(ip);
    if (!bucket) {
      bucket = { emails: new Map(), windowStart: now };
      buckets.set(ip, bucket);
    }
    pruneBucket(bucket, now, windowMs);

    bucket.emails.set(email, (bucket.emails.get(email) || 0) + 1);

    if (bucket.emails.size > threshold) {
      authEvent('stuffing_spray_detected', {
        ip,
        distinctEmails: bucket.emails.size,
        threshold,
        path: req.path,
      });
      console.warn(
        'Credential-stuffing spray blocked',
        redactLogData({ ip, distinctEmails: bucket.emails.size, path: req.path })
      );
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
    }

    return next();
  };
}

// Test + ops helpers (not mounted as routes).
function resetSprayStore() {
  buckets.clear();
}

function sprayStats() {
  return { trackedIps: buckets.size };
}

module.exports = { sprayGuard, resetSprayStore, sprayStats };
