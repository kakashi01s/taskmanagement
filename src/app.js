import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"

const app = express()

app.use(cors({
    origin: process.env.CORSORIGIN,
    credentials: true
}))

app.use(bodyParser.json())
app.use(express.json({limit: "10kb"}))
app.use(urlencoded({ extended: true, limit: "10kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// import routes
import userRouter from "./routes/user.routes.js"
import adminRouter from "./routes/admin.routes.js"




//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/admin", adminRouter)

export {app}