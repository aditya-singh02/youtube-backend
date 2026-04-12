import multer from "multer";

//multer middleware for handling file uploads

/* multer.diskStorage() -> ye method multer ke andar ek storage engine create karta hai jo ki file uploads ko handle karta hai. Is 
method ko call karne par hume ek object pass karna hota hai jisme hum destination aur filename specify karte hai.

destination -> ye function specify karta hai ki uploaded files ko kaha store karna hai. Is function me hum cb(null, "./public/temp") 
call karte hai, jiska matlab hai ki uploaded files ko "./public/temp" folder me store karna hai.

filename -> ye function specify karta hai ki uploaded files ka naam kya hona chahiye. Is function me hum cb(null, file.originalname) 
call karte hai, jiska matlab hai ki uploaded files ka naam unka original naam hoga jo user ne upload kiya hai. 

(req, file, cb) -> ye parameters multer ke dwara automatically pass kiye jate hai. "req" me request object hota hai, "file" me uploaded 
file ka information hota hai, aur "cb" ek callback function hota hai jise hum call karte hai jab hum destination aur filename specify 
kar dete hai.
*/

//ye code multer ke github documentation sse sidha copy kiya hai, jisme humne destination aur filename specify kiya hai taki uploaded files ko "./public/temp" folder me store kiya ja sake aur unka naam unka original naam ho. 
const storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // specify the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // specify the filename for uploaded files (using current timestamp and original filename)
        
                     /*  💡 Production Tips:- 1
                    File naming:
                                // Current (basic):
                        cb(null, file.originalname)
                                // Problem: Two users upload "photo.jpg" → overwrite!

                                // Better (production):
                        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
                                // Result: "avatar-1704067200000.jpg"
                                // Unique every time ✅ 
                                // */ 
    }
});

/*  multer({ storage: storage }) -> ye code multer middleware ko create karta hai jisme humne storage engine specify kiya hai jo ki 
humne pehle create kiya hai. 
Is middleware ko hum apne routes me use karenge jaha hume file uploads handle karna hai. Jab bhi koi file upload hoti hai, 
to ye middleware us file ko specified destination folder me store karega aur uska naam original filename ke according set karega. 

--> we can write this code as "const upload = multer({ storage })" bhi because in ES6, agar object ke key aur value same hai to hum sirf 
key likh sakte hai, matlab "storage: storage" ko hum "storage" likh sakte hai. 
*/
const upload = multer({ 
    storage   // storage: storage --- IGNORE ---  
                                            /* 💡 Production Tips:- 2
                                         File size limit:
                                            export const upload = multer({
                                            storage,
                                            limits: {
                                                fileSize: 1024 * 1024 * 10  // 10MB limit
                                            }
                                    */
});

export default upload;

/* 
To upload a file on cloudinary, we use the cloudinary.uploader.upload method, jisme hum local file path ko pass karte hai aur 
ek options object bhi pass karte hai jisme {resource_type: "auto"} set kiya hota hai. Iska matlab hai ki cloudinary automatically 
file type ko detect karega aur uske accordingly file ko process karega. 
*/


/* --> we can use this middleware in our routes like this: (see documentation of multer {npm site-> search multer -> go to github repo of multer (npm ke site pr hi link hai)} for more details)
   -> {multer ke github repo me aapko multer ke usage ke examples mil jayenge jisme aap dekh sakte hai ki kaise multer middleware ko apne routes me use karna hai.}
                 import upload from "../middlewares/multer.middleware.js"; // import the multer middleware
                    1.    app.post('/profile', upload.single('avatar'), function (req, res, next) {
                        // req.file is the `avatar` file
                        // req.body will hold the text fields, if there were any
                        })
// upload.single('avatar') -> ye code multer middleware ko specify karta hai ki hum ek single file upload kar rahe hai jiska field name "avatar" hai. 

//iss example me, jab user "/profile" route par ek file upload karta hai, to multer middleware us file ko handle karega aur usko 
specified destination folder me store karega. "upload.single("avatar")" ka matlab hai ki hum ek single file upload kar rahe hai jiska field name "avatar" hai.
-->field name "avatar" ka matlab hai ki user jab file upload karega to usko form me "avatar" field ke andar file select karna hoga, taki multer middleware us file ko handle kar sake.

                    2.   app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
                        // req.files is array of `photos` files
                        // req.body will contain the text fields, if there were any
                        }
// upload.array('photos', 12) -> ye line hi middleware hai jo multer ko specify karti hai ki hum multiple files upload kar rahe hai jiska field name "photos" hai aur maximum 12 files upload kar sakte hai.

here jb user "/photos/upload" route pr jayega aur multiple files upload karega jiska field name "photos" hai, to multer middleware 
un files ko handle karega aur unko specified destination folder me store karega. "upload.array("photos", 12)" ka matlab hai ki hum 
multiple files upload kar rahe hai jiska field name "photos" hai aur maximum 12 files upload kar sakte hai.
-->field name "photos" ka matlab hai ki user jab files upload karega to usko form me "photos" field ke andar files select karna hoga, taki multer middleware un files ko handle kar sake.
 */



/* -->  How Multer Works as Middleware:-->
                    HTTP Request comes in (with file)
                            ↓
                    Multer middleware intercepts
                            ↓
                    Extracts file from request
                            ↓
                    Saves to /public/temp/ folder
                            ↓
                    Adds file info to req.file/req.files
                            ↓
                    Passes control to next() → Controller
                            ↓
                    Controller accesses req.file.path
                            ↓
                    Calls uploadOnCloudinary(req.file.path)
                            ↓
                    Cloudinary uploads and returns URL
                            ↓
                    URL saved to database
                            ↓
                    Temp file deleted from server 


--> Multer middleware HTTP request ko intercept karta hai, file ko extract karta hai, usko specified destination folder me save 
karta hai, aur file information ko req.file (single file ke liye) ya req.files (multiple files ke liye) me add karta hai. 
Phir ye control next() function ke through controller ko pass kar deta hai, jaha controller req.file.path ko access karke 
uploadOnCloudinary function ko call karta hai. uploadOnCloudinary function cloudinary par file upload karta hai aur URL return 
karta hai, jise database me save kiya jata hai. Finally, temp file server se delete kar di jati hai.

---> example:
        // req.file contains:
        {
        fieldname: "avatar",                     // form field name
        originalname: "profile.jpg",             // original file name
        encoding: "7bit",                        // file encoding
        mimetype: "image/jpeg",                  // file MIME type
        destination: "./public/temp",            // destination folder where file is stored
        filename: "profile.jpg",                 // name of the file in the destination folder (same as original name in this case)
        path: "public/temp/profile.jpg",         // ← This is localFilePath! 
        size: 45678                              // file size in bytes
        }

        // The PATH is what you pass to uploadOnCloudinary()
        uploadOnCloudinary(req.file.path) // → uploads file to Cloudinary and returns URL 

--> Middleware position matters:
                            Route → Middleware (upload) → Controller

        "Before going to controller,
        stop at upload middleware first"

        = File saved to /public/temp/
        = req.file is now available
        = Controller can use it
    */

