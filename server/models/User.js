const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password should be at least 6 characters']
    },
    role: {
        type: String,
        default: 'Developer',
        enum: ['Developer', 'Designer', 'PM', 'Tech Lead', 'Creator']
    },
    // Game Theory Credit System
    credits: {
        type: Number,
        default: 0,
        index: true
    },
    creditStars: {
        type: Number,
        default: 0
    },
    starTier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Neon'],
        default: 'Bronze'
    },
    creditBreakdown: {
        projects: { type: Number, default: 0 },
        collaborations: { type: Number, default: 0 },
        impact: { type: Number, default: 0 },
        loyalty: { type: Number, default: 0 }
    },
    avatar: {
        type: String,
        default: ''
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
