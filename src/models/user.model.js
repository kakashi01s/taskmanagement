import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


const userSchema = new Schema(

    {
        userId: {
            type: String,
            required: true,
            lowercase:true,
            index:true,
            unique:true,
            trim:true
        },
        email: {
            type: String,
            required: true,
            lowercase:true,
            unique:true,
            trim:true
        },
        fullName: {
            type: String,
            required: true,
            index:true,
            trim:true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String,
        },
        isAdmin: {
            type: Boolean,
            default: false
        }
},
{
    timestamps: true
}
)


// Pre hook by mongoose - > Using this to do an operation (Encrypt password) before saving the data to database
// Async function because this process is time consuming 
// "next" flag is used in these hooks so that we can pass the flag to next data
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshsToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
}

export const User = mongoose.model("User", userSchema)