const User = require('../models/user');
const nodemailer = require('nodemailer');
const sendGridT = require('nodemailer-sendgrid-transport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

// let options = {
//   auth : {
//     api_key: process.env.SENDGRIDAPIKEY
//   }
// }
// const transport = nodemailer.createTransport(sendGridT(options));

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
      user: process.env.GMAILUSER,
      pass: process.env.GMAILPASS
  }
});

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    error : message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    error: message
  });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    User.findOne({email: email})
    .then(user =>{
        if(!user) {
          req.flash('error', 'Invalid Email or Password');
          return res.redirect('/login');
        }
        bcrypt
        .compare(password, user.password)
        .then(doMatch=>{
            if(doMatch){
                req.session.isLoggedIn = true;
                 req.session.user = user;
                return req.session.save((err)=>{
                    console.log(err);
                    res.redirect('/');
                })
              }
            req.flash('error', 'Invalid Password');
            res.redirect('/login');
        })
    })
    .catch(err=>console.log(err));
};

exports.postSignup = (req, res, next) => {
    const {email, password, confirmpassword} = req.body;
    User.findOne({email: email})
    .then(userdoc=>{
      if(userdoc){
        req.flash('error', 'User already exists');
        return res.redirect('/signup');
      } 
      return bcrypt
      .hash(password, 10)
      .then(hashedpassword =>{
          const user = new User({
              email: email,
              password: hashedpassword,
              cart: {items : []}
          })
          return user.save();
      })
      .then(result =>{
          res.redirect('/login');
          return transporter.sendMail(
            {
              from: process.env.GMAILUSER,
              to: email,
              subject: 'Sign Up',
              text: 'Signup was successful',
              html: '<strong>SignUp was successfull</strong>',
            }
          )
      })
      .catch(err=>console.log(err));
    })
    .catch(err=>console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) =>{
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    error : message
  });
}

exports.postReset = (req, res, next) =>{
  crypto.randomBytes(32, (err, buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
    .then(user=>{
      if(!user){
        req.flash('error', 'Email not Registered');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;  //expires after one hour
      return user.save();
    })
    .then(user=>{
      res.redirect('/');
      transporter.sendMail(
        {
          from: process.env.GMAILUSER,
          to: req.body.email,
          subject: 'Reset Password',
          html: `<p>You requested a password reset</p>
          <p>Click This <a href="http://localhost:3000/reset/${token}">link</a> to reset your password</p>`
        }
      )
    })
    .catch(err=>console.log(err))
  })
}

exports.getNewPassword = (req, res, next) =>{
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user=>{
    let message = req.flash('error');
    if(message.length > 0){
      message = message[0];
    }else{
      message = null;
    }
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      error : message,
      userId: user._id.toString(),
      token: token
    });
  })
  .catch(err=>console.log(err))
}

exports.postNewPassword = (req, res, next) =>{
  const { userId, password, token} = req.body;
  let resetUser;
  User.findOne({_id: userId, resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user=>{
    resetUser = user;
    return bcrypt.hash(password, 10);
  })
  .then(hashedPassword =>{
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save()
  })
  .then(result=>{
    return res.redirect('/login');
  })
  .catch(err=>console.log(err));
}