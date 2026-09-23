
const redis  = require('redis');

const redisclient = redis.createClient({
    username: 'default',
    password: process.env.REDISPASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDID_PORT
    }
});
module.exports = redisclient;



