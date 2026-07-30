const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addExpense, getGroupExpenses, getGroupBalances } = require('../controllers/expenseController');

router.use(auth);

router.post('/', addExpense);
router.get('/group/:groupId', getGroupExpenses);
router.get('/group/:groupId/balances', getGroupBalances);

module.exports = router;