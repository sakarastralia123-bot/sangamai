const express = require('express');
const adminController = require('../controllers/adminController');
const validateRequest = require('../middleware/validateRequest');
const { protect, requireRole } = require('../middleware/auth');
const { bodySizeLimiter, strictSchemaValidation } = require('../middleware/rateLimiter');
const { body, param } = require('express-validator');

const router = express.Router();

// Everything below: authenticated admins only. There is no public surface.
router.use(protect, requireRole('admin'));

router.get('/stats', adminController.getStats);

router.get('/users', adminController.listUsers);

router.patch(
  '/users/:id/role',
  bodySizeLimiter,
  [body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')],
  validateRequest,
  strictSchemaValidation(['role']),
  adminController.setUserRole
);

const idParam = [param('id').isMongoId().withMessage('Invalid user ID')];

router.delete('/users/:id/sessions', idParam, validateRequest, adminController.revokeUserSessions);
router.post('/users/:id/lock', idParam, validateRequest, adminController.lockUser);
router.post('/users/:id/unlock', idParam, validateRequest, adminController.unlockUser);

module.exports = router;
