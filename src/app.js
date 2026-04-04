import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser"; 


const app = express();

// CORS configuration 

/*This line adds the CORS middleware to the Express application, It allows your backend to accept requests from another origin (frontend). 
  origin: "*" → allow everyone (not for production)
  origin: "https://myapp.com" → only allow this domain
  */
app.use(cors({  
  origin: process.env.CORS_ORIGIN, // This option specifies the allowed origin for cross-origin requests, which is typically set to the frontend application's URL.
  credentials: true // This option allows cookies and other credentials to be included in cross-origin requests.
}));

//app.use() is used to apply middleware 
//app.use()--> run this function for every request that comes to the server.

// Accept JSON data (with size limit)
app.use(express.json({ limit: "16kb" })); /* This line adds middleware to parse incoming JSON data in the request body, with a size 
limit of 16 kilobytes. This allows your server to handle JSON payloads sent by clients, such as API requests. 
Converts it into: "req.body ".
Client sends: {
               "name": "Aditya"
               } 
Server can access it as: req.body.name --> "Aditya"

parse matlab ki agar client JSON format me data bhejta hai, toh ye middleware usko parse karke req.body me convert kar dega, 
taki aap us data ko easily access kar sake apne route handlers me.
 */

// Accept URL encoded data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); /* This line adds middleware to parse incoming URL-encoded data 
(such as form submissions), with the extended option set to "true" to allow for rich objects and arrays, and a size limit of 16 kilobytes. 
    e.g. Form sends: name=Aditya&age=21 --> Converted into: req.body = {      |   Example URL encoded: name=Hitesh%20Choudhary
                                                             name: "Aditya",  |      %20 = space character (URL encoding)
                                                             age: "21"        |  
                                                             }                |
                                                             
extended: true :- Allows nested objects and arrays in the URL-encoded data, which is useful for handling complex form data.
limit: "16kb" :- This sets a maximum size for the incoming data to prevent excessively large payloads from being processed, which can help protect against certain types of attacks and improve performance.
 */


// Serve static files
app.use(express.static("public")); /* This line serves static files from the "public" directory, allowing you to access files like 
images, CSS, and JavaScript directly from the specified folder. Anyone can access these files publicly, so be cautious about what you place in the "public" directory.
e.g, If folder structure: public/image.png --> Access it as: http://localhost:PORT/image.png 
*/

// Cookie parser
/*This line allows your server to access user cookies and also set/delete them securely */
 app.use(cookieParser()); /* This line adds the cookie-parser middleware to the Express application, which allows you to parse and 
manage cookies in incoming HTTP requests. This is useful for handling authentication, sessions, and other features that rely on cookies. 
        Allows server to:
          → Read cookies from user's browser
          → Set cookies in user's browser
          → Perform CRUD on cookies
With cookie-parser, you can easily access cookies sent by the client through req.cookies and set cookies in the response using res.cookie().
    e.g. If browser sends: Cookie: token=abc123 --> Access it as: req.cookies.token --> "abc123"
*/

export {app}