import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


//                                              ********lecture 12********
// Create a new user
//     const registerUser = asyncHandler( async (req, res ) => {
/* This line defines an asynchronous controller function called "registerUser" that is wrapped with the asyncHandler 
        middleware. The asyncHandler is a higher-order function that takes an asynchronous function as an argument and returns a new 
        function that handles errors properly. 
        When the registerUser function is called, it will execute the asynchronous code inside it, and if any errors occur during that 
        execution, they will be caught and passed to the next middleware in the Express.js application. */

//        res.status(200).json({
//             message : "ok"
//        })
//    })

//    export { registerUser }

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

//iske pehle bss testing ke liye ek simple response bhej rahe the, ab hum actual logic implement karenge user registration ka, jisme hum input validation, database interaction, aur error handling ko include karenge.




//lecture 15(part)- helper function to generate access and refresh tokens for a user
const generateAccessAndRefereshTokens = async (userId) => { // ye function userId ko input ke roop me leta hai aur uske basis par access token aur refresh token generate karta hai.
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken // ye line user ke refreshToken field ko update kar rahi hai naye generated refresh token se. 
      await user.save({ validateBeforeSave: false }) // ye line "refresh token" ko database me save kar rahi hai. validateBeforeSave: false option is used to skip any validation checks that might be defined in the User model, allowing us to save the user document with the updated refresh token without triggering any validation errors.

      return { accessToken, refreshToken } // ye line ek object return kar rahi hai jisme accessToken aur refreshToken dono included hai. Is object ko hum loginUser controller me use karenge jab user successfully login karega, taki hum unhe access token aur refresh token provide kar sake.


   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
   }
}

//                                              ********lecture 13********

const registerUser = asyncHandler(async (req, res) => {
   // get user details from frontend
   // validation - not empty
   // check if user already exists: username, email
   // check for images, check for avatar
   // upload them to cloudinary, avatar
   // create user object - create entry in db
   // remove password and refresh token field from response
   // check for user creation
   // return response to frontend


   // 1. get user details from frontend
   const { fullName, username, email, password } = req.body;
   console.log(req.body); //just to check if we are getting the data from the frontend or not


   // 2.---> Input validation: 
   // Beginners if else se sare fields validate kar skte hai, but 
   /* if(fullName == "") {
       throw new ApiError(400, "Full name is required"); // ApiError me hum status code, message, aur errors pass kar sakte hai. yaha humne status code 400 (Bad Request) use kiya hai, aur message me "Full name is required" diya hai.
    } */

   //-->  In production grade code  
   /*production grade code me hum is tarah se validation karenge taki code clean rahe aur easily maintainable ho.
      [fullName, username, email, password].some((field) => field?.trim() === "") --> This line checks if any of the required fields (fullName, username, email, password) are empty or contain only whitespace.

*/
   if (
      [fullName, username, email, password].some((field) => //some() → returns TRUE if ANY element satisfies condition
         field?.trim() === "") // This part checks if any of the fields are empty or contain only whitespace. 
      // The trim() method removes whitespace from both ends of a string, and the optional chaining operator (?.) is used to 
      // safely access the trim method in case the field is undefined or null.
   ) {
      throw new ApiError(400, "All fields are required"); // If any of the fields are empty, some() returns true and an ApiError is thrown with a 
      // status code of 400 (Bad Request) and a message indicating that all fields are required. This error will be caught by the 
      // asyncHandler and passed to the next middleware for error handling.
   }

   // 3--> Check if user already exists: username, email 
   const existedUser = await User.findOne({ /* ye line checks if there is already a user in the database with the same username or 
                                    // email as the one being registered. The "findOne" method is used to search for a single document 
                                    // in the User collection that matches the specified criteria. */
      $or: [ // The $or operator is used to specify multiple conditions, and it returns true if any of the conditions are met. In this case, we are checking if either the username or email matches the provided values.
         { username }, { email }
      ]
   })

   if (existedUser) { /* agar existedUser variable me koi user milta hai, to iska matlab hai ki already ek user exist karta hai 
     jiska username ya email same hai. Is case me hum ek ApiError throw karenge jisme status code 409 (Conflict) aur message 
    "User already exists with this username or email" diya hoga. Ye error asyncHandler ke through catch hoga aur next middleware 
     ko pass hoga for error handling. */
      throw new ApiError(409, "User already exists with this username or email");
   }

   console.log(req.files);
   // 4.--> check for images, check for avatar  

   /*--> const avatarLocalPath = req.files?.avatar[0]?.path; --> This only protects you if req.files is missing. It does not protect you if the avatar field is missing.
            If Avatar is missing: req.files?.avatar evaluates to undefined. The code then tries to perform undefined[0].
            Result: TypeError: Cannot read properties of undefined (reading '0'). Your server crashes before it ever reaches your ApiError.
   
   
    --> const avatarLocalPath = req.files?.avatar?.[0]?.path; -> full safety : If Avatar is missing: The second ?. sees that avatar is 
               undefined and immediately stops (short-circuits). It returns undefined for the whole line.
               Result: No crash. Your variable avatarLocalPath becomes undefined. Then, your if (!avatarLocalPath) logic runs, and 
               the user gets your nice "Avatar is required" error.
   
   
    */


   const avatarLocalPath = req.files?.avatar?.[0]?.path; /* This line is checking if there is an avatar file uploaded in the request.
      -> The "req.files" object is used to access the uploaded files in the request. The optional chaining operator (?.) is used to safely 
      access the avatar property and the first file in the array. If there is an avatar file uploaded, its local path will be stored 
      in the avatarLocalPath variable. If there is no avatar file uploaded, the avatarLocalPath variable will be undefined. 
   
      // Optional chaining used because:
         → req.files might not exist
         → avatar field might not exist
         → first item might not exist
         → path might not exist
 */

   // ---> const coverImageLocalPath = req.files?.coverImage?.[0]?.path; 
   /* This line is checking if there is a cover image file uploaded in 
   the request. Similar to the previous line, it uses optional chaining to safely access the "coverImage" property and the first file 
   in the array. If there is a cover image file uploaded, its local path will be stored in the coverImageLocalPath variable. If there 
   is no cover image file uploaded, the coverImageLocalPath variable will be undefined. */

   //❌ Risky approach for optional files
   // -->       const coverImageLocalPath = req.files?.coverImage?.[0]?.path; 
   // If undefined, passing to next operation can crash the server


   //✅CORRECT - explicit check for optional files
   let coverImageLocalPath;
   /* Array.isArray(value)
         → Returns true if value is an array
         → Returns false for null, undefined, objects

   Why use it?
      req.files.coverImage MIGHT not be array
         → Defensive check before accessing [0]
         → Prevents "Cannot read property of undefined" */
   if ( // check if coverImage file is uploaded and exists in req.files before accessing its path 
      req.files && Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }

   if (!avatarLocalPath) { /* This line is checking if the "avatarLocalPath" variable is falsy (i.e., if there is no avatar file uploaded).
      If there is no avatar file uploaded, it throws an ApiError with a status code of 400 (Bad Request) and a message indicating 
      that the avatar image is required. This error will be caught by the asyncHandler and passed to the next middleware for error
       handling. */
      throw new ApiError(400, "Avatar image is required");
   }
   /* req.files structure: you can check this by console.log(req.files)
   req.files = {
            avatar: [
               {
                  fieldname: "avatar",
                  originalname: "profile.jpg",
                  path: "public/temp/profile.jpg",   ← this is what we need!
                  size: 45678,
                  mimetype: "image/jpeg"
               }
            ],
            coverImage: [...]
            } 
*/

   // 5.--> upload them to cloudinary, avatar & verify if upload is successful or not

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   /* This line is calling the "uploadOnCloudinary" function and passing the local path of the avatar image as an argument.
    The "uploadOnCloudinary" function is responsible for uploading the file to Cloudinary, a cloud-based image and video management service. 
    The function will handle the upload process and return a "response" that includes the URL of the uploaded image on Cloudinary. */
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "Failed to upload avatar image"); //check if avatar upload failed, if it fails then we will throw an 
      // error with status code 400 and message "Failed to upload avatar image". This error will be caught by the asyncHandler and 
      // passed to the next middleware for error handling.
   }


   // 6.--> create user object - create entry in db
   const user = await User.create({
      fullName,
      avatar: avatar.url, /*This line is setting the "avatar" field of the user object to the URL of the uploaded avatar image on 
       Cloudinary. (no need to check for avatar.url because if avatar upload fails then we will throw an error 
       in the previous step, so we can be sure that avatar.url will always be available here)
  --->     Why avatar.url not just avatar?
       Cloudinary response object contains:
                              {
                              url: "https://res.cloudinary.com/...",
                              secure_url: "...",
                              public_id: "...",
                              format: "jpg",
                              width: 800,
                              height: 600,
                              bytes: 45678,
                              // many more fields...
                              }
      We only want to STORE the URL in MongoDB
      Not the entire response object!

                  avatar.url → just the URL string ✅
       */
      coverImage: coverImage?.url || "", /*  (optional) This line is setting the "coverImage" field of the user object to the URL of the 
       uploaded cover image on Cloudinary. If there is no cover image uploaded, it will set the field to an empty string. 
        (we are using optional chaining here to safely access the "url" property of the "coverImage" object, in case the cover image upload fails and the "coverImage" variable is undefined)
        
        Why coverImage?.url || ""?
                        coverImage is OPTIONAL
                  User might not provide it

                        coverImage?.url
                        → If coverImage exists → get URL
                        → If coverImage is null/undefined → returns undefined

                        || ""
                        → If undefined → use empty string instead
                        → Prevents null/undefined in DB

                        Combined: coverImage?.url || ""
                        → URL if provided
                        → Empty string if not provided ✅
        */
      username: username.toLowerCase(),  /* This line is setting the "username" field of the user object to the lowercase version of 
      the provided username. This is done to ensure that usernames are stored in a consistent format in the database, making it
       easier to perform case-insensitive searches and comparisons. 
         -->> Why username.toLowerCase()?
                     User might type: "HiTeSh", "HITESH", "hitesh"
                     All should be stored as: "hitesh"

         Consistent storage = consistent searching
         */
      email,
      password
   })

   // 7.--> remove password and refresh token field from response
   const createdUser = await User.findById(user._id).select(  // This line is retrieving the newly created user from the database using its unique identifier (_id) and excluding the "password" and "refreshToken" fields from the query result.
      "-password -refreshToken" /*  .select() method is used to specify which fields should be included or excluded from the query result. 
       In this case, we are excluding the "password" and "refreshToken" fields from the response by prefixing them with a 
       minus sign (-). 
       This means that when we retrieve the user data from the database, the password and refresh token will not be 
       included in the response sent back to the client. This is a common practice to enhance security and protect sensitive 
       information from being exposed in API responses. 
       
      -->  .select("-password -refreshToken")

                     "-" before field name = EXCLUDE this field
                     Everything else = INCLUDED by default

                     Result:
                     {
                     _id: "...",
                     username: "hitesh",
                     email: "hitesh@example.com",
                     fullName: "Hitesh Choudhary",
                     avatar: "https://cloudinary.com/...",
                     coverImage: "",
                     watchHistory: [],
                     createdAt: "...",
                     updatedAt: "..."
                     // password → REMOVED ✅
                     // refreshToken → REMOVED ✅
                     }
       */
   )

   // 8.--> check for user creation 
   if (!createdUser) { /* This line is checking if the "createdUser" variable is falsy (i.e., if the user creation process failed and the user was not found in the database). If the user creation failed, it throws an ApiError with a status code of 500 (Internal Server Error) and a message indicating that the user creation failed. This error will be caught by the asyncHandler and passed to the next middleware for error handling. */
      throw new ApiError(500, "Failed to create user");
      /* Error code 500 here:
                  If createdUser is null after all our checks:
                  → Something broke on OUR side (server)
                  → User did everything right
                  → But server failed to create
   
                  500 = Internal Server Error
                  "Our fault, not user's fault" */
   }

   // 9.--> return response to frontend
   return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully") /*
    yaha hum res.status(201) use kar rahe hai to indicate that a new resource (user) has been successfully created. 
