const express = require('express')
const cors = require('cors')
const ESPauth = require('./esp_auth')
const routes = require('./routes')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
    cors({
        origin: '*',
        methods: ['POST', 'OPTIONS', 'HEAD'],
        allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    })
)

// with espauth middleware
app.post('/devices', ESPauth, routes.initDevice)
app.post('/data', ESPauth, routes.addSensorData)

app.listen(3003)