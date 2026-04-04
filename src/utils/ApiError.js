// In this file we will create a custom error class called ApiError that extends the built-in "Error class" in JavaScript. 
// This custom error class will allow us to create more specific and informative error messages for our API.
//ApiError class is a "Senior Developer" move because it allows you to standardize exactly how your server tells the frontend that something went wrong.

/* The ApiError class has a constructor that takes several parameters:
1. statusCode: This is the HTTP status code that will be associated with the error (e.g., 400 for Bad Request, 404 for Not Found, etc.).
2. message: This is a human-readable message that describes the error. It has a default value of "Something went wrong" if no message is provided.
3. errors: This is an optional array that can hold additional error details, such as validation errors or specific issues related to the request.
4. stack: This is an optional parameter that allows you to provide a custom stack trace for the error. If not provided, it will capture the current stack trace.
-->stack trace means ki error kaha se aaya, kis file me aaya, kis line number pe aaya, etc. Ye debugging ke liye bahut useful hota hai.
    custom stack trace means y a aap apne error ke stack trace ko customize kar sakte hain, yaani ki aap apne error ke stack trace me specific information add kar sakte hain,
*/

/* Node.js has built-in Error class with:
  → message
  → stack trace
  → name
  → cause

We EXTEND it to ADD our custom fields:
  → statusCode  (HTTP status)
  → success     (always false for errors)
  → errors      (array of detailed errors)
  → data        (null for errors)  */ 

class ApiError extends Error {
    constructor(
        statusCode, // Required parameter to specify the HTTP status code for the error.
        message= "Something went wrong", // Optional parameter with a default message if no specific message is provided when creating an instance of ApiError.
        errors = [], 
        stack = "" //Where error occurred
    ){
        super(message) // Call the parent class (Error) constructor with the message parameter to set the error message for this instance of ApiError.
        this.statusCode = statusCode // Set the statusCode property of the ApiError instance to the value provided in the constructor.
        this.data = null // Initialize a data property to null, which can be used to store additional information about the error if needed.
        this.message = message // Set the message property of the ApiError instance to the value provided in the constructor (or the default message if none is provided).
        this.success = false; // Set a success property to false, indicating that this error represents a failure in the API request.
        this.errors = errors 

        // If a custom stack trace is provided, use it; otherwise, capture the current stack trace for this error instance. 
        // This helps in debugging by showing where the error occurred in the code.
        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor) // This line captures the current stack trace and associates it with this 
                                    // error instance, allowing developers to see where the error originated in the code when debugging.
        }

    }
}

export {ApiError} 

/* Usage example:
  -->Throw custom error anywhere:- 
        throw new ApiError(404, "User not found");                                  
        throw new ApiError(401, "Unauthorized access");       
        throw new ApiError(400, "Email already exists");       
        throw new ApiError(500, "Internal server error");       

  -->  usage :-                                                |||        --> Output :-
    import { ApiError } from './utils/ApiError.js';            |||                 {
    app.get('/some-route', (req, res) => {                     |||                     "statusCode": 404,
        // Some code that might throw an error                 |||                    "message": "Resource not found",
        if (someCondition) {                                   |||                     "success": false,
            throw new ApiError(404, "Resource not found");     |||                     "data": null,                  
        }                                                      |||                     "errors": []      
        res.json({ success: true });                           |||                 }
    });  
  
 */



//instance matlab ki jab bhi aap new ApiError() likhenge, toh wo ek naya error object create karega jisme aapke specified status code, message, errors, aur stack trace honge.

/*  Why use a custom error class like ApiError instead of just using the built-in Error class?
Answer: "Using a custom error class like ApiError allows you to standardize the structure of your error responses, making it 
easier for the frontend to handle and display errors consistently. It also enables you to include additional information (like 
status codes and detailed error messages) that can be useful for debugging and providing more context about what went wrong 
in the API request." 

Instead of random errors like:
            { "message": "Something broke" }
You send:
            {
            "statusCode": 404,
            "message": "User not found",
            "success": false
            }

-->Why do we need it?
    Without custom errors:
        ❌ Inconsistent responses
        ❌ Hard to debug
        ❌ Bad for frontend handling
     With custom errors:
        ✅ Clean structure
        ✅ Easy debugging
        ✅ Better API design


*/
