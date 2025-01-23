import { Router } from "express";
import { addTask, deleteTask, getallTasks, loginUser, logoutUser, registerUser, updateTask } from "../controllers/user.controller.js";
import { validateRules, validateUser, verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()


userRouter.route("/register").post(validateRules(), validateUser, registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/addtask").post(verifyJWT, addTask)
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/alltasks").get(verifyJWT,getallTasks)
userRouter.route("/deletetask").post(verifyJWT,deleteTask)
userRouter.route("/updatetask").post(verifyJWT,updateTask)



export default userRouter