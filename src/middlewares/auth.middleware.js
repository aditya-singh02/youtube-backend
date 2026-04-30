// ye middleware function hai jo user ke authentication status ko check karta hai. 
// Agar user authenticated nahi hai, toh ye function unhe login page par redirect kar dega ya unauthorized response bhej dega.

//matalab y sirf itna check krega ki user authenticated hai ya nahi, aur agar nahi hai toh usko login page par bhej dega.


//--> so idea was ki  jb user login krta hai toh uske pass ek JWT token hota hai, aur har baar jab wo koi protected route access krta hai toh hum us token ko verify krte hai.
// agar token valid hai toh user ko access mil jata hai, aur agar token invalid hai toh user ko unauthorized response milta hai.

import asynvHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User } from "../models/user.models.js ";

/*          verifJWT = asyncHandler(async (req, res, next) --> isme jab "res" use na hora ho toh hum usko _ se replace kar dete hai --> its production level code writing convention, taki hume pata chale ki ye variable use nahi hora hai.  */
//                                               |
export const verifJWT = asyncHandler(async (req, _, next) => {
  try {
      // Step 1: Get token from cookies
      const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "") 
      /* agar token cookies me nahi mila toh "authorization" header se token nikalne ki koshish karenge, jisme token "Bearer " se 
      shuru hota hai. JWT token Authorization header me is format me hota hai: 
                                  Authorization: Bearer <token>    isme se hum Bearer ko remove krke actual token nikalenge. 
  
     -->   Authorization header ka use isliye kiya jata hai kyunki kuch clients (jaise mobile apps) cookies ka use nahi karte, aur wo 
     token ko header me bhejte hai. Isliye hum dono jagah se token nikalne ki koshish karte hai, taki humare API flexible ho aur 
     alag-alag clients ke sath kaam kar sake.
  */
  
     if(!token){
      // Step 2: If no token, return unauthorized response
      throw new ApiError(401, "Unauthorized: No token provided") // agar token nahi mila toh 401 Unauthorized error throw karenge, jisme message hoga "Unauthorized: No token provided"
      }
  
      // Step 3: Verify token and get user data from token 
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

      /* 
      -->What jwt.verify does:
            1. Takes the token
            2. Uses secret to verify signature
            3. Checks if token is expired
            4. Returns decoded payload (your original data)

    --> decodedToken contains:
                {
                _id: "user's mongodb id",
                email: "user@example.com",
                username: "chaiaurcode",
                fullName: "Chai aur Code",
                iat: 1234567890,    // issued at
                exp: 1234654290     // expires at
                }

     -->We access _id to find user in DB --->decodedToken?._id */
  
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken") /* decodedToken me user ka id hota hai, 
      jise hum database se find karenge. select("-password -refreshToken") ka matlab hai ki hum password & refreshToken field ko exclude karna chahte hai, taki 
      wo response me na aaye.*/
      
      // Step 4: If user not found, return unauthorized response
      if(!user){
          throw new ApiError(401, "Invalid access token") // agar user database me nahi mila toh 401 Unauthorized error throw karenge, jisme message hoga "Invalid access token"
      }
  
      req.user = user // agar user mil gaya toh usko "req.user" me store kar denge, taki aage ke middleware ya route handlers me us user data ko access kar sake.
      // --> req.user me user data store karne ka fayda ye hai ki aage ke middleware ya route handlers me hum easily req.user se user data ko access kar sakte hai, aur uske basis par authorization checks kar sakte hai ya user-specific data ko handle kar sakte hai.
      // jese logout route me hum req.user se user id ko access karenge, taki us user ke refresh token ko invalidate kar sake.

      next() // agar sab kuch thik hai toh next middleware ya route handler ko call karenge, taki request processing continue ho sake. 
  } catch (error) {
    throw new ApiError(401,error?.message ||  "Invalid access token") 
  }
})




/*  auth middleware ka main purpose ye hai ki wo har protected route par user ke authentication status ko check kare.
agar user authenticated hai toh wo usko access dega, aur agar user authenticated nahi hai toh wo usko login page par redirect kar dega ya unauthorized response bhej dega.

auth middleware me hum JWT token ka use karte hai, jise user login hone ke baad receive karta hai. har baar jab user koi protected 
route access karta hai toh hum us token ko verify karte hai.

agar token valid hai toh user ko access mil jata hai, aur agar token invalid hai toh user ko unauthorized response milta hai.

is tarah se auth middleware ensure karta hai ki sirf authenticated users hi protected routes ko access kar sake. 
 */
 