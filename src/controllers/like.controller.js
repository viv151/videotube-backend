import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id;
    if (!userId) throw new ApiError(401, "Unauthorized");
    //TODO: toggle like on video

    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    //validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const isValidId = await Video.findById(videoId)
    if (!isValidId) {
        throw new ApiError(404, "No video found to this ID");
    }

    //check if like already exists using video + user id

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    //if it exists then remove it (unlike)

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id })
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video unliked successfully"))
    }

    //if doesnt exist then create it (like)

    else {
        const newLike = await Like.create({
            video: videoId,
            likedBy: userId
        })
        return res
            .status(200)
            .json(new ApiResponse(200, newLike, "Video liked successfully"))

    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    if (!commentId) {
        throw new ApiError(400, "Comment Id is required")
    }

    //validate comment id

    if (!mongoose.Types.ObjectId.isValid(commentId))
        throw new ApiError(400, "Invalid commentId");

    const isValidId = await Comment.findById(commentId)
    if (!isValidId) {
        throw new ApiError(404, "No comment find to this id")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    //check if like already exists
    if (existingLike) {
        //delete existing likes
        await Like.deleteOne({ _id: existingLike._id })
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Comment unliked successfully"))
    } else {
        //create like
        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId
        })
        return res
            .status(200)
            .json(new ApiResponse(200, newLike, "Comment Liked Successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!tweetId) {
        throw new ApiError(400, "tweetId is required")
    }

    //validate the tweetId
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Request")
    }

    //check if like exists
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if (existingLike) {
        //delete like if already exists
        await Like.deleteOne({ _id: existingLike._id })
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Tweet unliked successfully"))
    } else {
        //create like if doesnt exist
        const newLike = Like.create({
            tweet: tweetId,
            likedBy: userId
        })
        return res
            .status(200)
            .json(new ApiResponse(200, newLike, "Tweet liked successfully"))
    }

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;
    if (!userId) {
        if (!userId) throw new ApiError(401, "Unauthorized");
    }

    const allLikedVideos = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: userId,
                    video: { $exists: true, $ne: null } // only video likes
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideos"
                }
            },
            {
                $unwind: "$likedVideos" // flatten the array
            },
            {
                $replaceRoot: { newRoot: "$likedVideos" } // only keep video docs
            }
        ]
    )

    return res
        .status(200)
        .json(new ApiResponse(200, allLikedVideos, "Liked videos retrived"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}