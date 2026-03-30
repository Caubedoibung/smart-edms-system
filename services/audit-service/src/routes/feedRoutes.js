const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

// For internal newsfeed we leave these APIs open for Frontend to interact directly
// Optionally: implement JWT verification here to ensure callers are authenticated
router.post('/posts', feedController.createPost);
router.get('/posts', feedController.getPosts);
router.put('/posts/:id/like', feedController.likePost);
router.post('/posts/:id/comments', feedController.commentPost);

module.exports = router;
