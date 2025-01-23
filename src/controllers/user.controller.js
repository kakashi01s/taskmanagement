import { AsyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import {ApiResponse} from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js";
import mongoose, { connect } from "mongoose";



const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshsToken()

        // Add tokens to database 
        user.refreshToken = refreshToken
        user.accessToken = accessToken

        // ignores validation from usermodel for required fields eg: Password etc and Saves the value to database
        user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wring while generating Refresh and Access Token")
    }
}

const registerUser = AsyncHandler( async (req, res) => 
    {
        // Get user details from frontend
        // check validation - not empty
        // check if user already exists
        // create user object - create entry in db
        // remove password and refresh token field from response
        // check for user creation
        // return res

        const {fullName, email, password, userId} = req.body

        if(
            [fullName, email, password, userId].some((field) => field?.trim() === "")
        ){
            throw new ApiError(400, "Please Enter all details");
        }

        const existedUser = await User.findOne({
            $or:[{ userId }, { email }]
        })

        if(existedUser){
            throw new ApiError(409, "User already Registered with tihs userName or Email")
        }

        const user = await User.create({
            fullName,
            email,
            password,
            userId: userId
        })

        const userCreated = await User.findById(user._id).select( "-password -refreshToken" )

        if(!userCreated){
            throw new ApiError(400, "Something went wrong while Registering the user");
        }

        return res.status(201).json(
            new ApiResponse(200, userCreated, "User Registered Successfully")
        )
    }
)

const loginUser = AsyncHandler( async (req, res) => {

    // get req body data
    // username or email
    // find the user
    // password check 
    // create access and refresh token 
    // send cookies 

    const {userId, email, password} = req.body

    console.log(userId)

    if(!(userId || email))
    {
        throw new ApiError(400, "Username or Email is Required")
    }

    const user = await User.findOne({
        $or: [ {userId}, {email} ]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password")
    }

    // get refresh token and access token like req.body.
    const {refreshToken , accessToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select( "-password -refreshToken" )


    /// this will force cookies to be only changed by server , frontend cannit edit these
    const options = {
        httpOnly: true,
        secure: true
    }

    // sending cookies to frintend 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged in successfully"
        )
    )

})


const logoutUser = AsyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
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
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = AsyncHandler(async (req, res) => {try {
    
    // access refresh token from cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // if refreshToken is not found in the request that means user is not not Authenticated so we will send an Errir Response
    if(!incomingRefreshToken){
        return new ApiError(401, "Unauthorised Request")
    }

    // when we created a refreshtoken , in its body we paassed several info, including the _id field , so now the decoded refresh token should also contain that 
    // to decide we use a function from jwt , and pass the token and token secret used to create the token
    const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    // send a query to the db to check whether the user with _id is available or not
    const user = await User.findById(decodedRefreshToken?._id)

    // if user is not available in db that means refreshToken is not valid and not ours
    if(!user){
        return new ApiError(401, "Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken)
    {
        return new ApiError(401, "Expired Refresh Token")
    }


    const options = {
        httpOnly: true,
        secure: true
    }

    // custom made function that creates both tokens and saves them to db
    const {newRefreshToken , accessToken} = await generateAccessAndRefreshToken(user?._id)

    // return a response if user is found and refresh Token is correct 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
       new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token refreshed Successfully"
        )
    )

} catch (error) {
throw new ApiError(401, error?.message || "Invalid Refresh Token")
}
})

const addTask = AsyncHandler(async (req,res) => {

    const { title, description} = req.body
    
    const currentuser = await User.findById(req.user._id)

    console.log(currentuser)
    const currenttaskn= await Task.create(
        {
            title: title,
            description: description,
            owner: currentuser,
        }
    )

    console.log(`task created ${currenttaskn}`)
    return res
    .status(200)
    .json(
       new ApiResponse(200, currenttaskn, "task created")
    )


})

const getallTasks = AsyncHandler(async (req,res) => {
        try {
            const user = await User.findById(req.user?._id)
            const tasks = await Task.aggregate(
                [
                    {
                      $match:
                        /**
                         * query: The query in MQL.
                         */
                        {
                          owner: new mongoose.Types.ObjectId(user._id),
                        },
                    },
                  ]
            )

        return res
        .status(200)
        .json(new ApiResponse(200, tasks))
        } catch (error) {
            throw new ApiError(401, error?.message || "Failed to fetch tasks")
        }
})

const deleteTask = AsyncHandler(async (req,res) => {

    try {
        const { _id } = req.body
        
        const task = await Task.findById(new mongoose.Types.ObjectId(_id))

        await Task.deleteOne(task._id)
        return res
        .status(200)
        .json(new ApiResponse(200, "Task deleted Successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Failed to delete task")
    }

})


const updateTask = AsyncHandler(async(req,res) => {
    try {
        const {_id, title, description, status, duedate} = req.body

        const task = await Task.findByIdAndUpdate(_id, {title, description, status, duedate}, {new: true})

        if(!task){
            throw new ApiError(404, "Task not Found");
        }
        return res.status(200).json(task,"Task Updated!")
    } catch (error) {
        throw new ApiError(401, error?.message || "Failed to update task")
    }
})



export {
    registerUser,
    loginUser,
    addTask,
    refreshAccessToken,
    logoutUser,
    getallTasks,
    deleteTask,
    updateTask
}