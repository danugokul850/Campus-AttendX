require('dotenv').config();
const express = require('express');
const app = express();
const router = require("./routes/recoveryRoutes");
const cookieParser = require("cookie-parser");


app.use(cookieParser());


app.use('/api/recovery',router);

app.listen(4000,()=>{
    console.log("Server listening at the port number 4000");
})