const express = require('express');
const router = express.Router();
const users = require('../models/userModel');
const posts = require('../models/postModel');
const authenticateUser = require('../middlewares/auth');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path') ;
const fs = require('fs');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/';
        // Create 'uploads' directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Rename the uploaded file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Create multer instance with storage configuration
const upload = multer({ storage: storage });




router.get('/post/:username',async (req, res) => {
    try {
        const user_name= req.params.username;

        const user = await users.findOne({ name: user_name });
        if(!user)
        return res.status(400).json({msg:"user not found"}) ;
       
        const myPosts = await posts.find({ user: user });

        const formattedPosts = [];

        for (let post of myPosts) {
            const likesCount = post.likes.length;
            const commentsCount = post.comments.length;

            formattedPosts.push({
                _id: post._id,
                title: post.title,
                content: post.content,
                image: post.image,
                likes: likesCount,
                comments: commentsCount
            });
        }
        const currentUser= req.user ;

        res.render('post', { user : user, postdata : formattedPosts, currentUser: currentUser });

    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/post/:username',upload.single('image'), async (req, res) => {
    try {
        const title= req.body.title ;
        const content= req.body.content ;
        const username = req.params.username;
        const user = await users.findOne({ name: username });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const post = new posts({
            user: user._id,
            title: title,
            content: content,
            image: req.file ? `/uploads/${req.file.filename}` : null 
        });

        await post.save();

        res.redirect(`/api/post/${user.name}`);
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message);
        }
});


router.post('/like/:postId', async (req, res) => {
    try {
        const post = await posts.findById(req.params.postId);
        const userId = req.user.id;
        if (!post) {
            return res.status(404).send('Post not found');
        }
        const index = post.likedBy.indexOf(userId);
        if (index === -1) {
            // User has not liked the post, add like
            post.likedBy.push(userId);
            post.likes += 1;
        } else {
            // User has already liked the post, remove like (dislike)
            post.likedBy.splice(index, 1);
            post.likes -= 1;
        }

        await post.save();

        res.status(200).json({ likes: post.likes });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/dislike/:postId', async (req, res) => {
    try {
        const post = await posts.findById(req.params.postId);
        const userId = req.user.id;
        if (!post) {
            return res.status(404).send('Post not found');
        }

        post.dislikes += 1;
        const index = post.likedBy.indexOf(userId);
        post.likedBy.splice(index, 1);
        post.likes -= 1;
        await post.save();

        res.status(200).json({ dislikes: post.dislikes });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/comment/:postId',async (req, res) => {
    try {
        // console.log('adding') ;
        const post = await posts.findById(req.params.postId);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const newComment = {
            user: req.user.id,
            text: req.body.text,
            userName: req.user.name
        };

        post.comments.push(newComment);
        await post.save();
        console.log("comment added") ;
        // res.redirect
        res.status(200).json({ msg: 'Comment added successfully' });
        // res.status(201).json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.post('/delete/:postId', async (req, res) => {
    try {
        await posts.deleteOne({_id:req.params.postId}) ;
        const username= req.user.name ;
        res.redirect(`/api/post/${username}`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.get('/details/:username', async (req, res) => {
    try {
        const user_name= req.params.username;

        const user = await users.findOne({ name: user_name });
        if(!user)
        return res.status(400).json({msg:"user not found"}) ;
       
        const myPosts = await posts.find({ user: user });

        const formattedPosts = [];

        for (let post of myPosts) {
            const likesCount = post.likes.length;
            const commentsCount = post.comments.length;

            formattedPosts.push({
                _id: post._id,
                title: post.title,
                content: post.content,
                likes: likesCount,
                comments: commentsCount,
                image: post.image,
            });
        }
        const currentUser= req.user ;
        // console.log(currentUser.name) ;
        res.render('details', { user : user, postdata : formattedPosts, currentUser: currentUser});

    } catch (err) {
        res.status(500).send(err.message);
    }
});




module.exports = router;