-->The .json() method is used to send a JSON response back to the client. We are creating a "new instance of the ApiResponse" class, passing 
    in the status code (200), the created user data, and a success message. This structured response will be sent back to the client, 
    allowing them to easily understand the result of their registration request. */
   )
});



// ***********.                                       lecture 15

//login user
const loginUser = asyncHandler(async (req, res) => {
   // Get data from req.body (email/username + password)
   // Check username OR email is provided
   // Find user in DB (by username OR email)
   // If user not found → error
   //  Check password is correct (using bcrypt)
   // If wrong password → error
   //  Generate access token + refresh token
   //  Send tokens in secure cookies
   // Return success response

   //step 1: get data from req.body
   const { username, email, password } = req.body;

   // Step 2: Check required fields

   /* if(!(username || email))  ---> !(username || email) mtalab hai ki agar username ya email me se koi bhi ek field provided nahi hai, toh condition true ho jayegi.
   is condition ka matlab hai ki agar user ne login karte waqt username ya email me se koi bhi ek field provide nahi kiya hai, toh 
   hum unko error response denge jisme message hoga "Username or email is required". 
   Ye check isliye important hai taki hum ensure kar sake ki user login karne ke liye kam se kam username ya email me se koi ek field 
   provide kare, taki hum usko database me find kar sake aur login process ko aage badha sake. 
   Agar dono fields missing hai toh user ko error response milega, taki wo samajh sake ki unko login karne ke liye username ya email 
   me se koi ek field provide karna zaroori hai. 
   Is tarah se hum input validation karte hai, taki humare application me sahi data hi aaye aur hum uske basis par aage ke operations
    perform kar sake.
       --->     (!username || !email ) y galat hai ...correct is !(username || email) 

   --> !(username || email) vs (!username && !email) => 

   !(username || email)                                                 (!username && !email)
→ Negation of (username OR email)                                                → True if BOTH username and email are missing
→ True if BOTH username and email are missing                                    → False if EITHER username or email is provided
→ False if EITHER username or email is provided

--->>if we want ki username ya email me se koi ek field se login krna hai then we can use either of the conditions, but if we want ki dono fields me se koi ek field provide karna zaroori hai then we should use (!username && !email) condition.
and in our case, we want ki username ya email me se koi ek field provide karna zaroori hai, toh hum (!username && !email) 
condition use karenge taki hum ensure kar sake ki user ne login karne ke liye kam se kam username ya email me se koi ek field 
provide kiya hai.

---->and if we use !(username || email) condition, toh agar user ne username provide kiya hai aur email nahi diya hai, toh condition 
false ho jayegi aur user ko error response milega, jo ki galat hoga kyunki user ne username provide kiya hai.
   */

   if (!username && !email) { /* This line is checking if both the "username" and "email" fields are not provided in the request body.
     If neither of them is provided, it throws an ApiError with a status code of 400 (Bad Request) and a message indicating that 
    either the username or email is required. This error will be caught by the asyncHandler and passed to the next middleware for error handling. */

      //agar sirf username se login krna hai toh username ko check karenge, agar sirf email se login krna hai toh email ko check karenge, agar dono se login krna hai toh dono ko check karenge
      throw new ApiError(400, "Username or email is required");
   }

   // Step 3: Find user (by username OR email)
   const user = await User.findOne({ // "User" or "user" dono alg hai, "User" is the model we imported from user.model.js, and "user" is the variable we are defining to store the result of the query.
      //findOne method is used to find a single user in the database that matches the provided 
      // username or email. The $or operator is used to specify that either the username or email can match the provided values.
      $or: [{ username }, { email }]
   });

   // Step 4: User not found
   if (!user) {
      throw new ApiError(404, "User does not exist");
   }

   // Step 5: Check password is correct (using bcrypt)
   const isPasswordValid = await user.isPasswordCorrect(password); /* yha ye "User " nhi hai, ye "user" hai, kyunki humne upar user variable me findOne query ka result store kiya hai.
      This line is checking if the provided password matches the hashed password stored in the database for that user. 
      The "isPasswordCorrect" method is a custom instance method defined in the User.model.js that uses bcrypt to compare the provided password with the stored hashed password. It returns true if the passwords 
       match and false if they do not. */

   // Step 6: Wrong password
   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
   }

   //step 7: Generate access token + refresh token
   const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id); /* This line is calling the 
      "generateAccessAndRefereshTokens" helper function that we defined earlier, passing the user's unique identifier (user._id) as
       an argument. The function will generate both an access token and a refresh token for the user and return them as an object. We 
       are using destructuring assignment to extract the accessToken and refreshToken from the returned object and store them in 
       separate variables for further use in the login process. */


   // After generating the tokens, we can also update the user's refresh token in the database to ensure that it is stored 
   // securely and can be used for future authentication requests. This step is important for maintaining the security of the 
   // user's session and allowing them to refresh their access token when needed without having to log in again.
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   // Step 8: Send tokens in secure cookies
   const options = {
      httpOnly: true, //  Prevents JavaScript (and malicious scripts/XSS) from reading the cookie.
      // ye option ensures that the cookie cannot be accessed or modified by client-side JavaScript, providing an additional layer of security against cross-site scripting (XSS) attacks.
      secure: true // Ensures cookie is only sent over HTTPS, protecting it from being intercepted in transit.
   }

   // Step 9: Return success response with user data and tokens
   /* -->A cookie is a small data stored in the browser that helps the server recognize and remember the user. 
   How a Cookie Works:- 
        The Handshake: You log in to a site. The server verifies you.
        The Tagging: The server sends a response that includes a header: Set-Cookie: sessionID=123.
        The Storage: Your browser (Safari, in your case) saves this small text file locally.
        The Memory: Every time you click a link on that same site, the browser automatically attaches that cookie: Cookie: sessionID=123.
        The Recognition: The server sees the tag and says, "Oh, it's Aditya! I don't need to ask for his password again."
   */
   return res.status(200) // 200 OK status code indicates that the login request was successful and the server is returning the requested data (user information and tokens) in the response body.
      .cookie("accessToken", accessToken, options)  /*  iska matalb hai ki hum response me access token ko ek cookie ke roop me bhej rahe
     hai, jiska naam "accessToken" hai, aur usme accessToken variable ka value store kiya gaya hai. Ye cookie client ke browser me 
    store ho jayegi aur har subsequent request ke sath automatically send ho jayegi, allowing the server to authenticate the user
     based on the access token. */
      .cookie("refreshToken", refreshToken, options) /*  similarly, this line is sending the refresh token as a cookie in the response, 
   with the name "refreshToken" and the value stored in the refreshToken variable. This allows the client to securely store the 
 refresh token in their browser and use it for future authentication requests when the access token expires. */
      .json( // ab hum response body me user data aur tokens ko JSON format me bhej rahe hai, taki frontend easily is data ko consume kar sake.
         //This is the actual message the frontend "sees" and uses to display information.
         new ApiResponse(200,
            {
               user: loggedInUser, accessToken, refreshToken  // hum user data aur tokens ko ek object ke roop me bhej rahe hai, jise frontend easily access kar sakta hai.
            },
            "User logged in successfully"
         )
      )
})

