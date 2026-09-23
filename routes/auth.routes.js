const express = require('express');
const authRouter = express.Router();

//Register
authRouter.post('/auth/register',register);
//login
authRouter.post("/auth/login",login);
//logout
authRouter.post('/auth/logout'/logout);
//me
authRouter.get("/auth/me",me);
//refresh
authRouter.post("/auth/refresh",refresh);
//change-password..
authRouter.patch("/auth/change-password");