const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [
        {
            user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            userName: { type: String}, 
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    image:{ type: String },
    createdAt: { type: Date, default: Date.now }
});


const post = mongoose.model('post', postSchema);
module.exports = post;
