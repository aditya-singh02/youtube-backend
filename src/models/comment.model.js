import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({

    content: {
        type: String,
        required: true,
    },
    video: {
        type: Schema.Types.ObjectID,
        ref: "Video",
    },
    owner: {
        type: Schema.Types.ObjectID,
        ref: "User",
    }
},{timestamps: true});

// Inject the aggregation plugin attach plugin to commentSchema to enable pagination for aggregate queries on the Comment model)

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
