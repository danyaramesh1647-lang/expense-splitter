const Group = require('../models/Group');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, memberEmails } = req.body; // memberEmails: array of emails besides creator

    let memberIds = [req.userId];

    if (memberEmails && memberEmails.length > 0) {
      const members = await User.find({ email: { $in: memberEmails } });
      const foundIds = members.map(m => m._id.toString());
      memberIds = [...new Set([...memberIds, ...foundIds])];
    }

    const group = await Group.create({
      name,
      members: memberIds,
      createdBy: req.userId
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId }).populate('members', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};