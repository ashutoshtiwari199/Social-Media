const mongoose= require('mongoose');

mongoose.connect('mongodb://localhost/n4socialmedia');


var postsMod=mongoose.Schema({

    name: {
        name:String,
        profilePic:String
    },
    username:String,
    post: String,
    date: {
        type: Date,
        default: new Date
    },
    likes:[],
    // comments:[{
    //     commentsName:String,
    //     comments:String
    // }]
    comments:[],
    // commentsName:[]
})

module.exports= mongoose.model('post', postsMod);