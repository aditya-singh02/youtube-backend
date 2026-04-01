import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"  /* ./ (Single Dot): Means "Look in the same room I am currently in."
                                     ../ (Double Dot): Means "Go out into the hallway (up one folder) and then look for something."
                                     */



//2nd appraoch of DB connection:--
const connectDB = async () => { // This is an asynchronous function named connectDB that will be responsible for establishing a 
                                // connection to the MongoDB database using Mongoose. 
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`); /* If the connection is successful, it will log a 
                            message to the console indicating that MongoDB is connected, along with the connection instance details.
// -->The connectionInstance variable will contain information about the established connection, such as the host and port of the MongoDB server.

--->console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance}`) --> when i console log only connectionInstance, it will print 
the `[object Object]` instead of the actual connection details. This is because connectionInstance is an object, and when you try to 
print an object directly, it doesn't display its properties by default.
-->By accessing connectionInstance.connection.host, we are specifically retrieving the host property of the connection object, 
which contains the actual host information of the MongoDB server. This way, we can see the relevant details about the connection 
in the console output.
        */
    }
    catch (error) {
        console.log("MongoDB connection FAILED: ", error);
        process.exit(1) /* stops the server immediately
        If there is an error during the connection process, it will log an error message to the console and exit 
        the process with a non-zero status code (1), indicating that the application failed to start due to a database connection issue.
        */
    }
}

export default connectDB


