// This file contains a utility function called asyncHandler, which is a higher-order function designed to handle asynchronous request handlers in an Express.js application.

// 2. The "Promise" Way (Preferred Professional Way) 
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)) /* This line takes the provided "requestHandler" 
        function, executes it with the (request, response, and next parameters), and wraps it in a Promise. 
        If the "requestHandler" function returns a promise that rejects (i.e., an error occurs), the catch block will catch the error 
        and pass it to the next middleware using "next(err)". 
        This allows you to handle errors in a centralized error-handling middleware in your Express application, rather than having 
        to write try-catch blocks in every asynchronous route handler. 
         */
    }
}


export { asyncHandler } //export default asyncHandler; // Ye line bhi likh sakte hain, but fir import karte waqt curly braces nahi lagane padenge.

// Usage example in a route handler:
/*
import { asyncHandler } from './utils/asyncHandler.js';

app.get('/some-route', asyncHandler(async (req, res) => {
    // Your asynchronous code here, e.g., database operations
    const data = await someAsyncFunction();
    res.json(data);
}));
*/
 
/* --> aynchandle function ye ensure karta hai ki agar koi error aata hai asynchronous code me, toh wo error next() function ke through 
Express ke error handling middleware tak pahunch jaye.
Iska fayda ye hai ki aapko har asynchronous route handler me try-catch block likhne ki zarurat nahi padti, aur aapke error handling 
logic ko centralize kar sakte hain.
Agar aap asyncHandler ka use nahi karte hain, toh agar aapke asynchronous code me koi error aata hai, toh wo error Express ke default 
error handler tak nahi pahunchta, aur aapko manually try-catch block likhna padta hai har route handler me, jo code ko cluttered aur 
less maintainable bana deta hai. 
Isliye asyncHandler ka use karna best practice hai jab aap asynchronous route handlers likh rahe hain Express.js me, taki aapke errors 
properly handle ho sake aur aapka code clean aur maintainable rahe.
*/








// const asyncHandler = () => {} 
// const asyncHandler = (func) => () => {} 

// const asyncHandler = (func) => async () => {}

// The asyncHandler function is a higher-order function that takes an asynchronous request handler (func) as an argument and returns a new function.

// 1. The "async-await" or "Try-Catch" Way (Less Preferred) 

//        const asyncHandler = (fn) => async (req, res, next) => { /* This line defines the asyncHandler function, which takes a function (fn) 
//            as an argument and returns an asynchronous function that accepts the standard Express parameters: req (request), res (response), 
//            and next (a callback to pass control to the next middleware). */
//            try {
//                await fn(req, res, next) /* This line executes the provided function (fn) with the request, response, and next parameters. 
//                The await keyword is used to handle any asynchronous operations within the function, allowing it to wait for promises to 
//                resolve before proceeding. */
//            } catch (error) {
//                res.status(err.code || 500).json({ /* If an error occurs during the execution of the function, it is caught in the catch block. 
//                    The response is sent with a status code based on the error's code property (or 500 if no code is provided) and a JSON object 
//                    containing the success status and error message. */
//                    success: false, 
//                    message: err.message
//                })
//            }
//        }
//
//        export { asyncHandler }







// problem without asyncHandler:--
/*
app.get('/some-route', async (req, res) => {
    const data = await someAsyncFunction(); // If this line throws an error, it will not be caught by Express's error handling middleware.
    res.json(data);
});
*/

// solution with asyncHandler:--
/*
app.get('/some-route', asyncHandler(async (req, res) => {
    const data = await someAsyncFunction(); // If this line throws an error, it will be caught by the asyncHandler and passed to the next middleware.
    res.json(data);
}));
*/