import mongoose from "mongoose";
import { Schema } from 'mongoose';/* Importing the Schema constructor from the mongoose library, which is used to define the 
structure of the video documents in the MongoDB database.
yeha hum video ke schema ko define karenge, jisme hum video ke fields aur unke data types ko specify karenge, taki jab hum videos 
ko database me save kare toh wo is structure ke according hi save ho.

Both do the exact same thing:
Option A (Destructured - Clean):                |       Option B (Direct - Common):
import { Schema } from "mongoose";              |       import mongoose from "mongoose";
const userSchema = new Schema({ ... });         |        const userSchema = new mongoose.Schema({ ... });
*/
import bcrypt from "bcrypt"; // For hashing passwords
import jwt from "jsonwebtoken"; // For creating and verifying JWT tokens
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, // Remove leading and trailing whitespace from the username string before saving it to the database.
      index: true // enables fast searching
/* Create an index on the username field to optimize search queries based on usernames,improving performance when querying users by their username.
    -->jb bhi koi user ka username search krna hoga toh ye index use hoga and fast search kr dega, otherwise without 
        index it will do a full collection scan which is slower. */,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudiary URl
      /* yha hum user ke profile picture ka URL store karenge, jo ki cloudinary se aayega. kese ki hum user ke profile 
             picture ko cloudinary pe upload karenge aur uska URL yaha store karenge, taki jab bhi hum user ka profile picture 
             dikhana chahe toh hum is URL ko use karke cloudinary se image fetch kar sake.
            */
    },
    coverImage: {
      type: String, //cloudiary URL
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId, // Array of ObjectIds referencing the Video model, representing the videos that the user has watched.
        ref: "Video",  // This stores array of Video IDs
                      // When user watches a video → push video ID here
                      // Later we can populate this to get video details so we can show watch history with video titles, thumbnails, etc.
      },
    ],
    password: {
      type: String,  // stores HASHED password
      required: [true, "Password is required"], 
      // NEVER store plain text passwords!
      // bcrypt will hash it before saving
    },
    refreshToken: {
      // Store the refresh token for the user, which is used for authentication and session management.
      type: String, // JWT refresh token stored here
      // Access token is NOT stored in DB
      // Only refresh token is stored
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields to the user documents, which will store the timestamps
    // for when a user is created and last updated in the database.
  }
)


/* .pre hook is a Mongoose middleware function that is executed before a specific event occurs on a document, in this case, before saving a user document to the database.
In this code, the .pre("save") hook is used to hash the user's password before saving it to the database. 
This ensures that the password is securely stored in a hashed format rather than in plain text, enhancing the security of user data. 
-->In .pre we use function() instead of arrow function because we need access to the document being saved through the "this" keyword, 
and arrow functions do not have their own "this" context. 
--> async is used because the bcrypt.hash function returns a promise, and we need to wait for the hashing process to complete before proceeding with saving the user document to the database.
-->next() is called to indicate that the middleware has completed its task and to proceed with the next middleware or the actual save operation.
-->return next() is important to avoid hanging the save operation and to ensure that the document is saved to the database after the password has been hashed.

 */
userSchema.pre("save", async function (next) { // Pre-save hook to hash the password just before saving the user document to the database.
  if(!this.isModified("password")) return next(); // If password is not modified, skip hashing

  this.password = await bcrypt.hash(this.password,10); /* Hash the password with a salt round of 10 before saving the user document to the database. 
  -->await is used to wait for the hashing process to complete before proceeding to the next step, ensuring that the password is 
  securely hashed before being stored in the database. 
  10 is the number of salt rounds, which determines the computational cost of hashing the password. A higher number means more security but also more time to hash. */
  
  next();
});


userSchema.methods.isPasswordCorrect = async function (password) { // Method to compare a given password with the hashed password stored in the database for authentication purposes.
  return await bcrypt.compare(password, this.password); /* Compare the provided password with the hashed password stored in the 
  database and return "true" if they match, or "false" if they do not match. 
  -->await is used to wait for the comparison process to complete before returning the result, ensuring that the authentication 
  process is handled correctly. */
}

