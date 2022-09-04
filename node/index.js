require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { pgSession, pgPool, expressSession } = require('./db')
const routes = require('./routes')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// cors only for local testing
app.use(
    cors({
        origin: 'http://localhost:5500',
        methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
        credentials: true,
    })
)

app.use(expressSession({
    store: new pgSession({
      pool: pgPool,
      tableName: process.env.SESSION_TABLE,
      pruneSessionInterval: 60
    }),
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 12 // 12 hours
    }
  })
)

app.post('/signin', routes.signinHandler)
app.get('/logout', routes.logoutHandler)
app.get('/user', routes.userHandler)
app.post('/devices', routes.getDevices)
app.post('/devices/:id', routes.updateDevice)

app.listen(3004)

