const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createGroup, getMyGroups, getGroupById } = require('../controllers/groupController');

router.use(auth); // all group routes require login

router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroupById);

module.exports = router;