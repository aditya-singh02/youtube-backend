import {Router} from 'express';
import { registerUser } from '../controllers/user.controller.js';

const router = Router();

router.route ("/register").post(registerUser);

export default router;

/*--> This code snippet defines a route for user registration using Express.js.
1. We import the Router class from the Express library and the registerUser controller function from the user.controller.js file.
2. We create a new router instance using Router().
3. We define a route for the POST method at the path "/register" and associate it with the "registerUser" controller function. 
    This means that when a client sends a POST request to "/register", the "registerUser" function will be executed to handle that request.
4. Finally, we export the router so that it can be used in other parts of the application, such as in the main app.js file where 
    we would import this router and use it to handle requests related to user registration.

In summary, this code sets up an endpoint for user registration and connects it to the appropriate controller function that will 
handle the logic for registering a new user.

Example usage: from app.js file 
 -->  app.use("/api/v1/users", userRouter); "/api/v1/users" is the base path or prefix for all routes defined in the userRouter. so when 
    we define a route like "/register" in the userRouter, it will be accessed as "/api/v1/users/register" in the application.

now if a client sends a POST request to "/api/v1/users/register", the "registerUser" controller function will be executed to handle that request.
*/

/*
🚦 The Router: Professional URL Structuring
In professional environments , we don't just create random URLs. We use Versioning.

        In app.js: We use a prefix: app.use("/api/v1/users", userRouter);

        In user.routes.js: We define the specific action: router.route("/register").post(registerUser);

        The Final Result: Your API becomes http://localhost:8000/api/v1/users/register. so when a client sends a POST request to this 
                            URL, the "registerUser" controller function will be executed to handle that request.

--->Why Versioning (v1)? If you ever want to change how the app works in the future without breaking the old version for 
existing users, you can simply start building /v2. 

--we use versioning isliye beacause ye future me aapko flexibility deta hai ki aap apne API ko update kar sake without affecting existing users.
matlab agar aapko apne API me kuch changes karne hai, toh aap simply /v2 start kar sakte hai, aur existing users jo /v1 use kar rahe hai, unko 
koi problem nahi hogi.
*/