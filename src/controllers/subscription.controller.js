import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscriptions.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    // TODO: toggle subscription
    //validate channel id
    if (!channelId) {
        throw new ApiError(400, "Chhanel Id is required")
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "No channel associated with this id")
    }

    //check if subscription exists
    const isSubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: userId
    })
    if (isSubscribed) {
        const unsubscribed = await Subscription.findByIdAndDelete(isSubscribed._id);

        if (!unsubscribed) {
            throw new ApiError(501, "failed to delete the object");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Channel unsubscribed successfully"))
    }
    //if exists then remove
    else {
        const subcribe = await Subscription.create({
            channel: channelId,
            subscriber: userId
        })

        return res
            .status(200)
            .json(new ApiResponse(200, subcribe, "Subsribed successfully"))
    }
    //if doesnt exist then create subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    //validate channel id
    if (!channelId) {
        throw new ApiError(400, "Chhanel Id is required")
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "No channel associated with this id")
    }

    //find the subscribers
    const subscribers = await Subscription.find({
        channel: channelId
    }).populate("subscriber", "username email avatar")

    if (!subscribers) {
        throw new ApiError(404, "No subscribers found")
    }

    //return all the subscribers
    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribers, "Subscribers retrived")
        )
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    //validate subscriber id
    if (!subscriberId) {
        throw new ApiError(400, "Subscriber Id is required")
    }
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "No subcriber associated with this id")
    }

    //find the subscribed channels of the user
    const subscribedChannels = await Subscription.find({
        subscriber: subscriberId
    }).populate("channel", "username email avatar")


    if (!subscribedChannels) {
        throw new ApiError(404, "No subscribed channels found")
    }

    //return all the subscribers
    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedChannels, "Subscribed channels retrived")
        )

})


export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }