/**
 * @swagger
 * tags:
 *   name: User
 *   description: User endpoints
 */

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: List all users (email and username)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/list', authMiddleware, userController.list);

// Profil güncelleme endpointi
router.patch('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
