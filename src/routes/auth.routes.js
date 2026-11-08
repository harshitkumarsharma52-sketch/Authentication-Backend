const express=require("express")
const authController=require("../controllers/auth.controller")

const router=express.Router()

router.post("/register",authController.registerUser)
router.post("/login",authController.login)
router.post("/refresh",authController.refreshToken)
router.post("/logout",authController.logoutUser)    
router.post("/verify-otp",authController.verifyOtp)

module.exports=router;