//------>>>>>logout user
const logoutUser = asyncHandler(async (req, res) => {

   /* --> sbse pehli problem: how do we know which user is logging out? mtlb user identification kaise karenge?
     (logIn krne me toh hum username/email + password se user identify kar lete hai, but logout me user sirf logout button pe click 
     krta hai, toh uska username/email + password nahi milta hume req.body me, toh hum user ko identify kaise karenge?)
 
   solution-> jb user" /logout" route pr jayega toh uske request ke sath uska JWT access token bhi bhejega (kyunki humne login route me access token ko cookie me set kiya hai, toh wo har request ke sath automatically send hoga).
   --> jese hi "/logout" route pr request jayegi, toh "auth.middleware.js" me verifyJWT middleware execute hoga, jisme hum us JWT token ko 
      verify karenge aur usme se user information extract karenge. 
      Agar token valid hai toh hum "req.user" me user information store kar denge, taki 'logoutUser' controller me hum "req.user" se user ko identify kar sake.
       
   --> logoutUser controller me hum req.user se user id ko access karenge, aur us user ke refresh token ko invalidate kar denge 
      (yaani usko database se remove kar denge), taki wo future me use na kar sake. Is tarah se hum ensure karenge ki jab user logout 
      kare toh uska refresh token bhi invalid ho jaye, taki security maintain rahe.
   */
   // jese req.body ka access hota hai loginUser controller me, waise hi req.user ka access hoga logoutUser controller me, kyunki dono controllers me verifyJWT middleware execute hoga jo req.user ko set karega.
   //   req.user._id -->  is line se hum user id ko access kar sakte hai, jisse hum database me us user ke refresh token ko invalidate kar sakte hai.

   await User.findByIdAndUpdate( // "findByIdAndUpdate" method is used to find a user by their unique identifier (in this case, req.user._id) and update their document in the database.
      req.user._id,  // which user to find
      {
         $set: { // $set operator is used to update the value of a field in a document. In this case, we are updating the "refreshToken" field of the user document with the specified user ID (req.user._id) and setting it to undefined.
            refreshToken: undefined // is line se hum user ke refresh token ko undefined set kar denge, jisse wo future me use nahi kar sakta.
         }
      },
      {
         new: true, // { // return NEW document (after update)}--> This option ensures that the updated document is returned after the update operation is performed. If set to false, the original document before the update would be returned.
      }
   )


   const options = { // ye options hum cookies ko set karne ke liye use karenge, taki hum logout ke time pe access token aur refresh token dono ko expire kar sake.
      httpOnly: true,
      secure: true
   }
   /* --> Why options here? 
  When logging out, we want to clear the authentication cookies (accessToken and refreshToken) from the client's browser.
  To clear a cookie, we can set its value to an empty string and set its expiration date to a past date. 
  The options object allows us to specify the same security settings (httpOnly and secure) for the cookies we are clearing, ensuring that they are removed securely from the client's browser. */

   return res
      .status(200)
      /* .clearCookie() method is used to clear the specified cookie from the client's browser. In this case, we are clearing the 
       "accessToken" cookie by setting its value to an empty string and applying the same security options (httpOnly and secure) 
       that were used when the cookie was originally set. 
       This ensures that the cookie is removed securely from the client's browser, effectively logging the user out by invalidating their access token. */
      .clearCookie("accessToken", options)  // clear from browser
      .clearCookie("refreshToken", options)  // clear from browser
      .json(new ApiResponse(200, {}, "User logged out"));
})


// ***************                                    lecture 16***************

// yha hum refresh token ke basis par naya access token generate karenge, taki user ko baar baar login na karna pade jab bhi uska access token expire ho jaye.

/* working of this controller ye hai ki jab bhi user ka access token expire ho jata hai, toh frontend automatically refresh token 
ke sath ek request bhejta hai is controller ko, aur agar refresh token valid hota hai toh hum uske basis par naya access token 
generate kar ke frontend ko bhej dete hai, taki user ko dobara login na karna pade.
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
   //1. Get refresh token from cookies OR request body
   // 2. Check if refresh token exists
   // 3. Decode the refresh token (verify with JWT)
   // 4. Find user from decoded token
   // 5. Compare incoming token with DB stored token
   // 6. If match → generate new access + refresh tokens
   // 7. Send new tokens in cookies and response

   //--> step 1: Get refresh token from cookies OR request body
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
   /* This line is checking for the presence of a refresh token in two places:
         1. req.cookies.refreshToken: This checks if the refresh token is present in the cookies sent by the client. If the client 
                                       has stored the refresh token as a cookie, it will be accessed here.
         2. req.body.refreshToken: If the refresh token is not found in the cookies, this part checks if it is provided in the 
                                    request body (e.g., as part of a JSON payload).
   
   The logical OR operator (||) is used to return the first truthy value found. So, if the refresh token is present in the cookies, 
   it will be assigned to incomingRefreshToken. If it is not present in the cookies but is provided in the request body, then that value 
   will be assigned to incomingRefreshToken. If neither source provides a refresh token, incomingRefreshToken will be undefined. */

   // Step 2: Check if refresh token exists
   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized: Refresh token is missing");
   }

   try {
      // Step 3: Decode the refresh token (verify with JWT)
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET); /* 
    This line is using the "jwt.verify" method from the jsonwebtoken library to decode and verify the incoming refresh token.
   - incomingRefreshToken: This is the refresh token that we received from the client (either from cookies or request body).
   - process.env.REFRESH_TOKEN_SECRET: This is the secret key that we use to sign and verify the JWT tokens. It should be stored securely in environment variables and not hardcoded in the code.
   
   --> The "jwt.verify" method will decode the token and verify its signature using the provided secret key. If the token is valid, 
      it will return the decoded payload (which typically contains user information and token metadata). 
      If the token is invalid or expired, it will throw an error, which we can catch and handle appropriately.  
      */

      // Step 4: Find user from decoded token
      const user = await User.findById(decodedToken?.userId); /* This line is using the "User" model to find a user in the database based on the user ID that was extracted from the decoded refresh token.
   - decodedToken?.userId: This is the user ID that was included in the payload of the refresh token when it was originally generated. 
                              It is typically stored in the token to identify which user the token belongs to.
   
   - User.findById: This method is used to query the database and find a user document that matches the provided user ID. If a user with
                      that ID exists, it will return the user document; otherwise, it will return null. */

      // Step 5: Compare incoming token with DB stored token 
      if (!user) {
         throw new ApiError(401, "Invalid refresh token: User not found");
      }

      // Step 6: If match → generate new access + refresh tokens
      if (incomingRefreshToken !== user?.refreshToken) {  /* This line is comparing the "refresh token" that was sent by the client 
            (incomingRefreshToken) with the refresh token that is stored in the "user's" document in the database (user.refreshToken).
   
      -->   If the tokens do not match, it means that the incoming refresh token is invalid or has been tampered with, and we should not generate new tokens 
         for this request. In such a case, we throw an ApiError with a status cod e of 401 (Unauthorized) and a message indicating that the 
         refresh token is invalid. This error will be caught by the asyncHandler and passed to the next middleware for error handling. */
         throw new ApiError(401, "Refresh token is expired or used");
      }

      // Step 6: Generate new tokens
      //jb bhi cookies set karte hai, toh hume options bhi set karne padte hai taki wo cookies secure ho, aur client side scripts unko access na kar sake.
      //---> "options" object is typically used when setting cookies in backend frameworks like Express.js. 
      const options = { // ye options hum cookies ko set karne ke liye use karenge, taki hum refresh ke time pe naye access token aur refresh token dono ko securely set kar sake.
         httpOnly: true,
         secure: true
      };

      const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

      // Step 7: Send new tokens in cookies and response
      return res.status(200)
         .cookie("accessToken", accessToken, options)  // set new access token in cookie
         .cookie("refreshToken", newRefreshToken, options)  // set new refresh token in cookie
         .json(
            new ApiResponse(200,
               { accessToken, refreshToken: newRefreshToken },
               "Access token refreshed successfully"));
   } catch (error) {
      throw new ApiError(401, error.message || "Invalid refresh token");
   }
})



