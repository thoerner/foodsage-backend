import dbClient from "../db.js"
import { QueryCommand } from "@aws-sdk/client-dynamodb"
import { ChatOpenAI } from "langchain/chat_models/openai"
import { HumanChatMessage, SystemChatMessage } from "langchain/schema"

const chat = new ChatOpenAI({ modelName: "gpt-4", temperature: 0.8 })

export const getRecipes = async (req, res) => {
    // Create the command to query DynamoDB for the inventory associated with the user ID
    const command = new QueryCommand({
        TableName: 'foodsage_inventory',
        KeyConditionExpression: 'UserID = :u',
        ExpressionAttributeValues: {
            ':u': { S: req.userID },
        },
    })

    let inventory = []

    try {
        // Execute the command and send the result in the response
        const data = await dbClient.send(command)
        if (data.Items.length === 0) {
            return res.status(404).json({ message: 'Inventory not found' })
        }
        inventory = data.Items[0].Inventory.SS
    } catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Internal server error' })
    }

    const ingredients = inventory.join(', ')

    const rawResponse = await chat.call([
        new SystemChatMessage(
            "You are a helpful device called Food Sage. The user will provide an inventory and you will provide exactly three options. Give a brief description of each. The app will provide a prompt for the user to select one."
        ),
        new HumanChatMessage(
            ingredients
        ),
    ]);

    const response = rawResponse.text

    const rawOptions = await chat.call([
        new SystemChatMessage(
            `Provide a JSON object with the following structure: {"options": ["First Option", "Second Option", "Third Option"]}`
        ),
        new HumanChatMessage(
            response
        )
    ]);

    const options = rawOptions.text
      
    res.json({ response, options })
}

export const chooseRecipe = async (req, res) => {
    const { recipe } = req.body

     // Create the command to query DynamoDB for the inventory associated with the user ID
     const command = new QueryCommand({
        TableName: 'foodsage_inventory',
        KeyConditionExpression: 'UserID = :u',
        ExpressionAttributeValues: {
            ':u': { S: req.userID },
        },
    })

    let inventory = []

    try {
        // Execute the command and send the result in the response
        const data = await dbClient.send(command)
        if (data.Items.length === 0) {
            return res.status(404).json({ message: 'Inventory not found' })
        }
        inventory = data.Items[0].Inventory.SS
    } catch (err) {
        // If there's an error, log it and send a 500 error response
        res.status(500).json({ message: 'Internal server error' })
    }

    const rawResponse = await chat.call([
        new SystemChatMessage(
            `You are a helpful device called Food Sage. The user has chosen the following recipe and has the following ingredients available: ${inventory.join(', ')}. Provide a detailed recipe along with nutrition facts.`
        ),
        new HumanChatMessage(
            recipe
        ),
    ]);

    const response = rawResponse.text

    res.json({ response })
}