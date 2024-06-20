const mongoose= require("mongoose") ;

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        require:true,
    } ,
    email:{
        type:String,
        require:true,
    } ,
    pswd:{
        type:String,
        require:true,
    } ,
    phone:{
        type:String,
        default:'',
    } ,
    addr:{
        type:String,
        default:'',
    } ,
    gender:{
        type:String,
        default:'male',
    },
    about:{
        type:String,
        default:'',
    },
    followers:[{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }],
    following:[{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }],
    dp:{type:String},
})


module.exports= mongoose.model('user',userSchema) ;