const User = require('../models/user');
exports.getlogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false
    });
};

exports.postlogin = (req, res, next) =>{
    User.findById('63bd3cf2b490ae23b0dafe49')
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            res.redirect('/');
        })
        .catch(err => console.log(err));
}