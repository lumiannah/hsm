const bcrypt = require('bcryptjs')
const { getUser } = require('./db')

function authError (response, next) {
    const error = new Error('Auth required')
    response.set('WWW-Authenticate', 'Basic')
    error.status = 401
    next(error)
}

async function auth (request, response, next) {

    const authHeader = request.headers.authorization
    const [username, password] = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':')
    
    if (!authHeader || !username || !password) 
        return authError(response, next)

    const user = await getUser(username)
    if (!user) {
        authError(response, next)
    }

    const matches = bcrypt.compareSync(password, user.password)
    if (!matches) {
        authError(response, next)
    }

    return next() 
}

module.exports = auth