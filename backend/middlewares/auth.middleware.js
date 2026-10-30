import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";
export const authUser = async(req,res,next) =>{
    try{
       const token = req.cookies.token || req.headers.authorization.split(' ')[1];
       
       if(!token){
        return res.status(401).send({error:'Unauthorized User'});
       }
       const isBlacklisted = await redisClient.get(token);

       if(isBlacklisted){
        res.cookie('token','');
        return res.status(404).send({error:'Unauthorizated user'})
       }
       const decoded = jwt.verify(token,process.env.JWT_KEY);
       req.user = decoded;
       next();
    }catch(err){
        console.log(err)
        res.status(401).send({error:'Unauthorized'});
    }
}
