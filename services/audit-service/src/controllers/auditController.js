const AuditLog = require('../models/AuditLog');
const { isKafkaConnected } = require('../kafkaConsumer');

const createLog = async (req, res) => {
  try {
    const { actorId, actorName, action, entityType, entityId, details } = req.body;
    
    const newLog = new AuditLog({
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      details
    });

    await newLog.save();

    // Emit socket event for realtime dashboard notification
    if (req.io) {
      req.io.emit('new_audit_log', newLog);
    }

    res.status(201).json({ message: 'Log created successfully', log: newLog });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { action, actorName, startDate, endDate } = req.query;
    
    let filter = {};
    if (action) {
      filter.action = action;
    }
    if (actorName) {
      filter.actorName = { $regex: actorName, $options: 'i' };
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getDashboardOverview = async (req, res) => {
  try {
    const onlineUsersCount = req.onlineUsers ? req.onlineUsers.size : 0;
    const recentLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(5);

    res.status(200).json({
      onlineUsers: onlineUsersCount,
      recentActivities: recentLogs
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    const socketStatus = req.io ? 'UP' : 'DOWN';
    const kafkaStatus = isKafkaConnected() ? 'UP' : 'DOWN';

    res.status(200).json({
      service: 'Audit Service',
      status: 'UP',
      details: {
        mongodb: mongoStatus,
        socketio: socketStatus,
        kafka: kafkaStatus
      }
    });
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createLog,
  getLogs,
  getDashboardOverview,
  getHealth
};
