import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import userRoutes from './routes/userRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import recipeRoutes from './routes/recipeRoutes.js'

const port = process.env.PORT || 3000

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(helmet())

app.get('/', (req, res) => {
    res.send('Hello, World!')
})

app.use('/users/', userRoutes) 
app.use('/inventory/', inventoryRoutes)
app.use('/recipes/', recipeRoutes)

app.listen(port, () => {
    console.log(`App running on port ${port}`)
})