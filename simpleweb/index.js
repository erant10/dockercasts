const express = require('express');

const app = express();
const port = 8080;
app.get('/', (req,res) => {
    res.send('Hi there');
});

app.listen(port, () => {
   console.log(`listening on port ${port}`);
});
