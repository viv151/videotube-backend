import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = User.findById(userId);
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
    const { email, username, password } = req.body

    if (!username || !email) {
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

    const isPasswordValid = await user.isPasswordCorrent(password)

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

})

export { registerUser, loginUser }  