const Expense = require('../models/Expense');
const Group = require('../models/Group');

// Add a new expense to a group, computing splits based on splitType
exports.addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splitType, customSplits } = req.body;
    // customSplits (for unequal/percentage): [{ user, value }]
    // - unequal: value = exact amount owed
    // - percentage: value = percentage (0-100)

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const memberIds = group.members.map(m => m.toString());
    let splits = [];

    if (splitType === 'equal') {
      const share = amount / memberIds.length;
      splits = memberIds.map(userId => ({
        user: userId,
        amountOwed: parseFloat(share.toFixed(2))
      }));
    } else if (splitType === 'unequal') {
      const total = customSplits.reduce((sum, s) => sum + s.value, 0);
      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({ message: 'Split amounts must add up to the total expense amount' });
      }
      splits = customSplits.map(s => ({
        user: s.user,
        amountOwed: s.value
      }));
    } else if (splitType === 'percentage') {
      const totalPct = customSplits.reduce((sum, s) => sum + s.value, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        return res.status(400).json({ message: 'Percentages must add up to 100' });
      }
      splits = customSplits.map(s => ({
        user: s.user,
        amountOwed: parseFloat(((s.value / 100) * amount).toFixed(2))
      }));
    } else {
      return res.status(400).json({ message: 'Invalid split type' });
    }

    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      paidBy,
      splitType,
      splits
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Calculate net balances per member, then simplify into minimal set of transactions
exports.getGroupBalances = async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId });

    // net[userId] = positive means they are owed money, negative means they owe money
    const net = {};

    expenses.forEach(exp => {
      const paidBy = exp.paidBy.toString();
      net[paidBy] = (net[paidBy] || 0) + exp.amount;

      exp.splits.forEach(s => {
        const userId = s.user.toString();
        net[userId] = (net[userId] || 0) - s.amountOwed;
      });
    });

    // Simplify debts: greedily match largest creditor with largest debtor
    const creditors = [];
    const debtors = [];

    Object.entries(net).forEach(([userId, balance]) => {
      const rounded = parseFloat(balance.toFixed(2));
      if (rounded > 0.01) creditors.push({ userId, amount: rounded });
      else if (rounded < -0.01) debtors.push({ userId, amount: -rounded });
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settled = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: parseFloat(settled.toFixed(2))
      });

      debtor.amount -= settled;
      creditor.amount -= settled;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    res.json({ net, transactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};