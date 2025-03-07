import express from "express"
import { register, login, logout, forgotPassword,resetPassword} from "../controllers/auth.js"

const router = express.Router()

router.post("/register",register)
router.post("/login",login)
router.post("/logout",logout)
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
export default router