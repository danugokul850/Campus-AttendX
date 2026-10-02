const mongoose = require('mongoose');
async function mongoDB(){
     try{
         await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
         console.log("DB connect successfully");
         await User.syncIndexes(); // <-- add this
          console.log("Indexes synced");
     }catch(err){
        console.log(err.message);
     } 
}
module.exports = mongoDB;