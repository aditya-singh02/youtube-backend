// require('dotenv').config({path: './env'}) 

import dotenv from "dotenv" /* This line imports the dotenv package, which is used to load environment variables from a .env file
                            and store them into process.env.
                                */
import connectDB from "./db/index.js"




dotenv.config({ /* This line configures the dotenv package to load environment variables from a .env file located in the root 
    directory of the project.
    import dotenv from "dotenv" ke baad dotenv.config() likhna hota hai taki .env file ke andar jo bhi environment variables 
    defined hai, wo process.env me load ho jaye.
    */
      path: './.env' // This line specifies the path to the .env file, which is located in the root directory of the project.
    });
    
    connectDB()
    

// make sure that package.json me...ki ye update kiya ho
//  "scripts": {
//      "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
//   },
    









//==> 1st approach of DB connnection:- (upr wala code i.e. 2nd appraoch run ke pehle niche ka comment kr dena )

import mongoose from "mongoose"
import {DB_NAME} from "./constants.js"

import express from "express";
const app = express();  /* Create an instance of the Express application, which will be used to define routes and middleware for handling HTTP requests.
    This line creates a new Express application and assigns it to the app variable. The app variable will be used to set up routes, 
    middleware, and start the server later in the code.  
    */


/* 
-->> ;(async ()=>{}) --> This is an Immediately Invoked Function Expression (IIFE) that allows us to use async/await syntax at the 
top level of our code. 
It is a self-executing anonymous function that runs immediately after it is defined. 
The async keyword allows us to use await inside the function, which makes it easier to handle asynchronous operations like 
connecting to a database. By using an IIFE, we can avoid polluting the global scope and keep our code organized.
*/



// Professional Step: The leading semicolon (;) protects against syntax errors from previous files during minification.
// The ; before ( is a safety measure
// Prevents issues if previous line has no semicolon. Professional code often starts IIFE with ;
;(async ()=>{ //IIFE 
    try{
        /*  
     --> This line is connecting to the MongoDB database using the "connection string" from the environment variable and the database 
        name from constants.js. 
      ->await is used to wait for the connection to be established before proceeding with the rest of the code. 
      ->The await keyword is used to wait for a promise to resolve before continuing with the rest of the code.
        If the connection is successful, the code will continue to execute. 
        If there is an error during the connection process, it will be caught by the catch block and logged to the console.
        */

             // 1. Establish the connection tunnel between the application and the MongoDB database.
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 


        /* This line is setting up an event listener for the "error" event on the app object. If an error occurs in the app, it 
        will be caught and logged to the console. The error is passed as an argument to the callback function, which allows us to 
        access the details of the error and handle it accordingly. In this case, we are simply logging the error to the console and 
        re-throwing it to ensure that it is not silently ignored.*/

        // 2. The Express Listener (The "Can we talk?" check)
        // Even if DB is connected, Express might fail to listen. So we need to catch that error as well.
        //-->app.on is a "Listener" for your Express application. While mongoose.connect handles the database side, 
        // app.on handles the Express-level side of the communication. It listens for events emitted by the Express application, such as errors or requests.
      app.on("error", (error) => { 
            console.log("ERROR: ", error);
            throw error
        })

        /* 3. Start the server only after the DB is confirmed to be connected. This ensures that the server is only running when it 
        can successfully connect to the database, preventing potential issues with handling requests that require database access. */
       app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }catch (error) { // Catch any errors that occur during the connection process and log them to the console. 
        console.error("DATABASE CONNECTION ERROR: ", error);
        throw error; // Re-throw the error to ensure it is not silently ignored and can be handled by any higher-level error handlers if necessary.
    }
})()
 


/* this Error may faced :--
1. ----> To start a project  also make sure that package.json me...ki ye update kiya ho
 "scripts": {
     "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
  },

2. import express from 'express'
const app = express()    //app.on(), app.listen() bina express ke thodi chlenge

3. always npm run dev from the root directory of the project, not from src folder. Otherwise, it will not find the .env file and 
throw an error.
*/



/*
why use throw error in a database connection instead of just logging it?"

Answer: "Logging is for information, but throw is for Control Flow. In a production environment, a database failure is a 'Fatal Error.'
By throwing the error, I ensure that the application does not attempt to serve requests with a broken data layer. It also allows 
external process managers to detect the failure, log the stack trace, and initiate a restart or an alert for the DevOps team." 


"Why use an IIFE for database connection instead of a regular function?"

Answer: "Using an IIFE allows us to execute the database connection logic immediately when 
the application starts, without needing to call a separate function. This ensures that the 
database connection is established before the server starts listening for requests. It also 
keeps the connection logic self-contained and prevents it from being accidentally called 
multiple times or from other parts of the code, which could lead to unintended consequences."


*/


