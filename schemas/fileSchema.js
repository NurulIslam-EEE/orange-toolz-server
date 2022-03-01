const mongoose = require("mongoose");
const fileSchema = mongoose.Schema({
    name: {
        type: String,
    },
    time:{
        type:String
        },
    fileName:{
         type:String
             }
    
});

module.exports = fileSchema;