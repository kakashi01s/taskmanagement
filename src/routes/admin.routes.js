import { Router } from "express";
import {verifyJWT } from "../middlewares/auth.middleware.js";
import { addTask } from "../controllers/user.controller.js";
import { deleteTaskA, getallTasksA } from "../controllers/admin.controller.js";

const adminRouter = Router()

adminRouter.route("/addtask").post(verifyJWT, addTask)
adminRouter.route("/alltasks").get(verifyJWT,getallTasksA)
adminRouter.route("/deletetask").post(verifyJWT,deleteTaskA)



export default adminRouter