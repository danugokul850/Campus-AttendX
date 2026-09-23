const validUser = require("../utils/validator");
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt  = require('jsonwebtoken');
const redisClient = require("../config/redis");


const register = async (req, res) => {
    try {
        // Validate the user data before storing in the DB
        validUser(req.body);

        // Hash the password
        req.body.password = await bcrypt.hash(req.body.password, 10);

        const user = await User.create(req.body);

        const { password, ...userResponse } = user.toObject();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: userResponse
        });

    } catch (err) {
        // Duplicate key error (email, phone, or registrationNumber already exists)
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${duplicateField} already exists`
            });
        }

        // Mongoose validation errors (from schema-level validators)
        if (err.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Errors thrown by validUser() are also client-side mistakes
        // (Since validUser throws plain Error objects, they fall through to here too)
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

const login = async(req,res)=>{
    try{
        const {emailId, password} = req.body;
        if(!emailId && !password){
            return res.status(400).json({
                success:False,
                message:"Feild is missing",  
            })
        }
        const user = await User.findOne({emailId});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        // Verify the user-password..
        const isMatch = await bcrypt.compare(password,user.password);
       if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }
        const token = jwt.sign({_id:user._id,emailId:user.emailId},process.env.JWT_SECRET_KEY,{expiresIn:"1h"});
        res.cookie("token",token,{maxAge:60*60*1000});
        res.status(200).josn({
            success:true,
            message:"User login successfully",
        })      
    }catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}

const logout = async(req,res)=>{
    try{
        const {token} = req.cookies;
        if(!token){
            return res.status(403).json({
                success:false,
                message:"Token is missing",
            })
        }

        const payload = jwt.verify(token,process.env.JWT_SECRET_KEY);

        await redisClient.set(`token:${token}`,"Blocked");
        await redisClient.expireAt(`token:${token}`,payload.exp);

        res.clearCookie("token"),
        res.status(200).json({
            success:true,
            message:'User logout successfully'  
        })    
    }catch(err){
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

const me = async (req, res) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(403).json({
                success: false,
                message: "Token is missing"
            });
        }

        // Verify the token
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { password, ...userResponse } = user.toObject();

        res.status(200).json({
            success: true,
            message: "User found successfully",
            user: userResponse
        });

    } catch (err) {
        // jwt.verify throws specific errors for expired/invalid tokens
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired, please log in again"
            });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



module.exports = {register, login, logout, me};