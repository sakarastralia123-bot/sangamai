const Session = require('../models/Session');
const { generateOpaqueToken, hashToken } = require('../utils/crypto');

async function createSession(userId, ipAddress, userAgent, expiresInDays = 7) {
  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId,
    refreshTokenHash,
    ipAddress,
    userAgent,
    expiresAt,
  });

  return { session, refreshToken };
}

async function findValidSession(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash })
    .populate('userId')
    .lean();

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  return session;
}

async function revokeSession(sessionId, reason = 'logout', replacedBy = null) {
  const session = await Session.findById(sessionId);
  if (!session) return null;

  session.revokedAt = new Date();
  session.revokedReason = reason;
  if (replacedBy) session.replacedBy = replacedBy;
  await session.save({ validateBeforeSave: false });

  return session;
}

async function revokeAllUserSessions(userId, reason = 'password_change') {
  const result = await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason }
  );
  return result.modifiedCount;
}

async function revokeSessionByToken(refreshToken, reason = 'logout') {
  const tokenHash = hashToken(refreshToken);
  const result = await Session.updateOne(
    { refreshTokenHash: tokenHash, revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason }
  );
  return result.modifiedCount > 0;
}

async function detectTokenReuse(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash });

  if (!session) return false;

  if (session.revokedAt && session.revokedReason === 'token_reuse') {
    return true;
  }

  return false;
}

async function handleTokenReuse(userId) {
  await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: 'token_reuse' }
  );
}

async function rotateSession(oldSession, ipAddress, userAgent) {
  // NOTE: oldSession may be a lean (plain) object — never call .save() on it.
  const { session: newSession, refreshToken } = await createSession(
    oldSession.userId,
    ipAddress,
    userAgent
  );

  await Session.updateOne(
    { _id: oldSession._id },
    { revokedAt: new Date(), revokedReason: 'rotated', replacedBy: newSession._id }
  );

  return { session: newSession, refreshToken };
}

// Lookup by token hash INCLUDING revoked/expired sessions.
// Used for reuse detection: a revoked-via-rotation session presented again
// means the refresh token was stolen (attacker replaying an old token).
async function findSessionByHash(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  return Session.findOne({ refreshTokenHash: tokenHash }).lean();
}

async function getUserSessions(userId) {
  return Session.find({ userId })
    .sort({ createdAt: -1 })
    .select('-refreshTokenHash')
    .lean();
}

module.exports = {
  createSession,
  findValidSession,
  findSessionByHash,
  revokeSession,
  revokeAllUserSessions,
  revokeSessionByToken,
  detectTokenReuse,
  handleTokenReuse,
  rotateSession,
  getUserSessions,
};