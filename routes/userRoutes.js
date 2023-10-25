import express from 'express'
import { body } from 'express-validator'
import { 
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser
} from '../controllers/userController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', 
    [
        body('name').isLength({ min: 1 }).withMessage('Name is required'),
        body('email').isEmail().withMessage('Email is not valid'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    registerUser
)
router.post('/login', 
    [
        body('email').isEmail().withMessage('Email is not valid'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    loginUser
)
router.get('/profile', authMiddleware, getUserProfile)
router.get('/logout', authMiddleware, logoutUser)

export default router