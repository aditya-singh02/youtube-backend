import { v2 as cloudinary } from "cloudinary";
import fs from "fs";  /* ye file system module hai jisse hum local file ko read kar sakte hai aur delete kar sakte hai. 
                       ye node.js ka built-in module hai, isko alag se install karne ki jarurat nahi hai. (Go to "nodejs fs" site )*/

cloudinary.config({  /* cloudinary ke configuration settings ko set karna jo humne apne ".env" file me store kiye hai, taki hum 
    cloudinary ke API ko use kar sake. In .env file we store because we don't want to hardcode sensitive information like API
     keys directly in our codebase, which can be a security risk. Instead, we use environment variables to keep this information 
     secure and separate from our code. */
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // ye cloudinary account ka naam hai, jise humne apne .env file me CLOUDINARY_CLOUD_NAME variable ke andar store kiya hai.
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*-->uploadOnCloudinary function ka purpose hai ki ye local file path ko le kar us file ko cloudinary par upload kare. 
Agar upload successful hota hai to ye function cloudinary se response return karega jisme file ka URL hoga, aur agar upload fail 
hota hai to ye function null return karega.

-->To upload a file on cloudinary, we use the cloudinary.uploader.upload method, jisme hum local file path ko pass karte hai aur 
ek options object bhi pass karte hai jisme {resource_type: "auto"} set kiya hota hai. Iska matlab hai ki cloudinary automatically file 
type ko detect karega aur uske accordingly file ko process karega.

Agar upload successful hota hai to hum console me ek message print karte hai jisme uploaded file ka URL hota hai, aur phir hum 
local file ko delete kar dete hai using "fs.unlinkSync" method, taki local storage me unnecessary files na rahe. Finally, hum 
cloudinary se response return karte hai.

Agar upload fail hota hai to hum local file ko delete kar dete hai using "fs.unlinkSync" method, taki local storage me unnecessary 
files na rahe, aur phir null return karte hai.
*/
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",  /* "auto" means Cloudinary auto-detects:
                                                → image (jpg, png, gif...)
                                                → video (mp4, avi, mov...)
                                                → raw (pdf, doc, txt...)
                                                Works for ALL file types ✅
                                                No need to specify manually */
        });
        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url); // ye response.url me uploaded file ka URL hota hai, jise hum console me print karte hai.

        // SUCCESS: Delete temp file from local storage (as it's no longer needed after upload)
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) { // file upload failed (could be due to network issues, invalid file format, or any other reason) 
        /* (agar fail hota hai to hum local file ko delete kar dete hai taki local storage me unnecessary files na rahe 
         fail bhi hua hai mtlb ki file hmare local storage me save ho chuki hai but cloudinary par upload nahi ho payi hai so hume 
         us file ko delete karna chahiye taki local storage me unnecessary files na rahe) */

         // FAILURE: Still delete temp file
  // Reason: Don't want corrupted files on server
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

export { uploadOnCloudinary };


//iss code me bug ho skta hai..to usko hum jb test karenge (first file upload krenge)to pata chalega..agar koi bug mila to usko fix karenge..

/*  fs -> we don't need to install fs module because it's a built-in module in node.js, we can directly import it and use it in our code.
-->fs.unlinkSync -> to see documentation of this method, you can go to "nodejs fs" site-> then fs.promises.unlinkSync(path) ka documentation dekho
This method is used to delete a file from the local storage synchronously. It takes the file path as an argument and deletes the file at that path. If the file 
does not exist or there is an error while deleting, it will throw an error. */


/* 
--> response from cloudinary.uploader.upload() contains:
            {
            url: "https://res.cloudinary.com/...",      // public URL
            secure_url: "https://res.cloudinary.com/...", // HTTPS URL
            public_id: "sample",
            format: "jpg",
            resource_type: "image",
            bytes: 12345,
            width: 800,
            height: 600,
            created_at: "2024-01-01T00:00:00Z",
            // ... many more fields
            }

--Most important: "response.url "or "response.secure_url" is the URL of the uploaded file on Cloudinary, 90% of the time we use
 "response.url" to access the uploaded file, but if you want to ensure that the URL is always secure (HTTPS), you can use 
 "response.secure_url" instead. 
--This is what you store in MongoDB!
 */


