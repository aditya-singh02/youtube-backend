//in this ApiResponse file we will create a utility function called "ApiResponse" that will help us standardize the structure of our API responses.

/* The ApiResponse function takes several parameters:
1. success: A boolean indicating whether the API request was successful or not.
2. message: A string that provides a human-readable message about the result of the API request.
3. data: An optional parameter that can hold any additional data that you want to include in the response (e.g., the result of a database query).
4. errors: An optional parameter that can hold an array of error details if the request was not successful.
5. statusCode: An optional parameter that specifies the HTTP status code for the response, with a default value of 200 (OK). 
The function returns an object that contains all of these properties, which can then be sent as a JSON response to the client.
*/

/* The ApiResponse function is a utility function that helps standardize the structure of API responses. It takes in parameters such 
as statusCode, data, and an optional message, and returns an object that includes these properties along with a success flag. 
This allows for consistent formatting of responses across the API, making it easier for clients to understand and handle the 
responses they receive from the server. 
By using this function, developers can ensure that all API responses follow a uniform structure, which can improve the maintainability 
and readability of the codebase.

*/
class ApiResponse {
    /* The constructor of the ApiResponse class takes three parameters: statusCode (the HTTP status code for the response), 
    data (the actual data to be sent in the response), and an optional message (a human-readable message about the response, 
    with a default value of "Success"). */
    constructor(statusCode, data, message = "Success"){ 
        this.statusCode = statusCode // Set the statusCode property of the ApiResponse instance to the value provided in the constructor.
        this.data = data // Set the data property of the ApiResponse instance to the value provided in the constructor.
        this.message = message // Set the message property of the ApiResponse instance to the value provided in the constructor (or the default message if none is provided).
        this.success = statusCode < 400 // Set success to true if statusCode is less than 400 (indicating a successful response), otherwise set it to false (indicating an error response).
    }
}

export { ApiResponse }




/* 
--> A custom class for sending success responses in a consistent format
    Instead of random responses like:
                { "data": user }
    You send:
                {
                "statusCode": 200,
                "data": user,
                "message": "User fetched successfully",
                "success": true
                }
-->  Why do we need it?
    Without it:
        ❌ Different response formats everywhere
        ❌ Confusing for frontend
    With it:
        ✅ Same structure for every API
        ✅ Easy to handle on frontend
        ✅ Clean & professional code


--> Usage:
1...    return res .status(200) .json(new ApiResponse(200, userData, "User fetched successfully"));

2... return res.status(201) .json(new ApiResponse(201, newUser, "User registered successfully"));

  --> Usage example:                                                     |||     --> Output:-
    import { ApiResponse } from './utils/ApiResponse.js';                |||           {             
    app.get('/some-route', (req, res) => {                               |||             "statusCode": 200, 
        // Some code to fetch data                                       |||             "data": {      
        const data = {                                                   |||                  "name": "Aditya",
        name: "Aditya",                                                  |||                  "age": 21
        age: 21                                                          |||               },                                               
        };                                                               |||             "message": "Data fetched successfully",
    res.json(new ApiResponse(200, data, "Data fetched successfully"));   |||             "success": true
}                                                                         |||           }   
 
*/





 