const mongoose= require('mongoose');

const plm = require('passport-local-mongoose');
// mongoose.connect('mongodb://localhost/n4socialmedia',{ useNewUrlParser: true } );
mongoose.connect('mongodb+srv://ashutosh123:ashutosh123@testdb-ppgjk.mongodb.net/sample_airbnb?retryWrites=true&w=majority')



var userMod=mongoose.Schema({
  name: String,
  username: String,
  password: String,
  email: String,
  gender: String,
  age: Number,
  Contact: Number,
  profilePic:{
    type: String,
    default:'./images/uploads/profileimage.jpg'
  },
  posts: Array,
  resetToken:String,
  resetTime:String
})

userMod.plugin(plm);
module.exports= mongoose.model('user', userMod);