// ******************                                    lecture 17***************

// yha hum user ke current password ko change karne ka functionality implement karenge, taki user apna password update kar sake jab bhi wo chahe.
const changeCurrentPassword = asyncHandler(async (req, res) => {
   // 1. Get oldPassword + newPassword from req.body
   // 2. Find user (from req.user via middleware)
   // 3. Verify oldPassword using isPasswordCorrect()
   // 4. If wrong → throw error
   // 5. Set user.password = newPassword
   // 6. user.save({ validateBeforeSave: false })
   //    → pre-save hook auto-hashes new password!
   // 7. Return success response

   // Step 1: Get oldPassword + newPassword from req.body
   const { oldPassword, newPassword } = req.body; /* This line is using destructuring assignment to extract the "oldPassword" and "newPassword" fields from the request body (req.body).
   /* --> if we want ki password changed krte time "newPassword" or ek confirmPassword field bhi ho jisme user se new password ko confirm
    karne ke liye bola jaye, toh hum yaha req.body se confirmPassword bhi extract kar sakte hai, aur usko newPassword ke sath compare
     kar sakte hai, taki hum ensure kar sake ki user ne new password ko sahi se confirm kiya hai.

               --> const { oldPassword, newPassword, confirmPassword } = req.body;
               --> if(newPassword !== confirmPassword) {
                     throw new ApiError(400, "New password and confirm password do not match");
                  }
    */


   // Step 2: Find user from DB (from req.user via middleware)
   const user = await User.findById(req.user?._id); /* yha hum req.user se user id ko access kar rahe hai, jisse hum database me us 
   user ko find kar sake. (req.user is set by the verifyJWT middleware that runs before this controller, so we can be sure that 
   req.user contains the authenticated user's information) 
                           Why req.user?._id works here?
                                    → verifyJWT middleware runs before this
                                    → It attaches user object to req.user
                                    → So user is guaranteed to be logged in
   */

   //Step 3: Verify oldPassword using isPasswordCorrect()
   const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword); /* This line is using the "isPasswordCorrect" method 
      defined in the User model to check if the provided "oldPassword" matches the user's current password stored in the database. 
      The method will return true if the passwords match and false if they do not. */

   // Step 4: If wrong → throw error
   if (!isOldPasswordCorrect) {
      throw new ApiError(400, "Old password is incorrect");
   }

   // Step 5: Set user.password = newPassword
   user.password = newPassword; // yha hum user ke password field ko new password se update kar rahe hai.
   /*  Why user.password = newPassword (not findByIdAndUpdate)?
               → We NEED the pre-save hook to fire!
               → Pre-save hook: if(password modified) → hash it
               → findByIdAndUpdate bypasses pre-save hooks
               → Direct assignment + save() triggers the hook ✅
         */



   // Step 6: user.save({ validateBeforeSave: false })
   await user.save({ validateBeforeSave: false }); /* ye line user document ko save karne ke liye use kiya jata hai. Jab hum "user.password" 
   ko update karte hai, toh mongoose ke pre-save hook me defined logic automatically execute hota hai, jisme new password ko hash 
   kiya jata hai before saving to the database.

   By passing { validateBeforeSave: false }, we are telling mongoose to skip any additional validation checks that might be defined 
   in the schema before saving the document. This is useful in this case because we have already verified the old password and we
    just want to save the new password without triggering any other validation rules that might be present in the User schema. 
     
    "await" -> Database  is presents on different location or continent, that's why we use await at the time of interaction with
     database. It ensures that the code execution waits for the database operation to complete before moving on to the next line of 
     code. This is important because database operations can take some time to complete, and we want to make sure that the user's 
     password is successfully updated in the database before we send a response back to the client. By using "await", we can handle 
     asynchronous operations in a more synchronous manner, making our code easier to read and maintain.

                     Why validateBeforeSave: false?
                           → We're only changing one field
                           → Don't want all other validations to run
                           → Just save the password change
    */

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed successfully"));

})

// yha hum current logged in user ki details ko get karne ka functionality implement karenge, taki frontend me user apni profile page me jaake apni details dekh sake.
const getCurrentUser = asyncHandler(async (req, res) => {

   // currentUser ko get karne ke liye hume user ko identify karna padega, aur user identification ke liye hum JWT token ka use karenge, jisme user ki information hoti hai.
   // jab bhi user apni details ko access karne ke liye request bhejega, toh uske request ke sath uska JWT access token bhi bhejega (kyunki humne login route me access token ko cookie me set kiya hai, toh wo har request ke sath automatically send hoga).
   // jese hi request jayegi, toh "auth.middleware.js" me verifyJWT middleware execute hoga, jisme hum us JWT token ko verify karenge aur usme se user information extract karenge. 
   // Agar token valid hai toh hum "req.user" me user information store kar denge, taki 'getCurrentUser' controller me hum "req.user" se user ki details ko access kar sake.
   // getCurrentUser controller me hum req.user se user ki details ko access karenge, aur usko response me bhej denge, taki frontend me user apni profile page me jaake apni details dekh sake.
   return res.status(200).json(
      new ApiResponse(200, req.user, "Current user details fetched successfully")
   )

   /* --->Why this is so simple:
            verifyJWT middleware already:
                  1. Extracted token from cookies/header
                  2. Verified JWT signature
                  3. Found user in DB
                  4. Removed password and refreshToken
                  5. Attached clean user to req.user

            So by the time this controller runs:
                  req.user = complete user object (no sensitive fields)
            Just return it! ✅
    */
})



