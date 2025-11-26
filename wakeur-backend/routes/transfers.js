const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const verifyToken = require('../middleware/auth');

router.get('/', transferController.getAllTransfers);
router.post('/', verifyToken, transferController.createTransfer);

module.exports = router;
