import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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
    console.log(email, password)

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
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //check or images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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

export { registerUser }  