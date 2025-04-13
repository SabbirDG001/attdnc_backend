const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    attdnc: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    className: {
        type: String,
        required: false
    },
    session: {
        type: String,
        required: false
    },
    students: [{
        studentId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        status: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
});

// Modify the index to be more flexible
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);