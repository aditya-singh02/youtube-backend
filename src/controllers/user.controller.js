import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
   if (!username || !email) { // agar username ya email kisi se login krna ho toh dono ko check krna padega, agar dono me se koi bhi ek field missing hai toh hum error throw karenge
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
const logoutUser = asyncHandler(async (req,res) => {

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

     await  User.findByIdAndUpdate( // "findByIdAndUpdate" method is used to find a user by their unique identifier (in this case, req.user._id) and update their document in the database.
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






export {
   registerUser,
   loginUser,
   logoutUser
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