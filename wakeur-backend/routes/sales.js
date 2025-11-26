const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const verifyToken = require('../middleware/auth');

router.get('/', salesController.getAllSales);
router.post('/', verifyToken, salesController.recordSale);

module.exports = router;
