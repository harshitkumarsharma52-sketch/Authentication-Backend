const userModel = require("../model/user.model");
const sessionModel = require("../model/session.model");
const otpModel = require("../model/otp.model");

const sendEmail = require("../services/email.service");
const { generateOtp, getOtpHtml } = require("../utils/utils");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ================= COOKIE OPTIONS =================

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

// ================= TOKEN GENERATION =================

const generateAccessToken = (userId, sessionId) => {
  return jwt.sign(
    {
      id: userId,
      sessionId: sessionId,
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      type: "refresh",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// ================= FIND SESSION =================

const findSessionByRefreshToken = async (userId, token) => {
  const sessions = await sessionModel.find({
    user: userId,
    revoked: false,
  });

  for (const session of sessions) {
    const isMatch = await bcrypt.compare(token, session.refreshToken);

    if (isMatch) {
      return session;
    }
  }

  return null;
};

// ================= REGISTER =================

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Check existing user
    const existingUser = await userModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create unverified user
    const user = await userModel.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
    });

    try {
      // Generate OTP
      const otp = generateOtp();

      // Hash OTP
      const otpHash = await bcrypt.hash(String(otp), 10);

      // Delete previous OTPs
      await otpModel.deleteMany({
        email: normalizedEmail,
      });

      // Save OTP
      await otpModel.create({
        email: normalizedEmail,
        user: user._id,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      // Send OTP email
      await sendEmail(
        normalizedEmail,
        "Verify Your Email Address",
        getOtpHtml(otp, username),
      );
    } catch (emailError) {
      // Cleanup if OTP/email process fails
      await otpModel.deleteMany({
        email: normalizedEmail,
      });

      await userModel.findByIdAndDelete(user._id);

      throw emailError;
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ================= VERIFY OTP =================

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find latest OTP
    const otpDoc = await otpModel
      .findOne({
        email: normalizedEmail,
      })
      .sort({
        createdAt: -1,
      });

    if (!otpDoc) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // Check OTP expiry
    if (!otpDoc.expiresAt || otpDoc.expiresAt <= new Date()) {
      await otpModel.deleteMany({
        email: normalizedEmail,
      });

      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    // Compare OTP with hash
    const isOtpValid = await bcrypt.compare(String(otp), otpDoc.otpHash);

    if (!isOtpValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Verify user
    const user = await userModel.findByIdAndUpdate(
      otpDoc.user,
      {
        isVerified: true,
      },
      {
        returnDocument: "after",
      },
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Delete OTP after successful verification
    await otpModel.deleteMany({
      email: normalizedEmail,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ================= LOGIN =================

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await userModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check email verification
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate refresh token
    const refreshToken = generateRefreshToken(user._id);

    // Hash refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Create session
    const session = await sessionModel.create({
      user: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      refreshToken: refreshTokenHash,
    });

    // Generate access token
    const accessToken = generateAccessToken(user._id, session._id);

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },

      accessToken,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ================= REFRESH TOKEN =================

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        message: "Invalid token type",
      });
    }

    // Find matching session
    const session = await findSessionByRefreshToken(decoded.id, token);

    if (!session) {
      return res.status(401).json({
        message: "Invalid or revoked session",
      });
    }

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken(decoded.id);

    // Hash new refresh token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    // Update session
    session.refreshToken = newRefreshTokenHash;

    await session.save();

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.id, session._id);

    // Set new cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ================= LOGOUT =================

const logoutUser = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.clearCookie("refreshToken", clearCookieOptions);

      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    // Decode token
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.id) {
      res.clearCookie("refreshToken", clearCookieOptions);

      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        message: "Invalid token type",
      });
    }

    // Find session
    const session = await findSessionByRefreshToken(decoded.id, token);

    if (!session) {
      res.clearCookie("refreshToken", clearCookieOptions);

      return res.status(401).json({
        message: "Session not found or already revoked",
      });
    }

    // Revoke session
    session.revoked = true;

    await session.save();

    // Clear cookie
    res.clearCookie("refreshToken", clearCookieOptions);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ================= EXPORT =================

module.exports = {
  registerUser,
  verifyOtp,
  login,
  refreshToken,
  logoutUser,
};
