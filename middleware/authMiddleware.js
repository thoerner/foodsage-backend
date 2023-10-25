import { verifyToken } from '../services/jwtService.js'
import redis from "../services/redisService.js"

export const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied' })
    }

    const isBlacklisted = await redis.get(token)

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Access denied' })
    }

    const verified = verifyToken(token)
    if (!verified) {
        return res.status(401).json({ message: 'Access denied' })
    }

    // Store user id for use in other routes
    req.userID = verified.id

    next()
}