/*  Keep TEXT updates and FILE updates SEPARATE! 
               Bad approach:
               One endpoint handles name + email + avatar + cover
               → Too much data in one request
               → Network congestion
               → If user only wants to change name, 
                  still uploads all files again!

               Good approach (industry standard):
               /update-account    → text only (name, email)
               /update-avatar     → only avatar image
               /update-cover-image → only cover image
   --> matlab agar user apna name ya email update karna chahta hai, toh usko apni avatar ya cover image ko dobara upload nahi karna padega, aur 
    agar user apni avatar ya cover image update karna chahta hai, toh usko apne name ya email ko dobara provide nahi karna padega. 
    Is tarah se hum alag alag endpoints create karenge for different types of updates, taki hum network congestion ko avoid kar sake 
    aur user experience ko improve kar sake.
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
   //1. Get details to update from req.body (fullName, email, etc.)
   // 2. Find user from req.user (via middleware)
   // 3. Update user details in DB
   // 4. Return success response

   const { fullName, email } = req.body; // hume jo bhi details update karni hai, wo req.body se mil jayegi, toh hum usko destructure kar lete hai taki hum easily access kar sake.
   // yha hum user ke full name aur email ko update karne ka functionality implement karenge, taki user apni profile page me jaake apni details update kar sake.
   // you can also add more fields like username, avatar, coverImage etc. as per your requirement.

   if (!fullName || !email) { // yha hum check kar rahe hai ki user ne full name aur email dono fields ko provide kiya hai ya nahi, agar koi bhi field missing hai toh hum unko error response denge.
      throw new ApiError(400, "Full name and email are required");
   }

   User.findByIdAndUpdate(
      req.user._id,  // yha hum user ke unique identifier (req.user._id) ke basis par uske document ko database me find kar rahe hai, aur usko update kar rahe hai. 
      {
         $set: { fullName, email } // yha hum $set operator ka use kar rahe hai, jisme hum user ke full name aur email ko update kar rahe hai. 
         // $set operator MongoDB me use hota hai kisi field ki value ko update karne ke liye.
      },
      { new: true }
   ).select("-password"); // yha hum select method ka use kar rahe hai, jisme hum password ko exclude kar rahe hai, taki wo response me na aaye.

   return res
      .status(200).
      json(new ApiResponse(200, {}, "Account details updated successfully"))

})


/* 
         ---> $set: only updates specified fields
                              // Other fields remain unchanged!

                        // -->Without $set (DON'T do this):
                                 { fullName: "New Name" }
                           → Might overwrite entire document!

                        // --> With $set (CORRECT):
                                 { $set: { fullName: "New Name", email: "new@email.com" } }
                           → Only these 2 fields change
                           → Everything else stays same ✅


         -->"findByIdAndUpdate" options:
                              User.findByIdAndUpdate(
                                       id,          // WHAT to find
                                       { $set: {} }, // WHAT to update
                                       { new: true } // RETURN new document (after update)
                              )
                  // { new: true } is critical!
                  // Without it → returns OLD document
                  // With it → returns UPDATED document ✅
 */



// yha hum user ke avatar ko update karne ka functionality implement karenge, taki user apni profile page me jaake apni avatar update kar sake.
const updateUserAvatar = asyncHandler(async (req, res) => {
   // 1. Get avatar file from req.file (Multer)
   // 2. Find user from req.user (via middleware)
   // 3. Upload new avatar to Cloudinary
   // 4. Update user avatar in DB
   // 5. Return success response

   // 1. Get avatar file from req.file (Multer)
   const avatarLocalPath = req.file?.path; /*  yha hum req.file se avatar file ka local path access kar rahe hai, jise Multer middleware ne handle kiya hai. 
    Agar avatar file provided nahi hai, toh avatarLocalPath undefined ho jayega.

    NOTE: Agar aap single file upload kar rahe hai, toh req.file ka use karenge, aur agar multiple files upload kar rahe hai, toh req.files ka use karenge.

    yha hum 1 sirf avatar file ko handle kar rahe hai, toh hum req.file ka use karenge, aur usme se avatar file ka path access karenge.
 */

   if (!avatarLocalPath) { // yha hum check kar rahe hai ki avatar file provided hai ya nahi, agar nahi hai toh hum unko error response denge.
      throw new ApiError(400, "Avatar file is required");
   }


   /* -->> TODO- Delete old avatar from Cloudinary (if exists) --> is step me hum check karenge ki user ke paas pehle se koi avatar hai 
   ya nahi, agar hai toh usko Cloudinary se delete kar denge, taki unnecessary files Cloudinary me store na ho jaye aur hum apne 
   Cloudinary storage ko optimize kar sake. Is step ko implement karne ke liye hume user document me stored avatar URL se us file 
   ka public_id extract karna padega, aur phir us public_id ko use karke Cloudinary API ke through us file ko delete karna padega. 
   Agar user ke paas pehle se avatar nahi hai, toh hum is step ko skip kar denge.
   */

   // 3. Upload new avatar to Cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath); /* This line is calling the "uploadOnCloudinary" helper function, 
   passing the local path of the avatar file as an argument. The function will handle the process of uploading the file to Cloudinary
    and return an object containing information about the uploaded file, including its URL. We are storing this returned object in
     the "avatar" variable for further use in updating the user's avatar in the database. */

   if (!avatar.url) { // yha hum check kar rahe hai ki avatar upload successful hua hai ya nahi, agar upload failed hua hai toh hum unko error response denge.
      throw new ApiError(400, "Error while uploading avatar");
   }

   // 4. Update user avatar in DB
   const user = await User.findByIdAndUpdate(
      req.user?._id, // yha hum user ke unique identifier (req.user._id) ke basis par uske document ko database me find kar rahe hai, aur usko update kar rahe hai. 
      {
         $set: { avatar: avatar.url } // yha hum $set operator ka use kar rahe hai, jisme hum user ke avatar field ko update kar rahe hai, aur usme avatar.url ko set kar rahe hai, jisme Cloudinary se return hua URL hoga.
      },
      { new: true }
   ).select("-password"); // yha hum select method ka use kar rahe hai, jisme hum password ko exclude kar rahe hai, taki wo response me na aaye.

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Avatar updated successfully"))

   /* -->  Why avatar.url (not just avatar)?
       Cloudinary returns full object:
                  avatar = {
                  url: "https://res.cloudinary.com/...",
                  public_id: "abc123",
                  width: 800,
                  height: 600,
                  format: "jpg",
                  // ...many more fields
                  }
   
   // User model stores STRING (just URL):
                  avatar: {
                  type: String,
                  required: true
                  }
   
   // So store only the URL:
         $set: { avatar: avatar.url }  ✅
   // NOT:
         $set: { avatar: avatar }      ❌ (would store whole object)
    */

})

// yha hum user ke cover image ko update karne ka functionality implement karenge, taki user apni profile page me jaake apni cover image update kar sake.
const updateUserCoverImage = asyncHandler(async (req, res) => {
   //same as "updateUserAvatar" controller, but with cover image instead of avatar.

   // 1. Get cover image file from req.file (Multer)
   const coverImageLocalPath = req.file?.path;
   // 2. Find user from req.user (via middleware) --> same as "updateUserAvatar" controller, so we can skip this step here.
   if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is required");
   }
   // 3. Upload new cover image to Cloudinary
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   // yha hum check kar rahe hai ki cover image upload successful hua hai ya nahi, agar upload failed hua hai toh hum unko error response denge.
   if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading cover image");
   }

   // 4. Update user cover image in DB
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: { coverImage: coverImage.url }
      },
      { new: true }
   ).select("-password");

   // 5. Return success response
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Cover image updated successfully"))
})


