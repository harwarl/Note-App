const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//flash 
const flash = require('connect-flash');  

//sessions and storing sessions
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

//cross site request forgery
const csrf = require('csurf');
const csrfProtection = csrf();

const MONGO_URL = 'mongodb://127.0.0.1:27017/Ecommerce';

//store sessions
const store = new MongoDBStore({
  uri: MONGO_URL,
  collection: 'sessions'
});

const errorController = require('./controllers/error');
const User = require('./models/user');
 
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


//session related middleware
app.use(session({
  secret: 'my secret key',
  resave: false, 
  saveUninitialized: true, 
  store: store}));

  //csrf middleware
app.use(csrfProtection);
  // flash middleware
app.use(flash());

app.use((req, res, next)=>{
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})


app.use((req, res, next) =>{
  if(!req.session.user){
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
})  // to get the user from the session and mongoose relateed methods

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) =>{
  res.status(500).render('500', {
    pageTitle: 'Error',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
}); 

mongoose
  .connect(
    MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}
  )
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
