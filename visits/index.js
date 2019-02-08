const express = require('express');
const redis = require('redis');
const process = require('process');

const port = 8081;

const app = express();
const client = redis.createClient({
    host: 'redis-server',
    port: 6379 // default redis port
});
client.set('visits', 0);

app.get('/', (req,res) => {
    process.exit(0);
    client.get('visits', (err,visits) => {
        res.send('Number of visits is ' + visits);
        client.set('visits', parseInt(visits) + 1)
    });
});

app.listen(port, () => {
    console.log('listening on port ' + port)
});