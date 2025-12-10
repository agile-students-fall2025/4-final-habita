const express = require('express');
const router = express.Router();
const passport = require('passport');
const Household = require('../models/Household');
const User = require('../models/User');

const auth = passport.authenticate('jwt', { session: false });


router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Household name is required' });
    }

    if (req.user.householdId) {
      return res.status(400).json({ error: 'You already belong to a household' });
    }

    const household = new Household({
      name: name.trim(),
      createdBy: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'admin'
      }]
    });

    household.generateInviteCode();
    await household.save();

    req.user.householdId = household._id;
    await req.user.save();

    res.status(201).json({
      success: true,
      data: {
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode,
        inviteCodeExpires: household.inviteCodeExpires,
        members: household.members
      }
    });
  } catch (err) {
    console.error('Error creating household:', err);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

router.get('/my-household', auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      // Instead of 404, return empty data
      return res.json({
        success: true,
        data: null  // or { household: null }
      });
    }

    const household = await Household.findById(req.user.householdId)
      .populate('members.userId', 'username displayName');

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({
      success: true,
      data: {
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode,
        inviteCodeExpires: household.inviteCodeExpires,
        members: household.members,
        isAdmin: household.isAdmin(req.user._id)
      }
    });
  } catch (err) {
    console.error('Error fetching household:', err);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Join household via invite code
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Check if user already belongs to a household
    if (req.user.householdId) {
      return res.status(400).json({ error: 'You already belong to a household' });
    }

    // Find household with valid invite code
    const household = await Household.findOne({
      inviteCode: inviteCode.toUpperCase(),
      inviteCodeExpires: { $gt: new Date() }
    });

    if (!household) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    // Add user to household
    household.members.push({
      userId: req.user._id,
      role: 'member'
    });
    await household.save();

    // Update user with householdId
    req.user.householdId = household._id;
    await req.user.save();

    res.json({
      success: true,
      data: {
        id: household._id,
        name: household.name,
        members: household.members
      }
    });
  } catch (err) {
    console.error('Error joining household:', err);
    res.status(500).json({ error: 'Failed to join household' });
  }
});
router.post('/:id/regenerate-code', auth, async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    if (!household.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Only admins can regenerate invite codes' });
    }

    household.generateInviteCode();
    await household.save();

    res.json({
      success: true,
      data: {
        inviteCode: household.inviteCode,
        inviteCodeExpires: household.inviteCodeExpires
      }
    });
  } catch (err) {
    console.error('Error regenerating invite code:', err);
    res.status(500).json({ error: 'Failed to regenerate invite code' });
  }
});


router.post('/leave', auth, async (req, res) => {
  try {
    if (!req.user.householdId) {
      return res.status(400).json({ error: 'You are not part of any household' });
    }

    const household = await Household.findById(req.user.householdId);

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    household.members = household.members.filter(
      member => member.userId.toString() !== req.user._id.toString()
    );

    if (household.members.length === 0) {
      await Household.findByIdAndDelete(household._id);
    } else {
      await household.save();
    }
    req.user.householdId = null;
    await req.user.save();

    res.json({
      success: true,
      message: 'Successfully left household'
    });
  } catch (err) {
    console.error('Error leaving household:', err);
    res.status(500).json({ error: 'Failed to leave household' });
  }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    if (!household.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Use the leave endpoint to leave the household' });
    }

    household.members = household.members.filter(
      member => member.userId.toString() !== req.params.userId
    );
    await household.save();

    await User.findByIdAndUpdate(req.params.userId, { householdId: null });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
