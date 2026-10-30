
import express from "express";
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js"
import cookieParser from 'cookie-parser';
import projectRoutes from "./routes/project.routes.js";
import aiRoutes from "./routes/ai.routes.js";
const app = express();

// connect();
// middleware 
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended : true}));

// apis call 
app.get("/",(req,res) => {
    res.send("HEllo world")
})

app.use("/users",userRoutes);
app.use("/projects",projectRoutes);
app.use("/ai",aiRoutes);

export default app;