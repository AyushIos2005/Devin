
import "dotenv/config";

import http from "node:http";
import app from "./app.js";
import connect from "./db/db.js";
import redisClient from "./services/redis.service.js";
import { Server } from 'socket.io'
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

// const server = require('http').createServer();
const io = new Server(server,{
  cors:{
    origin : '*'
  }
});



io.use(async (socket,next) => {
  try{
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
    const projectId =  socket.handshake.query.projectId;

    if(mongoose.Type.ObjectId.isValid(projectId)){
      return next(new Error('Invalid projectId'));
    }
    socket.project = await projectModel.findById(projectId).len()
    if(!token){
      return next(new Error('Authenticate error'))
    }
    const decoded = jwt.verify(token,process.env.JWT_KEY);

    if(!decoded){
      return next(new Error('Authentication error'))
    }
    socket.user = decoded;
    next();
  }catch(error){
    next(error)
  }
})


io.on('connection', socket => {

  socket.roomID = socket.project._id.toString();



  console.log('A user connected')

  socket.join(socket.roomID);

  socket.on('project-message',async data=>{
    const message = data.message;
    const aiIsPresentInMessage = message.include('#ai');
    socket.broadcast.to(socket.roomID).emit('project-message',data)
    if(aiIsPresentInMessage){
        const prompt = message.generateResult(prompt);
        io.to(socket.roomId).emit('project-message',{
          message : result,
          sender : {
            _id : 'ai',
            email :'AI'
          }
        })
      return;
    }
    // socket.broadcast.to(socket.roomID).emit('project-message',data)
  })

  socket.on('event', data => { /* … */ });
  socket.on('disconnect', () => { 
    console.log('user-disconnect');
    socket.leave(socket.roomId)
   });
});
// server.listen(3000);

async function startServer() {
  try {
    await connect();
    console.log("MongoDB connected");

    const result = await redisClient.ping();
    console.log("Redis PING:", result);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);

    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }

    process.exitCode = 1;
  }
}

startServer();
