const express = require('express');
const { check, body } = require('express-validator');
const authController = require('../controllers/auth');

const router = express.Router();

router
.route('/login')
.get(authController.getLogin)
.post(authController.postLogin);

router
.route('/signup')
.get(authController.getSignup)
.post([check('email')
.isEmail()
.withMessage('Please Enter a Valid Email'), 
body('password', 'Password should be at least 5 characters long')
.isLength({min: 5, max: 25})
.isAlphanumeric(),
body('confirmPassword')
.custom((value, {req})=>{
    if(value !== req.body.password){
        throw new Error("Passwords have to match");
    }
    return true;
})
], 
authController.postSignup);

router
.route('/reset')
.get(authController.getReset)
.post(authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/newpassword', authController.postNewPassword);

router.post('/logout', authController.postLogout);

module.exports = router;