import express from 'express'
import { body } from 'express-validator'
import { 
    chooseRecipe,
    getRecipes
} from '../controllers/recipeController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/getRecipes', authMiddleware, getRecipes)
router.get('/chooseRecipe', authMiddleware, chooseRecipe)

export default router