const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.postSignUpUser = async(req, res, next) => {
    try {
        // Extract user data from request body
        const { name, email, password } = req.body;
    
        // Validate user input
        if (!name || !email || !password) {
          return res.status(400).json({ message: 'Please provide name, email, and password' });
        }
    
        // Check if email already exists in the database
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(409).json({ message: 'Email already exists' });
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Create new user instance
        const newUser = await User.create({
          name,
          email,
          password: hashedPassword,
        });

        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email },
          process.env.JWT_SECRET, // Your JWT secret key
          { expiresIn: '1h' } // Token expiration time
        );
    
        // Respond with success message
        res.status(201).json({ message: 'User created successfully', user: newUser, token: token, success: true });
      } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
};

exports.postLogInUser = async (req, res, next) => {
  try {
    // Extract email and password from request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password', success: false });
    }

    // Find user by email in the database
    const user = await User.findOne({ where: { email } });

    // If user doesn't exist, return error
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    // Compare provided password with hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    // If passwords don't match, return error
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials', success: false });
    }

    // If passwords match, create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET, // Your JWT secret key
      { expiresIn: '1h' } // Token expiration time
    );

    // Respond with success message and token
    res.status(200).json({ message: 'Login successful', user: user, token: token, success: true });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};