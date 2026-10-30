
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import userModel from "../models/user.model.js";
import redisClient from "../services/redis.service.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

// ========================================
// OTP CONFIGURATION
// ========================================

const OTP_EXPIRY_SECONDS = 5 * 60;
const OTP_EXPIRY_MS = OTP_EXPIRY_SECONDS * 1000;

// ========================================
// COMMON HELPERS
// ========================================

const normalizeEmail = (email) => {
    return email?.trim().toLowerCase();
};

const validateRequest = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });

        return false;
    }

    return true;
};

// ========================================
// SEND OTP EMAIL
// ========================================

const sendOtpToEmail = async (email, userId, subject) => {
    const otp = String(generateOtp());

    // Remove previous OTP
    await otpModel.deleteMany({ email });

    // Create new OTP
    await otpModel.create({
        email,
        user: userId,
        otp,
        createdAt: new Date()
    });

    try {
        const html = getOtpHtml(otp);

        await sendEmail(
            email,
            subject,
            `Your OTP is ${otp}. It is valid for 5 minutes.`,
            html
        );

        console.log(`OTP email successfully sent to ${email}`);

        return true;

    } catch (error) {
        // Remove OTP if email delivery fails
        await otpModel.deleteMany({ email });

        console.error("OTP Email Error:", error);

        throw new Error("Unable to send OTP email. Please try again.");
    }
};

// ========================================
// VERIFY OTP
// ========================================

const verifyEmailOtp = async (email, otp) => {
    const otpRecord = await otpModel.findOne({
        email,
        otp: String(otp).trim()
    });

    if (!otpRecord) {
        return null;
    }

    const createdAt = new Date(otpRecord.createdAt).getTime();

    if (Date.now() - createdAt > OTP_EXPIRY_MS) {
        await otpModel.deleteMany({ email });
        return null;
    }

    return otpRecord;
};

// ========================================
// CREATE USER / REGISTER
// ========================================

export const createUserController = async (req, res) => {
    if (!validateRequest(req, res)) return;

    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        // Check existing account
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.otpVerify
                    ? "Email is already registered. Please login."
                    : "Account already exists but email is not verified. Please resend OTP."
            });
        }

        // Create user
        const user = await userService.createUser({
            email,
            password
        });

        // Send verification OTP
        await sendOtpToEmail(
            user.email,
            user._id,
            "Email Verification OTP"
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful. OTP sent to your email.",
            user: {
                _id: user._id,
                email: user.email,
                otpVerify: user.otpVerify
            }
        });

    } catch (error) {
        console.error("Create User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to register user."
        });
    }
};

// ========================================
// LOGIN
// ========================================

export const loginController = async (req, res) => {
    if (!validateRequest(req, res)) return;

    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        const user = await userModel
            .findOne({ email })
            .select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Check email verification
        if (!user.otpVerify) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first.",
                code: "EMAIL_NOT_VERIFIED"
            });
        }

        const token = await user.generateJWT();

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                _id: user._id,
                email: user.email,
                otpVerify: user.otpVerify
            },
            token
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

// ========================================
// VERIFY EMAIL
// ========================================

export const verifyEmail = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.otpVerify) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified."
            });
        }

        const otpRecord = await verifyEmailOtp(email, otp);

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        user.otpVerify = true;
        await user.save();

        // OTP is single-use
        await otpModel.deleteMany({ email });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now login."
        });

    } catch (error) {
        console.error("Verify Email Error:", error);

        return res.status(500).json({
            success: false,
            message: "Email verification failed."
        });
    }
};

// ========================================
// RESEND OTP
// ========================================

export const resentOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.otpVerify) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified."
            });
        }

        await sendOtpToEmail(
            user.email,
            user._id,
            "Email Verification OTP"
        );

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (error) {
        console.error("Resend OTP Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to resend OTP."
        });
    }
};

// ========================================
// FORGOT PASSWORD
// ========================================

export const forgetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const user = await userModel.findOne({ email });

        // Do not reveal account existence
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account exists, an OTP will be sent."
            });
        }

        await sendOtpToEmail(
            user.email,
            user._id,
            "Password Reset OTP"
        );

        return res.status(200).json({
            success: true,
            message: "If an account exists, an OTP will be sent."
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request."
        });
    }
};

// ========================================
// RESET PASSWORD
// ========================================

export const resetPassowrd = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and new password are required."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid password reset request."
            });
        }

        const otpRecord = await verifyEmailOtp(email, otp);

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        // Hash new password
        user.password = await userModel.hashPassword(newPassword);

        await user.save();

        // Delete used OTP
        await otpModel.deleteMany({ email });

        return res.status(200).json({
            success: true,
            message: "Password reset successfully."
        });

    } catch (error) {
        console.error("Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password."
        });
    }
};

// ========================================
// USER PROFILE
// ========================================

export const profileController = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user
        });

    } catch (error) {
        console.error("Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile."
        });
    }
};

// ========================================
// LOGOUT
// ========================================

export const loggoutController = async (req, res) => {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token not found."
            });
        }

        await redisClient.set(
            token,
            "logout",
            "EX",
            60 * 60 * 24
        );

        res.clearCookie("token");

        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });

    } catch (error) {
        console.error("Logout Error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed."
        });
    }
};

// ========================================
// GET ALL USERS
// ========================================

export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const allUsers = await userService.getAllUsers({
            userId: loggedInUser._id
        });

        return res.status(200).json({
            success: true,
            users: allUsers
        });

    } catch (error) {
        console.error("Get All Users Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch users."
        });
    }
};
