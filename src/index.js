// require('dotenv').config({path: "./env"})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env"
})

connectDB() //this returns a promise
    .then(() => {
        //check for any error before listening
        app.on("error", (error) => {
            console.log("error", error)
            throw error
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Sever is running at port: ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("Mongo DB connection failed!!", err);
    })













// import express from "express"
// const app = express()
// function connectDB(){

// }

// connectDB()

//using Immediately Invoked Function Expression (IIFE)

// ;( aysnc () => {})()

//semi colon in start just in case the previous code doesnt have and it could be combined with that
//but here no code before iife