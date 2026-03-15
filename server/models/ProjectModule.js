const mongoose = require('mongoose');

const ProjectModuleSchema = new mongoose.Schema({
    moduleName: {
        type: String,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }]
});

module.exports = mongoose.model('ProjectModule', ProjectModuleSchema);
