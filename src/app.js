import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// app.use(cors())
//this also works, but lets see a few more options

app.use(cors({
    origin: process.env.CORS_ORIGIN, //allowed origin
    credentials: true //require credentials
}))

app.use(express.json({limit: "16kb"}))
 
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))


//routes import

import userRouter from "./routes/user.routes.js" 


//routes declaration
app.use("/api/v1/users", userRouter) //when user types /user , middleware gives the control to user router
//uerRouter goes to its file and then router takes user where to go


//http://localhost:8000/api/v1/user/register  - user is prefixed and the regitser is added after /users



export { app }