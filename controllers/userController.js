import bcrypt from 'bcryptjs'  
import { v4 as uuidv4 } from 'uuid'  
import dbClient from '../db.js'  
import { PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";  
import { validationResult } from 'express-validator' 
import redis from '../services/redisService.js' 
import { signToken } from '../services/jwtService.js' 
import logger from '../logger.js' 

// Function for handling user registration
export const registerUser = async (req, res) => {
    // Validate the request body
    const errors = validationResult(req)
    // If the request body is invalid, send an error response
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { name, email, password } = req.body

    // Query DynamoDB to check if user already exists using the provided email
    const userExistsParams = {
        TableName: 'foodsage_users',  // Name of the table to query
        IndexName: 'email-index',  // Name of the index to use for the query
        KeyConditionExpression: 'email = :e',  // Condition for the query
        ExpressionAttributeValues: {
          ':e': { S: email },  // The value to compare the email attribute against
        },
    }

    const getUserCmd = new QueryCommand(userExistsParams)

    try {
        // Send the query to DynamoDB
        const userExists = await dbClient.send(getUserCmd)
        // If a user with the provided email already exists, send an error response
        if (userExists.Items.length > 0) {
            return res.status(400).json({ message: 'User already exists' })
        }
    } catch (err) {
        // If an error occurs, log it and send an error response
        logger.error(err)
        return res.status(500).json({ message: 'Internal server error' })
    }

    // Encrypt the password
    const salt = await bcrypt.genSalt(10)
    const encryptedPassword = await bcrypt.hash(password, salt)

    // Create a new user in DynamoDB
    const uuid = uuidv4();  // Generate a unique ID for the new user

    const createUserParams = {
        TableName: 'foodsage_users',  // Name of the table to put the item in
        Item: {
            UserID: { S: uuid },  // The user's ID
            name: { S: name },  // The user's name
            email: { S: email },  // The user's email
            password: { S: encryptedPassword },  // The user's hashed password
        },
    }

    const putUserCmd = new PutItemCommand(createUserParams)

    try {
        // Send the put item command to DynamoDB
        await dbClient.send(putUserCmd)
    } catch (err) {
        // If an error occurs, log it and send an error response
        logger.error(err)
        return res.status(500).json({ message: 'Internal server error' })
    }

    // Send a success response
    res.status(201).json({ message: 'User created successfully' })
}

// Function for handling user login
export const loginUser = async (req, res) => {
    // Validate the request body
    const errors = validationResult(req)
    // If the request body is invalid, send an error response
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { email, password } = req.body

    // Query DynamoDB to check if a user exists with the provided email
    const getUserParams = {
        TableName: 'foodsage_users',  // Name of the table to query
        IndexName: 'email-index',  // Name of the index to use for the query
        KeyConditionExpression: 'email = :e',  // Condition for the query
        ExpressionAttributeValues: {
            ':e': { S: email },  // The value to compare the email attribute against
        },
    }

    const getUserCmd = new QueryCommand(getUserParams)

    let user = null
    try {
        // Send the query to DynamoDB
        user = await dbClient.send(getUserCmd)
        // If no user exists with the provided email, send an error response
        if (user.Items.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }
    } catch (err) {
        // If an error occurs, log it and send an error response
        logger.error(err)
        return res.status(500).json({ message: 'Internal server error' })
    }

    // Compare the provided password with the hashed password stored in DynamoDB
    const encryptedPassword = user.Items[0].password.S
    const isMatch = await bcrypt.compare(password, encryptedPassword)

    // If the passwords don't match, send an error response
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' })
    }

    // If the passwords match, create a new JWT for the user and send it in the response
    const id = user.Items[0].UserID.S
    const token = signToken(id, '1h')
    res.header('Authorization', token).json({ token })

}

// Function for getting a user's profile
export const getUserProfile = async (req, res) => {
    const { userID } = req

    // Query DynamoDB to get the user with the ID from the JWT
    const getUserParams = {
        TableName: 'foodsage_users',  // Name of the table to query
        KeyConditionExpression: 'UserID = :id',  // Condition for the query
        ExpressionAttributeValues: {
            ':id': { S: userID },  // The value to compare the UserID attribute against
        }
    }

    const getUserCmd = new QueryCommand(getUserParams)
    
    let user
    try {
        // Send the query to DynamoDB
        user = await dbClient.send(getUserCmd)
    } catch (err) {
        // If an error occurs, log it and send an error response
        logger.error(err)
        return res.status(500).json({ message: 'Internal server error' })
    }

    // If no user exists with the provided ID, send an error response
    if (user.Items.length === 0) {
        return res.status(404).json({ message: 'User not found' })
    }

    // Remove the user's password from the response
    delete user.Items[0].password

    // Send the user's profile in the response
    res.status(200).json({ user: user.Items[0] })

}

// Function for handling user logout
export const logoutUser = async (req, res) => {
    // Get the JWT from the request headers
    const token = req.header('Authorization')

    // Blacklist the JWT
    await redis.set(token, 'blacklisted', 'EX', 60 * 60)

    // Remove the JWT from the response headers and send a success response
    res.header('Authorization', '').json({ message: 'User logged out' })
}