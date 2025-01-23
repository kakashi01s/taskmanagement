import mongoose, {Schema} from "mongoose";


const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim:true
        },
        description: {
            type: String,
            required: true
        },
        duedate: {
            type: Date,
            default: Date.now
        },
        owner: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        status: {
            type: [String],
            required: true,
            default: [`pending`],
            enum: [
                'pending', 'in-progress', 'completed'
            ]
        },
    },
    {
        timestamps: true
    }
)



export const Task = mongoose.model("Task", taskSchema)