import jwt from 'jsonwebtoken'
import logger from '../logger.js'

const JWT_SECRET = process.env.JWT_SECRET

export const signToken = (id, expiry) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: expiry })
}

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (err) {
        logger.error(`Error verifying token: ${err}`)
        return false
    }
}