userSchema.methods.generateAccessToken = function () { // Method to generate a JWT access token for the user, which can be used for authentication and authorization in the application.
  return jwt.sign( /*  Generate a JWT access token for the user using the jsonwebtoken library ".sign", which includes the user's ID 
    and username in the payload, and is signed with a secret key defined in the environment variables. The token also has an 
    expiration time defined in the environment variables. */
    {
      _id : this._id, // Include the user's unique identifier in the token payload, which can be used to identify the user when the token is decoded.
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    }, 
    process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the JWT, which should be kept secure and not exposed publicly.
    {
      expiresIn : process.env.ACCESS_TOKEN_EXPIRES_IN /* Expiration time for the JWT access token, which determines how long the 
       token is valid before it expires and needs to be refreshed.
  --> .env file me access token ke liye expiration time define karna hoga, taki access token automatically expire ho jaye after 
       certain time, for security reasons. */
    }
  )
}

userSchema.methods.generateRefreshToken = function () { // Method to generate a JWT refresh token for the user, which can be used to obtain new access tokens when the current access token expires.
return jwt.sign( /*.sign is used to generate a JWT refresh token for the user, which includes the user's ID and username in the 
  payload, and is signed with a secret key defined in the environment variables. The token also has an expiration time defined in 
  the environment variables. */
    {
      _id : this._id,
    }, 
    process.env.REFRESH_TOKEN_SECRET, 
    {
      expiresIn : process.env.REFRESH_TOKEN_EXPIRES_IN /* .env file me refresh token ke liye bhi expiration time define karna hoga, 
                              taki refresh token bhi expire ho jaye after certain time, for security reasons. */
    }
  )
}


export const User = mongoose.model("User", userSchema);



/*-->mongodb jese hi document ko save karta hai, toh wo usme ek _id field automatically add kar deta hai, jisme wo unique identifier 
store karta hai har document ke liye,  
ye _id field har document ke liye unique hota hai, aur iski madad se hum documents ko uniquely identify kar sakte hain, aur jab hum 
kisi document ko query karte hain toh hum is _id field ka use karke us document ko easily find kar sakte hain. 
*/


/* In Username and fullName fields, we have used index: true.
What is index: true?
Without index:
  DB scans ALL documents to find match
  → Slow for large data

With index:
  DB creates a special lookup table
  → Very fast searching
  → Use on fields you'll search often

Use on: username, fullName (searchable fields)
Don't use on: every field (wastes memory) */

/* 
JWT (JSON Web Token) is a compact, URL-safe means of representing claims to be transferred between two parties. It is commonly used 
for authentication and authorization in web applications. 
A JWT consists of three parts: a header, a payload, and a signature. 

In this code, JWT is used to generate access tokens and refresh tokens for user authentication. 
The access token is used to authenticate API requests, while the refresh token can be used to obtain new access tokens when the 
current access token expires. This allows for secure and efficient session management in the application.

example -> Used in login systems of apps/websites, like:
    Instagram
    Amazon
    Any backend API (Node.js + Mongoose)
Whenever you:
  Login once
  Then keep using app without logging again
 That’s where Access + Refresh tokens are used

 */

/*
--->>>MongoDB Storage for Users
 What you send:                What MongoDB stores:
{                             {
  username: "Hitesh"              _id: ObjectId("63abc..."),  ← auto generated
  email: "...",                   username: "hitesh",
  password: "1234"                email: "...",
}                                 password: "$2b$10$hashed...",  ← encrypted!
                                  refreshToken: "eyJhb...",
                                  watchHistory: [],
                                  createdAt: Date,
                                  updatedAt: Date
                              }

DB name: "users"  ← MongoDB auto-pluralizes + lowercase
*/