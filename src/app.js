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




export { app }