const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const verifyToken = require('../middleware/auth');

router.get('/', categoryController.getAllCategories);
router.post('/', verifyToken, categoryController.createCategory);

module.exports = router;
