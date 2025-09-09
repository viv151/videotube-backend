// require('dotenv').config({path: "./env"})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env"
})

connectDB()














// import express from "express"
// const app = express()
// function connectDB(){

// }

// connectDB()

//using Immediately Invoked Function Expression (IIFE)

// ;( aysnc () => {})()

//semi colon in start just in case the previous code doesnt have and it could be combined with that
//but here no code before iife