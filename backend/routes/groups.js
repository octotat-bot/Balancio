const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

/**
 * GROUP ROUTES
 * All group-related endpoints
 * All routes require authentication
 */

// All routes require authentication
router.use(authenticate);

// Group CRUD
router.post('/', groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroup);

// Member management
router.post('/:groupId/members', groupController.addMember);
router.delete('/:groupId/members/:memberId', groupController.removeMember); // Remove member
router.delete('/:groupId', groupController.deleteGroup); // Delete group

// Calculations
router.get('/:groupId/balances', groupController.getBalances);
router.get('/:groupId/settlement', groupController.getSettlement);
router.post('/:groupId/settlements', groupController.recordSettlement);
router.delete('/:groupId/settlements/:settlementId', groupController.undoSettlement);
router.get('/:groupId/user-settlements', groupController.getUserSettlements);
router.get('/:groupId/activity', groupController.getActivities);

// Archive management
router.put('/:groupId/archive', groupController.archiveGroup);
router.put('/:groupId/unarchive', groupController.unarchiveGroup);

// Admin management
router.post('/:groupId/admins', groupController.addAdmin);
router.delete('/:groupId/admins/:adminId', groupController.removeAdmin);


module.exports = router;
