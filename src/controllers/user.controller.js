import asyncHandler from '../utils/asyncHandler.js';

// Create a new user
const registerUser = asyncHandler( async (req, res ) => { /* This line defines an asynchronous controller function called "registerUser" 
that is wrapped with the asyncHandler middleware. The asyncHandler is a higher-order function that takes an asynchronous function 
as an argument and returns a new function that handles errors properly. 
When the registerUser function is called, it will execute the asynchronous code inside it, and if any errors occur during that 
execution, they will be caught and passed to the next middleware in the Express.js application. */
     res.status(200).json({
        message : "ok"
    })
})

export { registerUser }

/*--> it is testing purpose only, we will implement the actual logic of registering a user in the future lectures.
--> The main purpose of this code snippet is to demonstrate how to use asyncHandler to handle asynchronous operations in a controller function, 
and to show how to send a JSON response back to the client.
--> In a real application, you would typically have more complex logic inside the registerUser function, such as validating the input data, 
interacting with a database to create a new user record, and handling any potential errors that may arise during those operations.


In this code snippet, we define a controller function called "registerUser" that handles the registration of a new user. 
The function is wrapped with asyncHandler, which is a higher-order function that helps to catch any errors that may occur during the 
asynchronous operations within the controller.

When a client -> sends a request to register a new user, the "registerUser function" will be executed. If any error occurs during the 
execution of this function (-> for example, if there is an issue with the database connection or if the input data is invalid), the 
asyncHandler will catch that error and pass it to the next middleware in the Express.js application, which can then handle it 
appropriately (e.g., by sending an error response to the client).

Using asyncHandler helps to keep your code clean and maintainable by avoiding the need for repetitive try-catch blocks in each 
controller function, and it ensures that any errors that occur during asynchronous operations are properly handled and passed to the 
next middleware for error handling.

In this example, if the registration is successful, the server responds with a JSON object containing a success message. If there 
were any errors during the registration process, those errors would be caught and handled by the asyncHandler, allowing you to 
send an appropriate error response to the client. */       