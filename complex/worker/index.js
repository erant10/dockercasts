const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

// watch redis and wake up when a new value shows up
sub.on('message', (channel, message) => {
    // values is a hash with key: index, and value: fib(index)
    redisClient.hset('values', message, fib(parseInt(message)))
});

sub.subscribe('insert');