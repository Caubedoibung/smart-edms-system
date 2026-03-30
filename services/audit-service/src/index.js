const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartedms-audit';

app.use(cors());
app.use(express.json());

const auditRoutes = require('./routes/auditRoutes');
const feedRoutes = require('./routes/feedRoutes');

// In-Memory RAM storage cho Online Users
const onlineUsers = new Map();

// Inject io vào req cho realtime notifications inside controller
app.use((req, res, next) => {
  req.io = io;
  req.onlineUsers = onlineUsers;
  next();
});

app.use('/api/audit', auditRoutes);
app.use('/api/feed', feedRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Audit Service' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Extract userId từ token/handshake do Frontend truyền lên
  const userId = socket.handshake.auth?.userId;
  
  if (userId) {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast toàn công ty báo ai đó vừa sáng đèn
      io.emit('USER_ONLINE', userId);
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Trả về full danh sách đang sáng đèn cho user vừa mới truy cập
    socket.emit('ONLINE_USERS_LIST', Array.from(onlineUsers.keys()));
  }

  socket.on('disconnect', () => {
    if (userId && onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId);
      userSockets.delete(socket.id);
      
      // Tập Set rỗng tức là user này vừa tắt cái Tab hệ thống cuối cùng
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('USER_OFFLINE', userId);
      }
    }
  });
});

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import và chạy Kafka Consumer
const { runKafkaConsumer } = require('./kafkaConsumer');
runKafkaConsumer();

server.listen(PORT, () => {
  console.log(`Audit Service is running on port ${PORT}`);
});
