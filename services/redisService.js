import Redis from 'ioredis'
import logger from '../logger.js'

const redis = new Redis()

redis.on("error", function(error) {
    logger.error(`Error connecting to Redis: ${error}`)
})
  
redis.on("ready", function() {
    logger.info("Redis is ready");
})

process.on('exit', () => {
    redis.quit()
})

process.on('uncaughtException', () => {
    redis.quit()
})

process.on('unhandledRejection', () => {
    redis.quit()
})

export default redis

