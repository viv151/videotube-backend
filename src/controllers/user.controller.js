import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //save refreshToken in db, so that the server doesnt ask for password again and again from the user
        user.refreshToken = refreshToken;
        //now save user
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validate fields - not empty atleast check
    //check if user already exists - check using email / username
    //check or images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove passwd and refresh token field from response
    //check for user creation
    //return response 


    //get user details from frontend
    const { fullName, email, username, password } = req.body
    // console.log(email, password, req);

    //validate fields - not empty atleast check
    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    //more dynamic
    if (
        [fullName, email, username, password].some((field) => {
            field?.trim() === "trim"
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //check if user already exists - check using email / username
    const existedUser = await User.findOne({ //make sure to use await here, because all db calls take tim
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //check or images, check for avatar
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload them to cloudinary, avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //create user object - create entry in db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", //safety check since cover image not mandatory
        email,
        password,
        username: username.toLowerCase()
    })

    //remove passwd and refresh token field from response
    //also checking if user is actually created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //return response 
    return res.status(201).json(
        //create  a new api response object
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //get user info
    //validate fields - username/email
    //check if user exists, find the user
    //if user exists check password
    //access and refresh token
    //send cookie
    //return user


    //get user info
    const { email, username, password } = req.body;

    // if (!username || !email) {
    //     throw new ApiError(400, "Username or email is required");
    // }


    //write like this
    // if (!(username || email)) {
    //     throw new ApiError(400, "Username or email is required");
    // }

    //but here we need both email and username, so

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    //validate fields - username/email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    //this user doesnt contain tokens yet
    //because generateTokens function is called later on

    if (!user) {
        throw new ApiError(404, "User doesnt exist")
    }

    //check password

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, " Invalid user credentials")
    }


    //access and refresh token

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id);

    //send cookie

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    //return data

    return res
        .status(200)
        //send cookies
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        //send a json response
        .json(
            new ApiResponse(
                200, {
                //incase user wants the access token and refresh  token
                user: loggedInUser, accessToken,
                refreshToken
            },
                "User logged in successfully"
            )
        )

})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        //first provide the id 
        req.user._id,
        // then provide what to set
        {
            // $set: {
            //     refreshToken: undefined
            // }
            $unset: {
                refreshToken: 1
            }
        },//provide new as true so the new object is received and not the old one in which refeshToken still exists
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    //access the old refresh token 
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken; //incase someone sending refreshToken from mobile

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        //verify incomginf refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        //decodedToken contains the id of the user now
        //which we can use to hit a query and get the user from db

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        //match incoming refresh token and the refresh token saved in db

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        //create a new access token
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    //find logged in user using req.user

    const user = await User.findById(req.user?._id)
    //no select thats why we get passwotd also here 

    //we get the isPasswordCorrect method from the user model
    //either true or false
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    //set new passwd if old passwd is correct

    user.password = newPassword; //the pre hook runs and checks if this is modified
    //if this password has been modified then it encrypts it and saves it in the db
    //lets save this now

    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        )
});


//get current user controller
//user has been saved in the req object using the auth middleware

const getCurrentUser = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})


//update text based data controller
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    //find user to update the submitted fields

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {
            new: true //this returns the updated information
        }
    ).select("-password") //remove psswd from this user object

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        )
})

//update user avatar controller
//we'll require multer middleware here to update the avatar file
const updateUserAvatar = asyncHandler(async (req, res) => {
    //here we are trying to get path of a file and not the entire files array we are accessing
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //upload new file on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);



    //if url not found
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    //todo - delete old image

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }, {
        new: true
    }
    ).select("-password")


    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully")
        )


})

//update user cover Image controller
//we'll require multer middleware here to update the  cover Image file
const updateUserCoverImage = asyncHandler(async (req, res) => {
    //here we are trying to get path of a file and not the entire files array we are accessing
    const coverImgeLocalPath = req.file?.path

    if (!coverImgeLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    //upload new file on cloudinary
    const coverImage = await uploadOnCloudinary(coverImgeLocalPath);

    //if url not found
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, {
        new: true
    }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )



})


//number of subscribers
const getUserChannelProfile = asyncHandler(async (req, res) => {
    //get username
    const { username } = req.params;

    //check if username exists in params
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        //this returns a filtered document
        {
            $match: {
                username: username?.toLowerCase
            }
        },
        //now we apply a lookup on these docs
        //we lookup from the 
        {
            $lookup: {
                from: "subscriptions", //look for this table
                localField: "_id", //match through id
                foreignField: "channel", // use channel, this is how we find subscribers
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions", //look for this table
                localField: "_id", //match through id
                foreignField: "subscriber", // use subscriber, this is how we find what channels we have subscribed to
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subsribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1, //1 means the flag is set to true
                username: 1,
                subsribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    //if channel exists
    if (!channel?.length) {
        throw new ApiError(404, "Channel doesnt exist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User Channel fetched successfully")
        )


})

//get watch history

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                // _id: req.user._id // returns a string , not the actual object id
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
           
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                //writing sub-pipelines
                //find all users/owners
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "users",
                            foreignField: "_id",
                            as: "owner",
                            //remove data which we dont require from the users document
                            //the data below stays in the owner field only. 
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            //overriding existing owner field to get 0th element of the owner array only
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}  