const express = require('express');
const router = express.Router();
const users = require('../models/userModel');
const posts = require('../models/postModel');
const Chat = require('../models/chatModel');
const authenticateUser = require('../middlewares/auth');
// const socketIo = require('socket.io');


router.get('/friends/:username', async (req, res) => {
    try {
        const user_name= req.params.username;

        const user = await users.findOne({ name: user_name })
                                .populate('followers', 'name')
                                .populate('following', 'name');
        if(!user)
        return res.status(400).json({msg:"user not found"}) ;
    
        const followers = user.followers;
        const followings = user.following;  
        const currentUser= req.user ;
        // res.render('friends', {user, currentUser: currentUser });
        res.render('friends', {
            user: user,
            currentUser: currentUser,
            followers: followers,
            followings: followings
        });

    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.post('/friends/:username', async (req, res) => {
    try {
        const toSearch= req.body.name ;
        console.log(toSearch) ;
        const user = await users.findOne({ name: toSearch });
        if(!user)
        return res.status(404).json({ msg: 'User not found' });
        
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
        res.render('details', { user : user, postdata : formattedPosts, currentUser: currentUser});

    } catch (err) {
        res.status(500).send(err.message);
    }
});




router.post('/follow/:username', authenticateUser ,async (req, res) => {
    try {
        const userToFollow = await users.findOne({ name: req.params.username });
        if (!userToFollow) {
            return res.status(404).send('User not found');
        }
        const currentUser = await users.findById(req.user.id);
        if (!currentUser) {
            return res.status(401).send('Current user not found');
        }
        const followingIndex = currentUser.following.indexOf(userToFollow._id);
        const followersIndex = userToFollow.followers.indexOf(currentUser._id);

        // Check if already following
        if (followingIndex !== -1) {
            currentUser.following.splice(followingIndex, 1);
            userToFollow.followers.splice(followersIndex, 1);
            await currentUser.save();
            await userToFollow.save();
            return res.status(200).send(`Successfully unfollowed ${userToFollow.name}`);
        } else {
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);
            await currentUser.save();
            await userToFollow.save();
            return res.status(200).send(`Successfully followed ${userToFollow.name}`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error following user');
    }
});


router.get('/chat', async (req, res) => {
    const user = req.user;
    const Users = await users.find({ _id: { $ne: user._id } });
    res.render('chat', { Users, user });
});

router.get('/chat/:username', async (req, res) => {
    try{
        const currentUser = req.user;
        const otherUser = await users.findOne({ name: req.params.username });

        if (!otherUser) {
            return res.status(404).send('User not found');
        }

        const room = [currentUser._id, otherUser._id].sort().join('_');
        const messages = await Chat.find({ room }).populate('sender', 'name'); // Populate the sender with the name

        res.render('privateChat', { currentUser, otherUser, room, messages });
    } catch (err) {
        res.status(500).send(err.message);
    }
});



module.exports = router;