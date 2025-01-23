import { AsyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import {ApiResponse} from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js";
import mongoose, { connect } from "mongoose";



const getallTasksA = AsyncHandler(async (req,res) => {
        try {
            const adminuser = await User.findById(req.User._id)

            if(adminuser.isAdmin == false) {
                return res.status(201).json(new ApiError(201, "User is not Admin"))
            }
            const tasks = await Task.find()

        return res
        .status(200)
        .json(new ApiResponse(200, tasks))
        } catch (error) {
            throw new ApiError(401, error?.message || "Failed to fetch tasks")
        }
})

const deleteTaskA = AsyncHandler(async (req,res) => {

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
    getallTasksA,
    deleteTaskA,
}