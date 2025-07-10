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

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or current password incorrect
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

// Şifre değiştirme endpointi
router.post('/change-password', authMiddleware, userController.changePassword);

// Shuffle demo endpointi (eşleştirme ve random mesaj üretimi, DB'ye yazmaz)
router.post('/shuffle-demo', authMiddleware, userController.shuffleDemo);

// Shuffle send endpointi (eşleşmeleri DB'ye kaydeder ve RabbitMQ'ya yollar)
router.post('/shuffle-send', authMiddleware, userController.shuffleSend);

module.exports = router;
