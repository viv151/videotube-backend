import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async (req, res) => {
    //get tweet and userId
    const { tweet } = req.body;
    const userId = req.user?._id;

    //validate both
    if (!tweet) {
        throw new ApiError(400, "Tweet cannot be empty")
    }

    if (tweet.length > 280) {
        throw new ApiError(400, "Tweet exceeds maximum length of 280 characters");
    }

    if (!userId) throw new ApiError(401, "Unauthorized");

    //create a tweet
    const newTweet = await Tweet.create({
        content: tweet,
        owner: userId
    })

    //get the created tweet using id, check if it exists

    const createdTweet = await Tweet.findById(newTweet?._id)

    if (!createdTweet) {
        throw new ApiError(500, "Error while creating tweet")
    }

    //return data

    return res.
        status(200)
        .json(
            new ApiResponse(200, createdTweet, "Tweet created successfully")
        )
})


const getUserTweets = asyncHandler(async (req, res) => {
    //get user id
    const { userId } = req.params;
    //  console.log(userId)

    //validate id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    //get the user tweets

    const allUserTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    // console.log(allUserTweets)

    if (!allUserTweets) {
        throw new ApiError(500, "Error fetching tweets")
    }

    //return 
    return res
        .status(200)
        .json(
            new ApiResponse(200, allUserTweets, "Tweets fecthed successfully")
        )


})


const updateTweet = asyncHandler(async (req, res) => {
    //get content and tweet id
    const userId = req.user._id
    const { tweetId } = req.params
    const { content } = req.body

    //validate data and id
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    if (!content || (content.length > 280)) {
        throw new ApiError(400, "Tweet cannot be empty or greater than 280 characters")
    }

    //find tweet
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    //check if user is authorized to delete the tweet
    if (!tweet.validateUser(userId)) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    if (content === tweet.content) {
        throw new ApiError(409, "This content is already present");
    }

    //update data
    tweet.content = content;
    await tweet.save();


    //return the updated tweet
    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet updated successfully")
        )
})


const deleteTweet = asyncHandler(async (req, res) => {
    //get tweet id
    const userId = req.user._id;
    const { tweetId } = req.params

    //validate tweet id
    if (!tweetId) {
        throw new ApiError(400, "Tweet id cannot be empty")
    }

    //check if tweet if is valid
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Tweet id is invalid")
    }

    //check if tweet exists
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    //check if user is authorized to delete the tweet
    if (!tweet.validateUser(userId)) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    //delete tweet
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    //return res

    return res
        .status(200)
        .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
})


export { createTweet, getUserTweets, updateTweet, deleteTweet }