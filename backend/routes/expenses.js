const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

/**
 * EXPENSE ROUTES
 * All expense-related endpoints
 * All routes require authentication
 */

// All routes require authentication
router.use(authenticate);

// Expense CRUD
router.post('/', expenseController.create);
router.put('/:expenseId', expenseController.update);
router.delete('/:expenseId', expenseController.remove);

module.exports = router;
