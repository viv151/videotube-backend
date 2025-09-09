import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("MONGO DB CONNECTION ERROR: ", error)
        process.exit(1) //exiting the node process
    }
}
// mongoose returns an object on connection which can be handled by putting it into a variable

export default connectDB