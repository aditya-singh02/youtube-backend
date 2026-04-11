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
);

export const User = mongoose.model("User", userSchema);


/*-->mongodb jese hi document ko save karta hai, toh wo usme ek _id field automatically add kar deta hai, jisme wo unique identifier 
store karta hai har document ke liye,  
ye _id field har document ke liye unique hota hai, aur iski madad se hum documents ko uniquely identify kar sakte hain, aur jab hum 
kisi document ko query karte hain toh hum is _id field ka use karke us document ko easily find kar sakte hain. 
*/

/* What is index: true?
Without index:
  DB scans ALL documents to find match
  → Slow for large data

With index:
  DB creates a special lookup table
  → Very fast searching
  → Use on fields you'll search often

Use on: username, fullName (searchable fields)
Don't use on: every field (wastes memory) */