// ******************                                    lecture 19***************
//(Read documentation for more details in MongoDB website)
/* Aggregation Pipeline in MongoDB:
   --> aggregation pipeline matlab data ko process karne ka ek powerful framework hai MongoDB me, jisme hum multiple stages define 
         kar sakte hai to perform complex data transformations and computations on our collections.
   --> pipeline me har stage ek specific operation perform karta hai, jaise ki filtering, grouping, sorting, projecting, etc. 
   --> har stage ka output next stage ke input ke roop me use hota hai, jisse hum apne data ko step by step transform kar sakte hai.
   --> aggregation pipeline ka use hum tab karte hai jab hume apne data par complex queries run karni hoti hai, jaise ki calculating 
         averages, summing values, grouping data by certain fields, etc.


--> Aggregation pipeline = Series of stages
   Each stage processes documents and passes result to next stage

      Stage 1 → output → Stage 2 → output → Stage 3 → final result

KEY RULE:
  Whatever documents pass stage 1
  ONLY those documents go to stage 2
  
  Example:
    100 documents → Stage 1 filter → 50 documents
    50 documents → Stage 2 process → 50 documents
    50 documents → Stage 3 shape → final output


how to write aggregation pipeline queries:- 
     --> db.aggregate() or db.collection_name.aggregate() method ka use karke hum apni aggregation pipeline queries ko likhte hai.

      db.collection_name.aggregate([         // "collection_name" is the name of the collection on which we want to run the aggregation pipeline.
         { $stage1: { ... } },  -> (1st stage) each object represents a stage in the pipeline, and the order of these stages matters as the output of one stage is the input for the next stage.
         { $stage2: { ... } },   -> (2nd stage)
         { $stage3: { ... } },   -> (3rd stage)
          .
          .                               // Each stage = one object in the array
          .                               // Results from one stage feed into next stage
          .
         {},
   ])                
*/
/*-->Some common stages in aggregation pipeline:
      1. $match: This stage is used to filter documents based on specified criteria, similar (like WHERE clause in SQL).
                        { $match: { username: username } }
                  // Finds documents where username matches
                  // Similar to: WHERE username = 'chaiaurcode'
                  // Best practice: usually FIRST stage to reduce data early

      2. $group: This stage is used to group documents by a specified field and perform aggregate operations like sum, average, count, etc. on the grouped data.

      3. $project: This stage is used to reshape the documents by including, excluding, or adding new fields.
            ---> Select which fields to return
                   {
                     $project: {
                        fullName: 1,      // 1 = include
                        username: 1,
                        email: 1,
                        avatar: 1,
                        coverImage: 1,
                        password: 0       // 0 = exclude (not needed here, just example)
                     }
                     }
                           // Only specified fields (with 1) are returned
                           // Reduces network traffic
                           // Professional practice: never return more than needed


      4. $sort: This stage is used to sort the documents based on specified fields in ascending or descending order.

      5. $lookup: This stage is used to perform a left outer join between two collections, allowing you to combine data 
                  from multiple collections in a single query. (like SQL JOIN.)
                  It "always returns an array" of matching documents from the joined collection, even if there is only one match or no matches at all.
                        {
                                 $lookup: {
                                    from: "subscriptions",     // collection to join
                                    localField: "_id",         // field in current collection
                                    foreignField: "channel",   // field in joined collection
                                    as: "subscribers"          // name for result array
                                 }
                                 }
                                 // Result: adds "subscribers" array to each document
                                 // Contains all matching documents from subscriptions

      6. $addFields: This stage is used to add new calculated fields to the documents or modify existing fields.
                        {
                           $addFields: {
                              subscribersCount: { $size: "$subscribers" },
                              newField: "someValue"
                           }
                        }
                        // Keeps all existing fields
                        // ADDS new fields to the document
                        // Does NOT remove existing fields

      7. $size: Count array elements
               { $size: "$subscribers" }
                  // Returns count of items in subscribers array
                  // "$subscribers" = dollar sign means it's a field reference

      8. $cond — Conditional expression (if-then-else)
                     {
                     $cond: {
                           if: { condition },
                           then: true,
                           else: false
                        }
                     }
      9. $in — Check if value exists in array/object
                  { $in: [valueToFind, "$arrayField"] }
                        // Returns true if valueToFind exists in arrayField
                        // Works for both arrays AND objects 
*/
/*--> In MongoDB Atlas me Aggregation Pipeline ko use karne ke liye, hum apne collection ke upar "aggregate" method call karte hai, 
   jisme hum apni pipeline stages ko define karte hai as an array of objects.
   or

--> MongoDB Atlas me "cluster0" me jaake apne database ke upar click karte hai, phir "collections" me jaake apni collection select 
   karte hai, phir "Aggregations" tab me jaake apni pipeline stages ko define karte hai, aur phir "Run" button click karke apni 
   aggregation query ko execute karte hai.
   Cluster0 me Upar "Aggregations" tab pr click krne pr ek interface open hota hai jisme hum apni aggregation pipeline ke stages ko define kar sakte hai.
         In 2 ways se hum apni aggregation pipeline ke stages ko define kar sakte hai:
          1. Add Stage button click karke har stage ko manually add karna, aur usme required fields ko fill karna.
          2. "Text" option select karke apni aggregation pipeline ko JSON format me directly paste karna, aur phir "Run" button click karke query ko execute karna.



*****Example of aggregation pipeline stage in MongoDB Atlas:
 --> Book + author collections example:  if we have a "books" collection and an "authors" collection, aur hume har book ke sath uske 
                                          author ki details bhi chahiye, toh hum aggregation pipeline me "$lookup" stage ka use karenge to perform a left outer join between the two collections.

      --> Writeing the aggregation pipeline query in MongoDB Atlas using the "Text" option would look like this: 
          -->ye book and author collection mongoDB me store honge is tarah se:
           * Book collection:
            {
               _id: 1 ,  // unique identifier for the book document we ObjectId("...") bhi use kar sakte hai, but yaha humne simple integer id use kiya hai for simplicity.
               title: "Book Title",
               authorId: ObjectId("..."),
               // other book fields
            }

            * Author collection:
            {
               _id: 100, 
               name: "Author Name",
               // other author fields
            }

  --> ye aggregation pipeline query "books" collection ke upar run karne par har book document ke sath uske corresponding 
  "author details" bhi include ho jayengi as an array field named "authorDetails".

         db.books.aggregate([
            {
               $lookup: {
                  from: "authors", // which collection to join with
                  localField: "authorId", // field from books collection
                  foreignField: "_id", // field from authors collection
                  as: "authorDetails" // name of the new array field to store joined data
               }
            }
         ]) 

                                             Result:
                                             {
                                                _id: 1,
                                                title: "Book Title",
                                                authorId: ObjectId("..."),
                                                authorDetails: [
                                                   {
                                                      _id: 100,
                                                      name: "Author Name",
                                                      // other author fields
                                                   }
                                                ]
                                             }  
 */
/*  ⚠️ Critical Points to Remember
                     Collection names in $lookup:
                           When you create a model:      "User.model.js"
                              export const User = mongoose.model("User", userSchema);

                     MongoDB stores it as:
                        "users" (lowercase + plural)

                     In $lookup → from field:
                     from: "users"   ✅ correct
                     from: "User"    ❌ wrong       */
 
