const User = require('../models/user');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    error : req.flash('error')
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    error: req.flash('error')
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
      })
    })
    .catch(err=>console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
