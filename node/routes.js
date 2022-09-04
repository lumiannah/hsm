require('dotenv').config()

const db = require('./db')
const bcrypt = require('bcryptjs')

//// ESP
// post /devices
const initDevice = async (req, res) => {
    try {
        const mac = req.body.mac
        let device = await db.getDeviceByMac(mac)
        if (!device)
            device = await db.insertNewDevice(mac)
    
        return res.status(200).send(device.id.toString())
    } catch (error) {
        console.error(error);
        return res.sendStatus(403)
    }
}

// post /data
const addSensorData = async (req, res) => {
    try {
        console.log(req.body[0]);
        await db.insertNewData(req.body[0])
    
        return res.sendStatus(200)
    } catch (error) {
        console.error(error);
        return res.sendStatus(403)
    }
}
////


//// FRONT
// post /signin
const signinHandler = async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.sendStatus(401)
    }

    try {
        const user = await db.getUser(username)

        if (!user) {
            return res.sendStatus(401)
        }

        const matches = bcrypt.compareSync(password, user.password)
        if (!matches) {
            return res.sendStatus(401)
        }

        req.session.user = {
            id: user.id,
            username: user.username,
        }

        res.status(200)
        return res.json( req.session.user )
    } catch (error) {
        console.error(error);
        return res.sendStatus(403)
    }
}

// get /logout
const logoutHandler = async (req, res)  => {
    try {
        await req.session.destroy()
        return res.sendStatus(200)
    } catch (error) {
        console.error(error);
        return res.sendStatus(500)
    }
}

const userHandler = async (req, res) => {
    if (req.sessionID && req.session.user) {

        const validatedUser = await validateUser(req.session.user.username)
        if (!validatedUser)
            return res.sendStatus(401)

        res.status(200)
        return res.json( req.session.user )
    }
    return res.sendStatus(401)
}

// /devices
const getDevices = async (req, res) => {
    if (req.sessionID && req.session.user) {
        // check whether the user still exists in db
        const validatedUser = await validateUser(req.session.user.username)
        if (!validatedUser)
            return res.sendStatus(401)

        const devices = await db.selectAllDevices()
        const datas = []

        for (const device of devices) {
            const { timeInterval, timeField } = req.body
            console.log(req.body);
            const deviceData = await db.selectDeviceDatas(device.id, timeInterval, timeField)
            datas.push({
                id: device.id,
                name: device.name,
                data: deviceData
            })
        }
        
        res.status(200)
        return res.json(datas)
    }
    return res.sendStatus(401)
}

// post /devices/:id
const updateDevice = async (req, res) => {
    if (req.sessionID && req.session.user && req.params.id) {
        // check whether the user still exists in db
        const validatedUser = await validateUser(req.session.user.username)
        if (!validatedUser)
            return res.sendStatus(401)

        //// TODO
        //// db.updateDevice(id)
        res.status(200)
        return res.json( req.session.user )
    }
    return res.sendStatus(401)
}


async function validateUser(username) {
    const user = await db.getUser(username)
    if (!user)
        return false
    return true
}



async function createDummyuser () {
    const username = 'dummyuser'
    const password = 'dummypw'
    try {
        const hashedPassword = bcrypt.hashSync(password, 10)
        await db.insertNewUser(username, hashedPassword)
    } catch (error) {
        console.error(error);
    }
}

//createDummyuser()

module.exports = {
    signinHandler,
    logoutHandler,
    userHandler,
    initDevice,
    addSensorData,
    getDevices,
    updateDevice
}