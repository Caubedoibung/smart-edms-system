const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  authorId: { type: Number, required: true },
  authorName: { type: String, required: true },
  avatar: { type: String, default: null },
  content: { type: String, required: true },
  likes: [{ type: Number }], // Lấy userId thay vì ObjectID cho dễ check
  comments: [commentSchema]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
