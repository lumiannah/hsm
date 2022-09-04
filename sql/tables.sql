-- Session managment
CREATE TABLE "user_sessions" (
  "sid"                 VARCHAR NOT NULL COLLATE "default",
  "sess"                JSON NOT NULL,
  "expire"              TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "user_sessions" 
    ADD CONSTRAINT "session_pkey" 
    PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" 
    ON "user_sessions" ("expire");


-- Users, Devices, Sensor Data
CREATE TABLE "users" (
    "id"            SERIAL PRIMARY KEY,
    "username"      VARCHAR (50) NOT NULL UNIQUE,
    "password"      VARCHAR (200) NOT NULL
);

CREATE TABLE "devices" (
    "id"            SERIAL UNIQUE PRIMARY KEY,
    "mac"           MACADDR NOT NULL,
    "name"          VARCHAR (100)
);

CREATE TABLE "sensor_data" (
    "id"            SERIAL UNIQUE, 
    "temperature"   INT,
    "humidity"      INT,
    "device_id"     INT NOT NULL REFERENCES devices(id),
    "timestamp"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);