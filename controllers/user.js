const User = require("../models/user");

exports.postAddUser = async(req, res, next) => {
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
        //const hashedPassword = await bcrypt.hash(password, 10);
    
        // Create new user instance
        const newUser = await User.create({
          name,
          email,
          password
          //password: hashedPassword,
        });
    
        // Respond with success message
        res.status(201).json({ message: 'User created successfully', user: newUser });
      } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
};