const getUserChannelProfile = asyncHandler(async (req, res) => {
   // 1. Get username from URL params
   // 2. Validate username exists
   // 3. Run aggregation pipeline:
   //    Stage 1: $match → find this user
   //    Stage 2: $lookup → get subscribers (people subscribed to this channel)
   //    Stage 3: $lookup → get subscribedTo (channels this user subscribed to)
   //    Stage 4: $addFields → calculate counts + isSubscribed
   //    Stage 5: $project → select what to return
   // 4. Check if channel was found
   // 5. Return channel profile data

   // Step 1: Get username from URL params. -> req.params is used to access the parameters passed in the URL of the request.                    
   const { username } = req.params; /* This line is using destructuring assignment to extract the "username" parameter from the URL parameters (req.params). 
      When a request is made to a route that includes a dynamic segment (e.g., /users/:username), the value of that segment will be available in req.params. 
      By destructuring it, we can directly access the username variable in our code without having to reference req.params.username every time. */

   // Step 2: Validate username exists
   if (!username?.trim()) { // .trim() method is used to remove any leading or trailing whitespace from the username string. 
      throw new ApiError(400, "Username is required");
   }

   // Step 3: Run aggregation pipeline:
   /*-->User.find({ username }) -> hum pehle user find krke uska id nikalke , phir uske id ke basis pr aggregation pipeline 
                                 run kr skte he, but isse do queries chalengi, ek find ke liye aur ek aggregation ke liye, 
   -> toh hum directly aggregation pipeline me hi $match stage ka use karke user ko find kar sakte hai, taki sirf ek hi query
    chale aur hum apne database interactions ko optimize kar sake.
    */

   const channel = await User.aggregate([
      // Stage 1: $match → find this user(1st pipeline stage)
      {
         $match: {
            username: username?.toLowerCase() // yha hum username ko lowercase me convert kar rahe hai, taki case-insensitive search ho sake, aur agar user ne apna username uppercase me set kiya hai toh bhi wo match ho jaye.
         }
      },
      // Stage 2: $lookup → get all subscribers (people subscribed to this channel) (2nd pipeline stage) 
         // "Who subscribed TO this channel?"
         // → Look in "subscriptions " in subscription.model.js where  channel = this user's _id
      {
         $lookup: {
            from: "subscriptions", // which collection to join with. 
            // yaha hum "subscriptions" collection ke sath join kar rahe hai, jisme user ke subscriptions ki details stored hoti hai.
            // Subscriptions.model.js me humne collection name "Subscription" define kiya hai, toh MongoDB me wo collection automatically "subscriptions" ke naam se create ho jata hai (lowercase + plural), isliye hum yaha "subscriptions" collection ke sath join kar rahe hai.

            /* ⚠️ Critical Points to Remember
                           Collection names in $lookup:
                                 When you create a model:      "Subscriptions.model.js"
                                    export const Subscription = mongoose.model("Subscription", subscriptionSchema);       

                           MongoDB stores it as:
                              "subscriptions" (lowercase + plural)

                           In $lookup → from field:
                           from: "subscriptions"   ✅ correct
                           from: "Subscription"    ❌ wrong       */

            localField: "_id", // field from users collection (this user's _id)
            foreignField: "channel", // field from subscriptions collection (channel field in subscription model)
            as: "subscribers" // name of the new array field to store joined data 
         }
      },

      // Stage 3: $lookup → get all subscribedTo (channels this user subscribed to) (3rd pipeline stage)
            // "Who is this user subscribed TO?"
            // → Look in "subscriptions" where subscriber = this user's _id
      {
         $lookup: {
            from: "subscriptions", // which collection to join with (same "subscriptions" collection as before)
            localField: "_id", // field from users collection (this user's _id)
            foreignField: "subscriber", // field from subscriptions collection (subscriber field in subscription model)
            as: "subscribedTo" // name of the new array field to store joined data
         }
      },

      // Stage 4: $addFields → calculate counts + isSubscribed (4th pipeline stage)
          // abhi tak humne iss pipeline me sb data join kiya hai, ab hume is data ko process karna hai taki hum apne response me jo data bhejenge usme subscriber count, subscribedTo count, aur isSubscribed field bhi include ho jaye.
      {
         $addFields: {
            // Count total subscribers
            subscriberCount: {
               $size: "$subscribers", // yha hum $size operator ka use kar rahe hai, jisme hum "subscribers" array jisme document hai uski size ko calculate kar rahe hai, taki hume subscriber count mil jaye.
               // NOTE-> "$subscribers" me $ sign ka use isliye kiya jata hai, taki hum aggregation pipeline me us field ko reference kar sake jo humne pehle stage me create kiya hai (as: "subscribers"), aur usme stored data ko access kar sake.
            },
            // Count channels subscribed to
            channelsSubscribedToCount: {
               $size: "$subscribedTo"
            },

            // --->>>Check if current user is subscribed to this channel
               /* After Stage 2 ($lookup), "subscribers" array looks like:
                        [
                        { subscriber: ObjectId("A"), channel: ObjectId("CaC"), ... },
                        { subscriber: ObjectId("B"), channel: ObjectId("CaC"), ... },
                        { subscriber: ObjectId("C"), channel: ObjectId("CaC"), ... }
                        ]

               We want to know: Is "req.user._id" in this array?
                     $in: [req.user._id, "$subscribers.subscriber"]
                     → Searches through subscribers array
                     → Looks at the "subscriber" field of each object
                     → Checks if req.user._id matches any of them
                     → Returns true/false


*******->  $in works on both arrays AND objects:
               -->// On array:
                        $in: [value, ["a", "b", "c"]]

               -->// On object field within array:
                        $in: [value, "$subscribers.subscriber"]
                           // MongoDB automatically extracts all "subscriber" values
                           // from the subscribers array and searches through them
 */

            isSubscribed: {
               $cond: { /* $cond operator MongoDB me use hota hai conditional statements ko evaluate karne ke liye, jisme hum if-then-else logic ko implement kar sakte hai. 
                     Is case me hum check kar rahe hai ki agar current user ka ID subscribedTo array ke subscriber field me exist 
                     karta hai (using $in operator), toh isSubscribed field ko true set kar denge, otherwise false set kar denge.  */

                  // $in operator is used to check if a value exists in an array or object. here we check in 
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] }, /* yha hum $in operator ka use kar rahe hai, jisme hum check kar rahe 
                     hai ki current user's ID (req.user?._id) "subscribers" array ke "subscriber" field me exist karta hai ya nahi.
                       
                     "subscribers" array me har document me "subscriber" field hota hai, jisme us subscriber ka ID stored hota hai jo is channel ko subscribe kiya hai. 
                     Agar current user's ID is array me exist karta hai, toh iska matlab hai ki current user is channel ko subscribe kiya hua hai, aur hum isSubscribed field ko true set kar denge, otherwise false set kar denge. */

                  then: true,
                  else: false
               }
            }
         }
      },
      // Stage 5: $project → select what to return (5th pipeline stage) (Project only needed fields)
            // ab hume apne response me se unnecessary fields ko exclude karna hai, aur sirf wo fields include karne hai jo frontend me dikhani hai, taki hum apne response ko optimize kar sake.
      {
         // 1 means include, 0 means exclude.
         $project: {
            fullName: 1, // yha hum fullName field ko include kar rahe hai, taki wo response me aaye.
            username: 1,
            subscriberCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
         }
      }

   ])

   // Step 4: Check if channel was found
   if(!channel?.length) { // yha hum check kar rahe hai ki aggregation pipeline se koi channel document return hua hai ya nahi, agar nahi hua hai toh hum unko error response denge.
      throw new ApiError(404, "Channel does not exist");
   }

   // Step 5: Return channel profile data
   return res
   .status(200)
   .json(  // aggregate returns array, we need first element
      new ApiResponse(200, channel[0], "Channel profile fetched successfully")
   )

   /* --> Why channel[0]?
            → Aggregation always returns an array of documents
            → Even if only 1 document matches, it's still in an array
            → So we take the first element (channel[0]) to get the actual document ✅

structure of channel variable after aggregation:
   channel = [
      {
         fullName: "Channel Name",
         username: "channelusername",
         subscribersCount: 100,
         channelsSubscribedToCount: 50,
         isSubscribed: true,
         avatar: "https://res.cloudinary.com/...",
         coverImage: "https://res.cloudinary.com/...",
         email: "
      }
   ]

   so channel[0] is the actual channel document we want to return in the response. 


         --> Why use aggregation for this?
            → We need to join with subscriptions collection TWICE
            → Once to get subscribers, once to get subscribedTo
            → Then we need to calculate counts and isSubscribed
            → Doing all this in regular code would require MULTIPLE queries and complex logic
            → Aggregation pipeline lets us do it all in ONE query, directly in the database, which is much more efficient! ✅
    */
})


//* ******************                                    lecture 20***************

// yha hum user ke watch history ko get karne ka functionality implement karenge, taki user apni profile page me jaake apni watch history dekh sake.
                        /* 🧠 Key Interview Concept — String vs ObjectId
                     -->  What you actually get from req.user._id:
                              req.user?._id
                                 // Returns: "64f7a2b3c9e4f1234567890a"  ← STRING not ObjectId! from '_id: ObjectId("64f7a2b3c9e4f1234567890a")'

                        // In regular Mongoose methods (findById, findOne): (ye string automatically convert ho jata hai ObjectId me, 
                              aur query sahi se work karti hai, toh humko is baare me tension lene ki zarurat nahi hai, kyunki Mongoose 
                              automatically string ko ObjectId me convert kar deta hai behind the scenes, toh hum apne queries me directly string _id 
                              ka use kar sakte hai without worrying about the conversion.)

                        // Mongoose automatically converts string → ObjectId behind the scenes
                        // So no issue there ✅


                        // BUT in Aggregation Pipelines: (But in aggregation pipelines, Mongoose does NOT auto-convert string to 
                              ObjectId, toh agar hum apne aggregation pipeline me req.user._id ko directly use karte hai without 
                              converting it to ObjectId, toh wo match nahi karega kyunki MongoDB me _id field ObjectId type ka hota 
                              hai, aur string "64f7a2b3..." ObjectId("64f7a2b3...") ke barabar nahi hota hai, isliye $match stage me 
                              wo match fail ho jayega aur zero results return honge, toh hume apne aggregation pipeline me explicitly
                               string _id ko ObjectId me convert karna padega using mongoose.Types.ObjectId(req.user._id) taki wo sahi 
                               se match ho sake aur hume correct results mil sake.)
                        // Code goes DIRECTLY to MongoDB
                        --> Mongoose does NOT auto-convert here!
                        --> String "64f7a2b3..." ≠ ObjectId("64f7a2b3...")
                        // → $match will FAIL silently → zero results returned 
                              Solution: Convert string to ObjectId in pipeline:  Must manually convert string → ObjectId for aggregation
                                    new mongoose.Types.ObjectId(req.user._id) ✅ //new lagana zaruri hai, kyunki mongoose.Types.ObjectId ek constructor function hai, jise new keyword ke sath call karna 
                                                                                    hota hai to create a new ObjectId instance from the string _id.

                                 This creates a proper MongoDB ObjectId object
                                  Now $match works correctly in aggregation pipeline ✅

Q: What does req.user._id return?
A: It returns a STRING, not a MongoDB ObjectId.
   Mongoose auto-converts it in regular queries,
   but in aggregation pipelines you must manually convert
   using new mongoose.Types.ObjectId()
                        */
