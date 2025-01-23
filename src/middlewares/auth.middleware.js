import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator";


const validateRules = () => {
    return [
    body('email').isEmail().withMessage("Please Enter a Valid Email Address"),
    body('password')
    .isLength({min: 8}).withMessage("Password must be atleast 8 characters long")
    .isStrongPassword().withMessage("Password must coontain one uppercase , one Lowercase and one Special character")
    ]
}

const validateUser = AsyncHandler(async (req, res , next) => {
    const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))

  return res.status(422).json({
    errors: extractedErrors,
  })
})

 const verifyJWT = AsyncHandler(async (req, _, next) => {
        try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
            if(!token){
                new ApiError(401, "UnAuthorised Request")
            }
    
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id)
            .select( "-password -refreshToken" )
    
            if(!user){
    
                throw new ApiError(401, "Invalid Access Token")
            }
    
            req.user = user;
            
            next()
        } catch (error) {
            throw new ApiError(401,error?.message || "Invalid Access Token")
        }
        
})



export {
    validateRules,
    validateUser,
    verifyJWT
}