import express from 'express'
import { body } from 'express-validator'
import { 
    getInventory, 
    addItem, 
    deleteItem,
    lookupProduct
} from '../controllers/inventoryController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/:userID', authMiddleware, getInventory)
router.get('/lookup/:upc', lookupProduct)
router.post('/:userID', 
    authMiddleware,
    [
        body('item').isLength({ min: 1 }).withMessage('Item is required'),
    ],
    addItem
)
router.delete('/:userID', 
    authMiddleware,
    [
        body('item').isLength({ min: 1 }).withMessage('Item is required'),
    ],
    deleteItem
)

export default router