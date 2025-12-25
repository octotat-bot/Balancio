const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * AUTH CONTROLLER
 * Handles user registration and login
 */

/**
 * Register a new user
 * POST /auth/register
 */
async function register(req, res) {
    try {
        const { name, email, phone, password } = req.body;

        // Validation
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, phone, and password'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const cleanPhone = phone.trim();

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if phone already exists within REGISTERED users
        const existingPhone = await User.findOne({ phone: cleanPhone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        // Create user
        const user = new User({
            name,
            email: email.toLowerCase(),
            phone: cleanPhone,
            passwordHash: password
        });

        await user.save();

        // --- MIGRATION LOGIC: Guest -> Registered User ---
        const GuestMember = require('../models/GuestMember');
        const GroupMember = require('../models/GroupMember');
        const ExpenseSplit = require('../models/ExpenseSplit');

        // Find all guest records for this phone number
        const guestRecords = await GuestMember.find({ phone: cleanPhone });

        let migratedCount = 0;

        for (const guest of guestRecords) {
            // 1. Check if user is already in this group (shouldn't happen, but safety)
            const exists = await GroupMember.findOne({
                groupId: guest.groupId,
                userId: user._id
            });

            if (!exists) {
                // 2. Add as registered member
                await GroupMember.create({
                    groupId: guest.groupId,
                    userId: user._id,
                    joinedAt: guest.joinedAt // Preserve join date
                });

                // 3. Migrate all expenses from guestId to userId
                await ExpenseSplit.updateMany(
                    { guestId: guest._id },
                    {
                        $set: { userId: user._id },
                        $unset: { guestId: "" }
                    }
                );

                // 4. Delete the guest record
                await GuestMember.findByIdAndDelete(guest._id);

                migratedCount++;
            }
        }

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(201).json({
            success: true,
            message: migratedCount > 0
                ? `Registration successful! You've been linked to ${migratedCount} existing group(s).`
                : 'Registration successful',
            data: {
                token,
                user: user.toJSON(),
                migratedGroups: migratedCount
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
}

/**
 * Login user
 * POST /auth/login
 * Accepts either email or phone number
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email/phone and password'
            });
        }

        // Find user by email or phone
        // Check if input looks like a phone number (starts with + or is all digits)
        const isPhone = /^[\+\d]/.test(email);

        let user;
        if (isPhone) {
            user = await User.findOne({ phone: email.trim() });
        } else {
            user = await User.findOne({ email: email.toLowerCase() });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id.toString());

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
}

/**
 * Get current user
 * GET /auth/me
 */
async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user: user.toJSON() }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
}

module.exports = {
    register,
    login,
    getCurrentUser
};
