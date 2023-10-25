import dbClient from "../db.js"
import { QueryCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb"
import { validationResult } from "express-validator"
import { upcLookup } from "../utils/upcLookup.js"

// Function to get the inventory associated with a user
export const getInventory = async (req, res) => {
    // Create the command to query DynamoDB for the inventory associated with the user ID
    const command = new QueryCommand({
        TableName: 'foodsage_inventory',
        KeyConditionExpression: 'UserID = :u',
        ExpressionAttributeValues: {
            ':u': { S: req.userID },
        },
    })

    try {
        // Execute the command and send the result in the response
        const data = await dbClient.send(command)
        if (data.Items.length === 0) {
            return res.status(404).json({ message: 'Inventory not found' })
        }
        res.json(data.Items[0].Inventory.SS)
    } catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Internal server error' })
    }
}

// Function to add an item to a user's inventory
export const addItem = async (req, res) => {
    // Validate the request body using express-validator. If the validation fails, send a 400 error response
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }

    // Extract the item from the request body
    const { item } = req.body

    // Create the command to query DynamoDB for the current inventory associated with the user ID
    const command = new QueryCommand({
        TableName: 'foodsage_inventory',
        KeyConditionExpression: 'UserID = :u',
        ExpressionAttributeValues: {
            ':u': { S: req.userID },
        },
    })

    // Initialize a variable to hold the current inventory
    let currentInventory

    try {
        // Execute the command to get the current inventory
        const data = await dbClient.send(command)
        if (data.Items.length === 0) {
            // If there's no inventory associated with the user ID, set the current inventory to an empty array
            currentInventory = []
        } else {
            // Otherwise, get the current inventory from the response data
            currentInventory = data.Items[0].Inventory.SS
        }
    } catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Internal server error' })
    }

    // Check if the item already exists in the inventory
    if (currentInventory.includes(item)) {
        return res.status(400).json({ message: 'Item already exists' })
    }

    // Add the item to the inventory
    let updatedInventory = currentInventory
    updatedInventory.push(item)

    // Create the command to put the updated inventory into DynamoDB
    const putCommand = new PutItemCommand({
        TableName: 'foodsage_inventory',
        Item: {
            UserID: { S: req.userID },
            Inventory: { SS: updatedInventory },
        },
    })

    try {
        // Execute the command to put the updated inventory into DynamoDB
        await dbClient.send(putCommand)
        res.json({ message: 'Item added successfully' })
    } catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Internal server error' })
    }
}

// Function to delete an item from a user's inventory
export const deleteItem = async (req, res) => {
    // Validate the request body using express-validator. If the validation fails, send a 400 error response
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }

    // Extract the item from the request body
    const { item } = req.body

    // Create the command to query DynamoDB for the current inventory associated with the user ID
    const command = new QueryCommand({
        TableName: 'foodsage_inventory',
        KeyConditionExpression: 'UserID = :u',
        ExpressionAttributeValues: {
            ':u': { S: req.userID },
        },
    })

    // Initialize a variable to hold the current inventory
    let currentInventory

    try {
        // Execute the command to get the current inventory
        const data = await dbClient.send(command)
        if (data.Items.length === 0) {
            // If there's no inventory associated with the user ID, set the current inventory to an empty array
            currentInventory = []
        } else {
            // Otherwise, get the current inventory from the response data
            currentInventory = data.Items[0].Inventory.SS
        }
    }
    catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Internal server error' })
    }

    // Filter out the item from the inventory
    let updatedInventory = currentInventory.filter((i) => i !== item)

    // If the updated inventory has the same length as the current inventory, the item wasn't found
    if (updatedInventory.length === currentInventory.length) {
        return res.status(404).json({ message: 'Item not found' })
    }

    // If the updated inventory is empty, delete the entire inventory for the user ID
    if (updatedInventory.length === 0) {
        const deleteCommand = new DeleteItemCommand({
            TableName: 'foodsage_inventory',
            Key: {
                UserID: { S: req.userID },
            },
        })

        try {
            // Execute the command to delete the inventory
            await dbClient.send(deleteCommand)
            res.json({ message: 'Item deleted successfully' })
            return
        } catch (err) {
            // If there's an error, log it and send a 500 error response
            res.status(500).json({ message: 'Error deleting item from database' })
            return
        }
    }

    // Create the command to put the updated inventory into DynamoDB
    const putCommand = new PutItemCommand({
        TableName: 'foodsage_inventory',
        Item: {
            UserID: { S: req.userID },
            Inventory: { SS: updatedInventory },
        },
    })

    try {
        // Execute the command to put the updated inventory into DynamoDB
        await dbClient.send(putCommand)
        res.json({ message: 'Item deleted successfully' })
        return
    } catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Error deleting item from database' })
        return
    }
}

// Function to lookup product by barcode
export const lookupProduct = async (req, res) => {
    const { upc } = req.params
    if (!upc) {
        return res.status(400).json({ message: 'UPC is required' })
    }

    try {
        const data = await upcLookup(upc)
        res.json(data)
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' })
    }
}