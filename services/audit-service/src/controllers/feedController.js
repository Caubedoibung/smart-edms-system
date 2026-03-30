const Post = require('../models/Post');

const createPost = async (req, res) => {
  try {
    const { authorId, authorName, avatar, content, role } = req.body;
    
    // Giả lập check quyền hạn cho tác vụ tạo Post (MANAGER/ADMIN mới được tạo)
    if (role !== 'ROLE_ADMIN' && role !== 'ROLE_MANAGER') {
       return res.status(403).json({ error: 'Forbidden: Only MANAGER or ADMIN can post news' });
    }

    const newPost = new Post({ authorId, authorName, avatar, content });
    await newPost.save();

    if (req.io) {
      req.io.emit('NEW_POST', newPost);
    }
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
       return res.status(400).json({ error: 'userId is required' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const hasLiked = post.likes.includes(userId);
    let operator = hasLiked ? '$pull' : '$addToSet';

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { [operator]: { likes: userId } },
      { new: true }
    );

    if (req.io) {
      req.io.emit('POST_UPDATED', { postId: updatedPost._id, likesCount: updatedPost.likes.length, likes: updatedPost.likes });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, content } = req.body;

    if (!userId || !userName || !content) {
        return res.status(400).json({ error: 'Missing comment information' });
    }

    const newComment = { userId, userName, content, createdAt: new Date() };

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $push: { comments: newComment } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (req.io) {
      // Broadcast comment mới cho toàn mạng nội bộ
      req.io.emit('NEW_COMMENT', { postId: updatedPost._id, comment: newComment });
      
      // Notification hẹp thẳng trực tiếp user (Sếp)
      const authorId = updatedPost.authorId;
      if (req.onlineUsers && req.onlineUsers.has(authorId)) {
        const authorSockets = req.onlineUsers.get(authorId);
        authorSockets.forEach(socketId => {
          req.io.to(socketId).emit('NOTIFICATION', `Có người vừa comment vào bài của sếp: ${userName}`);
        });
      }
    }

    res.status(201).json(updatedPost);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { createPost, getPosts, likePost, commentPost };
