import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
 
    name : {
        type: String,
        required: true,
    },
    description : {
        type: String,
        required: true,
    },
    videos : [
        { // Array of video IDs
        type: Schema.Types.ObjectID,
        ref: "Video",
        }
    ],
    ownner: {
        type: Schema.Types.ObjectID,
        ref: "User",
    },

}, {timestamps: true});

export const Playlist = mongoose.model("Playlist", playlistSchema);