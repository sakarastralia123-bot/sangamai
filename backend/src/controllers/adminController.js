const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Session = require('../models/Session');
const { revokeAllUserSessions } = require('../services/sessionService');
const { authEvent } = require('../utils/logger');

// GET /api/admin/stats — fleet overview. Admin only.
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newToday, newWeek, admins, locked, activeSessions] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: dayAgo } }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ lockUntil: { $gt: now } }),
    Session.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
  ]);

  res.status(200).json(
    ApiResponse.success(
      { totalUsers, newToday, newWeek, admins, locked, activeSessions },
      'OK'
    )
  );
});

// GET /api/admin/users?q=&page=&limit= — paginated, searchable. Admin only.
// User.toJSON strips password/tokens automatically.
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const q = String(req.query.q || '').trim().slice(0, 100);

  const filter = q
    ? {
        $or: [
          { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);

  res.status(200).json(
    ApiResponse.success(
      { total, page, limit, users: users.map((u) => u.toJSON()) },
      'OK'
    )
  );
});

// PATCH /api/admin/users/:id/role { role } — Admin only.
// Refuses self-demotion so you can't lock yourself out of this console.
const setUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    throw ApiError.badRequest('Role must be user or admin');
  }
  if (String(req.user._id) === String(id) && role !== 'admin') {
    throw ApiError.badRequest('You cannot remove your own admin role');
  }

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  user.role = role;
  await user.save({ validateBeforeSave: false });
  authEvent('admin_role_changed', { adminId: req.user._id, targetId: id, role, ip: req.ip });

  res.status(200).json(ApiResponse.success({ user: user.toJSON() }, `Role set to ${role}`));
});

// DELETE /api/admin/users/:id/sessions — kill every session. Admin only.
const revokeUserSessions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  const count = await revokeAllUserSessions(id, 'admin_revoke');
  authEvent('admin_sessions_revoked', { adminId: req.user._id, targetId: id, count, ip: req.ip });

  res.status(200).json(ApiResponse.success({ revokedCount: count }, 'All sessions revoked'));
});

// POST /api/admin/users/:id/lock — force-lock. Admin only.
const lockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (String(req.user._id) === String(id)) {
    throw ApiError.badRequest('You cannot lock your own account');
  }
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await revokeAllUserSessions(id, 'admin_revoke');
  authEvent('admin_user_locked', { adminId: req.user._id, targetId: id, ip: req.ip });

  res.status(200).json(ApiResponse.success({ user: user.toJSON() }, 'Account locked for 30 min'));
});

// POST /api/admin/users/:id/unlock — Admin only.
const unlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  user.lockUntil = undefined;
  user.failedLoginAttempts = 0;
  await user.save({ validateBeforeSave: false });
  authEvent('admin_user_unlocked', { adminId: req.user._id, targetId: id, ip: req.ip });

  res.status(200).json(ApiResponse.success({ user: user.toJSON() }, 'Account unlocked'));
});

module.exports = {
  getStats,
  listUsers,
  setUserRole,
  revokeUserSessions,
  lockUser,
  unlockUser,
};
