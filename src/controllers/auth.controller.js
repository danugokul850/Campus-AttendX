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

          console.error("Register error:", err); // <-- add this

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
        if(!emailId || !password){
            return res.status(400).json({
                success:false,
                message:"Field is missing",  
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
         const accessToken = jwt.sign(
            { _id: user._id, emailId: user.emailId, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "15m" }
        );

   const refreshToken= jwt.sign({_id:user._id},process.env.JWT_REFRESH_SECRET,{expiresIn:"7d"} );

     await redisClient.set(`refreshToken:${user._id}`,refreshToken,{EX:7*24*60*60})          

        res.cookie("token",accessToken,{maxAge:15*60*1000});
        res.cookie("refreshToken",refreshToken,{maxAge:7*24*60*60*1000})
        res.status(200).json({
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
        const {token, refreshToken} = req.cookies;
        if(!token || !refreshToken){
            return res.status(403).json({
                success:false,
                message:"Token is missing",
            })
        }

        const payload = jwt.verify(token,process.env.JWT_SECRET_KEY);

        await redisClient.set(`token:${token}`,"Blocked",{EXAT:payload.exp});

        // Revoke the refresh token ..
         if(refreshToken){
            const refreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            await redisClient.del(`refreshToken:${refreshToken._id}`);
         }

        res.clearCookie("token"),
        res.clearCookie("refreshToken");
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
        const user = await User.findById(payload._id);
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

const refreshToken = async(req,res)=>{
    try{
        const{refreshToken} = req.cookies;
        if(!refreshToken){
            return res.status(401).json({
                success:false,
                message:"refreshToken is missing",
            })
        }

        //verify the refresh token..
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // check  refresh token in the redis database..
        const storedToken = await redisClient.get(`refreshToken:${payload._id}`);
        if(!storedToken){
            return res.status(401).json({
                succcess:false,
                messaage:"Refresh token is invalid or expired",
            })
        }
        //compare the refresh token with redis refresh token..
        if(storedToken !==refreshToken){
            return res.status(401).json({
                success:false,
                message:"Refresh token is invalid"
            });
        }

        // Generate the new access token..
          const newAccessToken = jwt.sign({_id:payload._id}, process.env.JWT_SECRET_KEY, {expiresIn:"15m"});
          
          // Send new Access token ..
          res.cookie("token",newAccessToken,{maxAge:15*60*1000});
          
          res.status(200).json({
             success:true,
             message:"Access token refresh successfully",
          })  
    }catch(err){
        res.status(401).json({
            success:false,
            message:"Invalid or expired refresh token"
        })
    }
}

const changePassword = async(req,res)=>{
    try{
        const{currentPassword, newPassword} = req.body;
        if(!currentPassword || !newPassword){
            return res.status(400).json({
                success:false,
                message:"currentPassword and newPassword is required",
            })
        }
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        
        // Check the current password..
           const isPasswordCorrect  = bcrypt.compare(user.password, newPassword);
           
           if(isPasswordCorrect){
             return res.status(400).json({
                success:false,
                message:"New password must be different from old password"
             });
           }
           
           // Hash the new password..
           const hashedPassword = await bcrypt.hash(newPassword,10);
           
           // update the User password..
           req.user.password = hashedPassword;
           await user.save();

           return res.status(200).json({
             success:true,
             message:"Password changed successfully",
           })
    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Internal server error",
        })
    }
}



module.exports = {register, login, logout, me, refreshToken,changePassword};