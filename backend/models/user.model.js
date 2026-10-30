import mon from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mon.Schema({
    email : {
        type : String,
        lowercase : true,
        minLength : [6,"Email must be atleast 6 character long"],
        maxLength : [50,"Email must not be longer than 50 characters"],
        required : true,
        unique : true,
        trim : true,
    },
    password : {
        type : String,
        required : true,
        select : false
    },
    otpVerify : {
        type : Boolean,
        default : false
    }
})

// kuch methods 
userSchema.statics.hashPassword = async function(password){
    return await bcrypt.hash(password,10);
}

userSchema.methods.isValidPassword = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateJWT = async function(){
    return jwt.sign({email:this.email},process.env.JWT_KEY,{expiresIn : '24h'})
}

const User = mon.model('user',userSchema);

export default User;

