import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, //cloudiary URl
            required: true,
        },
        thumbnail: {
            type: String, //cloudiary URl
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectID,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);
// Inject the aggregation plugin attach plugin to videoSchema to enable pagination for aggregate queries on the Video model)
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);




/* Mongoose Aggregate Paginate Plugin:- 
        What is it?
        Regular MongoDB queries (basic):
        findOne, findMany, insertOne, deleteOne
        → Simple but limited

        MongoDB Aggregation Pipeline (advanced):
        → Complex queries
        → Multiple operations in sequence
        → Calculate totals, averages
        → Join collections
        → Filter, group, sort in complex ways

        This is how production apps work! */


/* A--> Paginate means to divide the results into pages, so that instead of showing all the results at once, we can show a limited number 
    of results per page and allow users to navigate through different pages to see more results. This is especially useful when 
    dealing with large datasets, as it improves performance and user experience by loading only a subset of data at a time.

(matlab ki jab hum videos ko list karenge toh wo ek page me limited number of videos dikhayega, aur user next page pe click karke aur 
videos dekh sakta hai,isse humare application ki performance bhi improve hoti hai, kyunki hum ek baar me saare videos load nahi kar 
rahe hote, balki ek page me limited number of videos load kar rahe hote hain. )

-->mongoose-aggregate-paginate-v2 is a plugin used with Mongoose when you're working with MongoDB aggregation pipelines and 
    want easy pagination. 
    Its job is:
    To add pagination (page-wise data) to aggregation queries in MongoDB when using Mongoose.

B-->Break the name (important)                          |          -->Without it: basic queries only
    1. Mongoose                                         |                    You write complex aggregation
        Used to talk to MongoDB in Node.js              |                    Then manually handle pagination 😓
  2. Aggregate                                          |          -->With it: You just call one function and it does everything for you
        Advanced query like:                            |                      It gives: data,total count,pages info etc..
        filtering ($match)                              |                   
        joining ($lookup)                               |                        
        grouping ($group) etc..                         |                        
  3. Paginate                                           |                        
        Show data in pages:                             |              
        Page 1 → 10 items                               |
        Page 2 → next 10 items
   
C--> What it enables:
        Without plugin: basic queries only
        With plugin: can write aggregation pipelines like:

            videoSchema.aggregate([
            { $match: { isPublished: true } },      // filter
            { $lookup: { from: "users", ... } },    // join with users
            { $group: { _id: null, total: ... } },  // group & calculate
            { $sort: { createdAt: -1 } },           // sort
            { $limit: 10 }                          // paginate
            ])

        This is what makes complex features like:
        → Watch history with user details
        → Channel subscriber counts
        → Video analytics dashboard

 D==>>The Problem: Simple vs. Complex Queries:--

->Simple Pagination: If you just want to find "all videos" and show 10 per page, you don't need this plugin. Standard Mongoose can do that easily.

->The "YouTube" Problem: On a real YouTube-like backend, you rarely just fetch "all videos." You fetch videos based on complex logic:
        Find videos by a specific user.
        Join them with the "Likes" collection to get the count.
        Check if the current user is "Subscribed" to the owner.
        Sort them by "Most Recent." and etc..
This complex multi-step process is called an Aggregation Pipeline. Standard pagination tools break when you try to use them on these pipelines.
   
E--->Why Use This Specific Plugin?
    1. Clean Response Object: Instead of just giving you an array of data, it returns a professional object that the frontend needs to build a UI:
            JSON
            {
            "docs": [...],        // The actual 10 videos
            "totalDocs": 500,     // Total videos matching the search
            "limit": 10,
            "page": 1,
            "totalPages": 50,
            "hasNextPage": true   // Tells React: "Show the 'Load More' button"
            }
    2. Handles Complex Aggregations: It works seamlessly with Mongoose's aggregate pipelines, so you can still do all your complex querying and get paginated results without extra work.
    3. Performance (Scaling): When your database grows to millions of videos, you cannot load everything into the server's memory to 
    count them. This plugin performs the count and the data fetch efficiently at the database level.

In summary, mongoose-aggregate-paginate-v2 is essential for efficiently handling pagination in scenarios where you're performing 
complex data retrieval operations using MongoDB's aggregation framework with Mongoose.

{How to inject the plugin:
    import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

    // After schema definition:
    videoSchema.plugin(mongooseAggregatePaginate);
  }

*/
