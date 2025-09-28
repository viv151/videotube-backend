import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    // get all the data
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //find the videos based on the userId
    const allVideos = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "videos", //look for this table
                    localField: "_id", //match through id
                    foreignField: "owner", // use owner, this is how we find related videos
                    as: "videos",
                    pipeline: [
                        {
                            $match: { isPublished: true },
                        },
                        {
                            $sort: { createdAt: -1 }  // sort (important for consistent pagination) //latest video
                        },
                        {
                            $skip: (page - 1) * limit // skip documents from previous pages  
                        },
                        {
                            $limit: limit
                        },
                        {
                            $project: {
                                duration: 1,
                                thumbnail: 1,
                                description: 1,
                                views: 1,
                                title: 1,
                                videoFile: 1,
                                isPublished: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    videos: 1,
                    _id: 0
                }
            },

        ]
    )

    console.log(allVideos)

    //return the videos
    return res.json(
        new ApiResponse(200, allVideos, "Videos fetched successfully")
    )

})


const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    //get data
    const { title, description } = req.body

    //check if data exists/ validate data
    if (!title && !description) {
        throw new ApiError(400, "Title and description are required")
    }

    //get the video  through req.files
    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }
    //upload them to cloudinary
    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    //check if uploaded
    if (!video.url && !thumbnail.url) {
        throw new ApiError(500, "Error while uploading video and thumbnail")
    }

    //create video object
    const newVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: video.url,
        duration: video.duration,
        owner: req.user?._id
    })


    //check for video creation
    const createdVideo = await Video.findOne(newVideo._id)
    if (!createdVideo) {
        throw new ApiError(500, "Error in uploading video")
    }
    //return response
    return res.status(201).json(
        //create  a new api response object
        new ApiResponse(200, createdVideo, "Video Uploaded Successfully")
    )
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Invalid Video request")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video doesnt exist")
    }

    return res
        .json(
            new ApiResponse(200, video, "Video found successfully")
        )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }


    const thumbnail = req.file?.path;


    if (!thumbnail) {
        throw new ApiError(400, "thumbnail is missing")
    }

    const newThumbnail = await uploadOnCloudinary(thumbnail);

    if (!newThumbnail) {
        throw new ApiError(500, "Error while uploading  thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: newThumbnail.url
            }
        },
        {
            new: true //this returns the updated information
        }
    )


    //return the info
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video details updated successfully")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "Invalid request")
    }

    await Video.findByIdAndDelete(videoId)

    const deletedVideo = await Video.findById(videoId)

    if (!deletedVideo) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, "Video deleted Successfully")
            )
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Invalid request")
    }

    const video = await Video.findById(videoId);
    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Status updated successfully")
        )
})



export { publishAVideo, getAllVideos, getVideoById, updateVideo, deleteVideo, togglePublishStatus }