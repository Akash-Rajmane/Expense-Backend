require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { createTransport } = require("nodemailer");

const path = require("path");
const bcrypt = require("bcrypt");

const rootDir = require("../util/path");

const ForgotPasswordRequest = require("../models/forgotPassword");
const User = require("../models/user");

exports.postForgotPassword = async (req, res, next) => {
  // NOTE: ClickHouse does not support ACID transactions.
  // The forgot-password request creation and email send are NOT atomic.
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with given email not found!" });
    }

    const requestId = uuidv4();
    const data = await ForgotPasswordRequest.create({
      id: requestId,
      userId: user.id,
      isActive: true,
    });

    const transporter = createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: "akashrajmane007@gmail.com",
        pass: process.env.BREVO_SMTP_KEY,
      },
    });
    console.log(data);

    const url = `${process.env.FE_HOST}/password/reset-password/${data.id}`;

    const mailOptions = {
      from: "akashrajmane007@gmail.com",
      to: email,
      subject: "Reset your password",
      html: `
            <p>Hello,</p>
            <p>You have requested to reset your password for Expense Tracker App. Click the link below to reset it:</p>
            <p><a href="${url}">Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getResetPassword = async (req, res, next) => {
  const { uuid } = req.params;

  try {
    const request = await ForgotPasswordRequest.findById(uuid);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Reset password request not found" });
    } else if (!request.isActive) {
      return res
        .status(401)
        .json({ message: "Reset password request is already expired!" });
    }

    res.sendFile(path.join(rootDir, "views", "resetPassword.html"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postUpdatePassword = async (req, res, next) => {
  // NOTE: ClickHouse does not support ACID transactions.
  // The password update and request deactivation are NOT atomic.
  try {
    const uuid = req.params.uuid;
    const { password } = req.body;

    const request = await ForgotPasswordRequest.findById(uuid);

    if (!request) {
      throw new Error("Incorrect link");
    }

    // Deactivate the request
    await ForgotPasswordRequest.update(uuid, { isActive: false });

    const userId = request.userId;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not present");
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    await User.update(userId, { password: hash });

    res.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};
