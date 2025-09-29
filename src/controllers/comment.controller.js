import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    //get the data
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    //validate the data
    if (!videoId) {
        throw new ApiError(400, "Invalid request")
    }

    //write aggregate query
    const allVideoComments = await Comment.aggregate(
        [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId),
                }
            },
            {
                $sort: { createdAt: -1 }  // sort (important for consistent pagination) //latest video
            },
            {
                $skip: (page - 1) * limit // skip documents from previous pages  
            },
            {
                $limit: limit
            }
        ]
    )

    //return data
    return res
        .status(200)
        .json(
            new ApiResponse(200, allVideoComments, "Comments retrieved successfully")
        )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { text } = req.body
    const { videoId } = req.params


    if (!text) {
        throw new ApiError(400, "Comments shouldnt be empty")
    }

    if (!videoId) {
        throw new ApiError(400, "Invalid request")
    }

    const newComment = await Comment.create({
        content: text,
        video: videoId,
        owner: req.user._id
    })

    const addedComment = await Comment.findById(newComment._id);

    if (!addedComment) {
        throw new ApiError(500, "Comment couldnt be added")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, addedComment, "Comment added successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const text = req.body?.content
    const { commentId } = req.params


    if (!text) {
        throw new ApiError(400, "Comments shouldnt be empty")
    }

    if (!commentId) {
        throw new ApiError(400, "Invalid request")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: text
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(400, "Invalid request")
    }

    await Comment.findByIdAndDelete(commentId);

    const comment = await Comment.findById(commentId);

    if(comment){
        throw new ApiError(500, "Error while deleting comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Comment deleted successfully")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}