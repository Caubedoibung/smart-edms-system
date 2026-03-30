const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: Number, required: false },
  actorName: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true }, // DOCUMENT, CATEGORY, USER
  entityId: { type: Number, required: true },
  details: { type: mongoose.Schema.Types.Mixed }, // Schema-less field for flexibility
  timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
