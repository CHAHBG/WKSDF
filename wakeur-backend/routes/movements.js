const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const verifyToken = require('../middleware/auth');

router.get('/', movementController.getAllMovements);
router.post('/', verifyToken, movementController.createMovement);

module.exports = router;
