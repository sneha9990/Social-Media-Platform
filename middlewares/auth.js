const jwt = require('jsonwebtoken');
const users= require("../models/userModel") ;



const authenticateUser = async(req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.ACCESSTOKENSECRET);
            req.user = await users.findById(decoded.id);
            // console.log('User authenticated:', req.user);
        } catch (err) {
            console.error('Error verifying token:', err);
        }
    } else {
        console.log('No token provided');
    }
    next();
};

module.exports = authenticateUser;
