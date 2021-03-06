var express = require('express');
var router = express.Router();
const User = require('./users');
const Post = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
var fs = require('fs');

const crypto = require('crypto')
const nodemailer = require('nodemailer')
const multer = require('multer');

// multer file uploads

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },

  filename: function (req, file, cb) {
    var d = new Date();
    d = d.getTime();
    var name = d + file.originalname;
    cb(null, name)
  }
})

var upload = multer({ storage: storage })


passport.use(new localStrategy(User.authenticate()));


/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.render('index', { isLoggedIn: true, username: req.session.passport.user });
  }
  else {
    res.render('index', { isLoggedIn: false });
  }

});

router.post('/uploadsprofilePic', isLoggedIn, upload.single('file'), function (req, res) {
  var path = './images/uploads/' + req.file.filename;
  User.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      if (founduser.profilePic === './images/uploads/profileimage.jpg') {
        founduser.profilePic = path;
        founduser.save()
          .then(function (dpupdated) {
            console.log(founduser);
            res.redirect('/profile')
          })
      }
      else {
        fs.unlink("./public/" + founduser.profilePic, function (err) {
          if (err) { console.log(err); }
          console.log('filedeleted');
          founduser.profilePic = path;
          founduser.save()
            .then(function (val) {
              res.redirect('/profile');
            })
        })
      }
    })
})


router.get('/profile', isLoggedIn, function (req, res) {
  User.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      Post.find()
        .then(function (allpost) {
          res.render("profile", { isLoggedIn: true, username: founduser, posts: allpost, comment: allpost.comments });
        }).catch(function (err) {
          res.send(err);
        })
    })
});



router.post('/register', function (req, res) {
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    gender: req.body.gender,
    age: req.body.age
  })
  User.register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile')
      })
    }).catch(function (err) {
      res.send(err);
    })
})

router.get('/forgot', function (req, res) {
  res.render('forgotpword', { isLoggedIn: false })
})

router.post('/forgot', function (req, res) {
  crypto.randomBytes(30, function (err, token) {
    var resetToken = token.toString('hex');
    User.findOne({ email: req.body.email })
      .then(function (userFound) {
        userFound.resetToken = resetToken;
        userFound.resetTime = Date.now() + 8640000;
        userFound.save()
          .then(function () {
            const tp = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "youremail@gmail.com",
                pass: "password"
              }
            });
            const mailOptions = {
              from: "<QuoteBook>",
              to: req.body.email,
              subject: "Testing the nodemailer",
              text: "reset link : http://" + req.headers.host + "/reset/" + resetToken + '\n\n' + " ignor this mail if not sent by you."
            }
            tp.sendMail(mailOptions, function (err) {
              if (err) {
                res.json(err)
              }
              else {
                res.send('mail sent')
              }
            })
          })
      })
  })
})


router.get('/reset/:token', function (req, res) {
  User.findOne({ resetToken: req.params.token })
    .then(function (userFound) {
      var currentTime = Date.now();
      if (userFound.resetToken === req.params.token && currentTime < userFound.resetTime) {
        res.render('newpassword', { isLoggedIn: false, token: req.params.token });
      }
      else {
        res.send('bhagao maakde ko !');
      }
    })
})

router.post('/resetpassword/:token', function (req, res) {
  User.findOne({ resetToken: req.params.token })
    .then(function (userFound) {
      if (req.body.password === req.body.password2) {
        userFound.setPassword(req.body.password2, function (err) {
          userFound.resetToken = undefined;
          userFound.resetTime = undefined;
          userFound.save()
            .then(function () {
              req.logIn(userFound, function (err) {
                res.redirect('/profile');
              });
            })
        })
      }
    })
})



router.get('/finduser/:username', function (req, res) {
  User.findOne({ username: req.params.username })
    .then(function (founduser) {
      console.log(founduser);
      res.json(founduser)
    })
})




router.get('/like/:id', isLoggedIn, function (req, res, next) {
  Post.findOne({ _id: req.params.id })
    .then(function (post) {
      if (post.likes.indexOf(req.session.passport.user) === -1) {
        post.likes.push(req.session.passport.user);
      }
      else {
        var indexOfHataanewala = post.likes.indexOf(req.session.passport.user);
        var copy = post.likes;
        copy.splice(indexOfHataanewala, 1);
        post.likes = copy;
      }
      post.save(function () {
        res.redirect('/profile')
      })
    })
    .catch(function (err) {
      res.send(err);
    })
});



router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/'
}), function (req, res, next) { });

router.get('/logout', function (req, res, next) {
  req.logOut();
  res.redirect('/')
});

router.post('/createpost', isLoggedIn, function (req, res) {
  User.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      Post.create({
        name: { name: founduser.name, profilePic: founduser.profilePic },
        username: founduser.username,
        post: req.body.post,
      }).then(function (createdPost) {
        res.redirect('/profile');
      })
    })
});

router.post('/comment/:postid', isLoggedIn, function (req, res) {
  User.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      Post.findOne({ _id: req.params.postid })
        .then(function (post) {
          post.comments.unshift({ comment: req.body.comment, commentsName: req.session.passport.user, profilePic: founduser.profilePic });
          post.save();
          res.redirect('/profile')
        })
    })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
}



module.exports = router;