const getWatchHistory = asyncHandler(async (req, res) => {  
   /* 🎬 Why getWatchHistory Needs Nested Lookup? 
         Answer: Because we need to get video details AND owner details for each video in the watch history, which requires two levels of lookup.
         we have a user document that contains an array of video IDs in the watch history, and we want to retrieve not only the details of those videos but also the details of the owners of those videos. 
         So, we need to perform a $lookup to get the video details from the video collection, and then for each video, we need to perform another $lookup to get the owner details from the user collection. 
         This is why we need a nested lookup in our aggregation pipeline.

            The data structure challenge:
                  User document:
                  {
                  _id: "AAA",
                  watchHistory: [
                     ObjectId("vid1"),
                     ObjectId("vid2"),
                     ObjectId("vid3")
                  ]
                  }

                  Video document:
                  {
                  _id: ObjectId("vid1"),
                  title: "Video 1",
                  thumbnail: "...",
                  owner: ObjectId("BBB")  ← points to another User!
                  }

                  User (owner) document:
                  {
                  _id: ObjectId("BBB"),
                  username: "hitesh",
                  avatar: "..."
                  }
   The problem:
            Step 1: $lookup watchHistory → Videos
            → Gets video documents ✅
            → But each video has owner = ObjectId only
            → No owner name/avatar ❌

            Step 2: Need another $lookup inside each video
            → owner ObjectId → User document
            → Get username, avatar, fullName

         This second $lookup INSIDE the first one = NESTED / SUB PIPELINE

   Without sub-pipeline:
   You'd get incomplete video objects
   Owner would just be an ObjectId, not full user data
*/
   const user = await User.aggregate([
      //stage 1: Match the cuurent user by ID
      {
         $match : {
            _id : new mongoose.Types.ObjectId(req.user?._id) // yha hum req.user._id ko explicitly ObjectId me convert kar rahe hai using new mongoose.Types.ObjectId(), taki wo aggregation pipeline me sahi se match ho sake.
         }
      },
      //stage 2: Lookup videos in video history
      {
         $lookup: {
            from: "videos", //from video.model.js collection -> you see there "export const Video = mongoose.model("Video", videoSchema);" toh MongoDB me wo collection automatically "videos" ke naam se create ho jata hai (lowercase + plural), isliye hum yaha "videos" collection ke sath join kar rahe hai.
            localField: "watchHistory", //field from user document (array of video IDs)
            foreignField: "_id", //field from video document (video's unique ID)
            as: "watchHistory",//name of new array field to store joined video documents

             // SUB-PIPELINE: runs for EACH matched video document
            pipeline: [ //yha hum $lookup ke andar ek aur pipeline define kar rahe hai, jisme hum video document ke owner field ko user document ke sath join kar rahe hai, taki hume video owner ki details bhi mil jaye.
                
               // Sub-stage 1: For each video, lookup its owner
               {
                  $lookup: {
                     from: "users", //from user.model.js collection -> you see there "export const User = mongoose.model("User", userSchema);" toh MongoDB me wo collection automatically "users" ke naam se create ho jata hai (lowercase + plural), isliye hum yaha "users" collection ke sath join kar rahe hai.
                     localField: "owner", //field from video document (owner's user ID)
                     foreignField: "_id", //field from user document (user's unique ID)
                     as: "owner", //name of new array field to store joined owner user document

                     //--> After this sub-stage, each video document in watchHistory will have an "ownerDetails" array containing the owner's user document, which includes fields like username, avatar, fullName, etc.
                     //but we don't want the entire user document, we just want specific fields like username and avatar, so we can add another stage here to project only those fields from the ownerDetails array.
                     
                      // NESTED SUB-PIPELINE: shape the owner data
                      pipeline: [
                        {
                           $project: {
                              fullName: 1,
                              username: 1,
                              avatar: 1
                              // Only these 3 fields from owner
                              // No password, email, etc.
                           }
                        }
                      ]
                        /*--> Why nested pipeline for owner details?
                              → We only want specific fields from the owner (username, avatar, fullName)
                              → If we don't use a nested pipeline, we would get the entire user document in ownerDetails, which includes sensitive information like password and email that we don't want to expose.
                              → By using a nested pipeline with $project, we can shape the ownerDetails to include only the fields we want to return in our response, ensuring data privacy and optimizing the amount of data sent over the network. ✅     
                              */ 
                  }
               },
               // Sub-stage 2: Since $lookup returns an array for owner, we can use $addFields to simplify it to a single object (assuming one owner per video)
               {
                  $addFields: {
                     owner: { // ye owner field kaunsa hai or kaha likha hai?
                     // yha hum owner field ko overwrite kar rahe hai, taki wo ab ek array nahi rahe jisme owner document hai, balki directly owner document ho jaye, taki frontend me use karna easy ho jaye.
                     /* ye owner field wahi hai jo humne $lookup me "as: owner" ke naam se define kiya hai, jisme owner user document stored hota hai as an array (kyunki $lookup hamesha array return karta hai), 
                        toh yaha hum usi owner field ko overwrite kar rahe hai taki wo ab ek single object ho jaye instead of an array. */


                        //we can use $first operator to get the first (and only) element from the owner array, since we expect only one owner per video. 
                        // or we can also use $arrayElemAt operator to get the first element of the array. dono tarike se hum owner array me se single owner document ko extract kar sakte hai.
                        $first: "$owner" // Since $lookup returns an array, we use $first to get the single owner document from the array
                     }
                  }
               }

               /*--> Result of this sub-pipeline:
                     Each video document in watchHistory will now look like this:
                     {
                        _id: ObjectId("vid1"),
                        title: "Video 1",
                        thumbnail: "...",
                        owner: {  // owner field now contains the full owner details instead of just the ObjectId
                           fullName: "Owner Name",
                           username: "ownerusername",
                           avatar: "owneravatarurl"
                        }
                     }

                     This way, when we return the watch history to the frontend, each video will already include the owner's username and avatar, so the frontend doesn't have to make additional requests to get that information.
               */
            ]
         }
      },


   ])

   return res
   .status(200)
   .json(
      new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
   )

   /* 🔬 Sub-Pipeline Flow — Step by Step
-->Stage 1 — $match user:
      Input: All User documents
         Match: _id = ObjectId("AAA") (logged-in user)
      Output: ONE user document
         {
         _id: "AAA",
         username: "aditya",
         watchHistory: [ObjectId("vid1"), ObjectId("vid2"), ObjectId("vid3")]
         }

-->Stage 2 — $lookup with sub-pipeline:
      For each ID in watchHistory array:
         → Go to videos collection
         → Find matching video document

For EACH matched video, run sub-pipeline:

  -->Video document BEFORE sub-pipeline:
         {
            _id: ObjectId("vid1"),
            title: "Learn Node.js",
            thumbnail: "url",
            duration: 1200,
            views: 5000,
            owner: ObjectId("BBB")   ← just an ID!
         }

   Sub-stage 1 ($lookup owner):
      → Goes to users collection
      → Finds user with _id = ObjectId("BBB")
      → With inner pipeline → projects only 3 fields
      → owner becomes array:
            owner: [
               { fullName: "Hitesh", username: "hitesh", avatar: "url" }
            ]

  Sub-stage 2 ($addFields → $first):
      → owner: { fullName: "Hitesh", username: "hitesh", avatar: "url" }
      → Now owner is an OBJECT, not array ✅

  Video document AFTER sub-pipeline:
      {
         _id: ObjectId("vid1"),
         title: "Learn Node.js",
         thumbnail: "url",
         duration: 1200,
         views: 5000,
         owner: {                        ← clean object!
            fullName: "Hitesh Choudhary",
            username: "hitesh",
            avatar: "https://cloudinary.com/..."
         }
      }

Final result structure:
// user is array (aggregate always returns array)
            user = [
            {
               _id: "AAA",
               username: "aditya",
               watchHistory: [
                  {
                  _id: "vid1",
                  title: "Learn Node.js",
                  thumbnail: "...",
                  duration: 1200,
                  owner: {
                     fullName: "Hitesh",
                     username: "hitesh",
                     avatar: "..."
                  }
                  },
                  {
                  _id: "vid2",
                  title: "...",
                  // ... same structure
                  }
               ]
               // ...other user fields
            }
            ]

   // We return only watchHistory:
      user[0].watchHistory */
})




export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}












/*lecture 14- Complete USER Register Controller Code

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {

  // Step 1: Get user details
  const { fullName, email, username, password } = req.body;

  // Step 2: Validation
  if ([fullName, email, username, password].some(
    (field) => field?.trim() === ""
  )) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: Check if user exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Step 4: Get file paths from Multer
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // Step 5: Check avatar exists
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Step 6: Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Step 7: Check Cloudinary upload
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Step 8: Create user in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  // Step 9: Remove sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Step 10: Check & return response
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdUser, "User registered successfully")
    );
});

export { registerUser }; */