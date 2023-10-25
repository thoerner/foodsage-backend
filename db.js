import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import dotenv from 'dotenv'
dotenv.config()

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

const dbClient = new DynamoDBClient({ 
    region: "us-east-1", 
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
})

export default dbClient