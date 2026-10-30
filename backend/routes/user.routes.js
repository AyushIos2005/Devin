import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();


router.post(
    "/register",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Email must be a valid email address"),

    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),

    userController.createUserController
);


router.post(
    "/login",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Email must be a valid email address"),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    userController.loginController
);


router.post(
    "/verify-email",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),

    body("otp")
        .notEmpty()
        .withMessage("OTP is required"),

    userController.verifyEmail
);


router.post(
    "/resend-otp",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),

    userController.resentOTP
);


router.post(
    "/forgot-password",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),

    userController.forgetPassword
);


router.post(
    "/reset-password",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),

    body("otp")
        .notEmpty()
        .withMessage("OTP is required"),

    body("newPassword")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),

    userController.resetPassowrd
);


router.get(
    "/profile",
    authMiddleware.authUser,
    userController.profileController
);


router.post(
    "/logout",
    authMiddleware.authUser,
    userController.loggoutController
);


router.get(
    "/all",
    authMiddleware.authUser,
    userController.getAllUsersController
);

export default router;
