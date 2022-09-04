require('dotenv').config()

const pg = require('pg')
const expressSession = require('express-session')
const pgSession = require('connect-pg-simple')(expressSession)

const pgPool = new pg.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
})


//// ESP

async function getDeviceByMac(mac) {
    const device = await pgPool.query(
        'SELECT * FROM devices WHERE mac = $1',
        [mac]
    )
    return device.rows[0]
}

async function insertNewDevice(mac) {
    const newDevice = await pgPool.query(
        'INSERT INTO devices (mac) VALUES ($1) RETURNING *',
        [mac]
    )
    return newDevice.rows[0]
}

async function insertNewData(sensor) {
    await pgPool.query(
        'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES ($1, $2, $3)',
        [sensor.deviceId, sensor.temperature, sensor.humidity]
    )
    return
}

////


//// FRONT

async function getUser(username) {
    const user = await pgPool.query(
        'SELECT id, username, password FROM users WHERE username = $1',
        [username]
    )
    return user.rows[0]
}

async function insertNewUser(username, hashedPassword) {
    const newUser = await pgPool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [username, hashedPassword]
    )
    return newUser.rows[0]
}

async function selectAllDevices() {
    const devices = await pgPool.query(
        'SELECT * FROM devices',
    )
    return devices.rows
}

async function selectDeviceDatas(id, interval, field) {
    interval = `${interval} ${field}`
    const data = await pgPool.query(`
    WITH temp_hum_values AS (
        SELECT
            date_trunc('${field}', timestamp) AS ts,
            avg(temperature)::int AS temperature,
            avg(humidity)::int AS humidity
        FROM 
            sensor_data
        WHERE 
            device_id = $1 AND
            timestamp > NOW()::timestamp - INTERVAL '${interval}'
        GROUP BY ts
        ORDER BY ts
    ),
    generated_series AS (
        SELECT generate_series(
            date_trunc('${field}', NOW()::timestamp - INTERVAL '${interval}'),
            date_trunc('${field}', NOW()::timestamp),
            '1 ${field}'::INTERVAL
        ) AS ts
    )
    SELECT
        generated_series.ts,
        temp_hum_values.temperature,
        temp_hum_values.humidity
    FROM
        generated_series
    LEFT JOIN
        temp_hum_values
            ON date_trunc('${field}', temp_hum_values.ts) = generated_series.ts;
        `,
        [id]
    )
    return data.rows
}

module.exports = {
    pgSession,
    pgPool,
    expressSession,
    getUser,
    insertNewUser,
    insertNewDevice,
    insertNewData,
    getDeviceByMac,
    selectAllDevices,
    selectDeviceDatas
}