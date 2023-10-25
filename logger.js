import winston from "winston"

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    defaultMeta: { service: 'user-service'},
    transports: [
        // Log to console in development
        new winston.transports.Console(),

        // Log to file in production
        new winston.transports.File({ filename: './logs/logfile.log' }),
    ],
})

export default logger