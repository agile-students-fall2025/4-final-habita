const mongoose = require('mongoose');

const householdSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteCode: {
    type: String,
    sparse: true
  },
  inviteCodeExpires: {
    type: Date
  }
}, {
  timestamps: true
});

householdSchema.index({ inviteCode: 1 });

householdSchema.methods.generateInviteCode = function() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  this.inviteCode = code;
  // Code expires in 7 days
  this.inviteCodeExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return code;
};

householdSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.userId.toString() === userId.toString());
};

householdSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => member.userId.toString() === userId.toString());
  return member && member.role === 'admin';
};

const Household = mongoose.model('Household', householdSchema);

module.exports = Household;
