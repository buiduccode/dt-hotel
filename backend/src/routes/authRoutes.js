const express = require('express');
const router  = express.Router();

const {
    register, login,
    getProfile, updateProfile, changePassword,
    getAllUsers, createUser, updateUser, deleteUser
} = require('../controllers/authController');

const { authenticate } = require('../middlewares/authMiddleware');
const { authorize, ROLES } = require('../middlewares/roleMiddleware');

// Public
router.post('/register', register);
router.post('/login',    login);

// Authenticated
router.get ('/profile',          authenticate, getProfile);
router.put ('/profile',          authenticate, updateProfile);
router.put ('/change-password',  authenticate, changePassword);

// Admin / Staff (quản lý người dùng)
router.get   ('/users',     authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getAllUsers);
router.post  ('/users',     authenticate, authorize(ROLES.ADMIN),              createUser);
router.put   ('/users/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateUser);
router.delete('/users/:id', authenticate, authorize(ROLES.ADMIN),              deleteUser);

module.exports = router;
