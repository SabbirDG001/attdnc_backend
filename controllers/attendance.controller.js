const Attendance = require('../models/attendance.model');

// Create and Save new Attendance
exports.create = async (req, res) => {
    try {
        const { date, className, session, name, students } = req.body;

        const existingAttendance = await Attendance.findOne({
            date: new Date(date)
        });

        if (existingAttendance) {
            existingAttendance.students = students;
            if (name) existingAttendance.name = name;
            if (className) existingAttendance.className = className;
            if (session) existingAttendance.session = session;
            
            const updatedAttendance = await existingAttendance.save();
            res.json({ 
                message: "Attendance updated successfully",
                data: updatedAttendance 
            });
        } else {
            const attendance = new Attendance({
                date: new Date(date),
                className,
                session,
                name,
                students
            });
            const savedAttendance = await attendance.save();
            res.status(201).json({ 
                message: "Attendance saved successfully",
                data: savedAttendance 
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error saving attendance",
            error: error.message
        });
    }
};

// Find attendance by date
exports.findByDate = async (req, res) => {
    try {
        const query = {
            date: new Date(req.params.date)
        };
        
        if (req.query.className) query.className = req.query.className;
        if (req.query.session) query.session = req.query.session;

        const attendance = await Attendance.findOne(query);

        if (!attendance) {
            return res.status(404).json({ message: "No attendance found for this date" });
        }

        res.json(attendance);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving attendance",
            error: error.message
        });
    }
};

// Retrieve all attendance records
exports.findAll = async (req, res) => {
    try {
        const { className, session, name } = req.query;
        const query = {};

        if (className) query.className = className;
        if (session) query.session = session;
        if (name) query.name = name;

        const attendance = await Attendance.find(query)
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving attendance records",
            error: error.message
        });
    }
};

// Update attendance
exports.update = async (req, res) => {
    try {
        const { students, name, className, session } = req.body;
        const updateData = {};
        
        if (students) updateData.students = students;
        if (name) updateData.name = name;
        if (className) updateData.className = className;
        if (session) updateData.session = session;
        
        const attendance = await Attendance.findOneAndUpdate(
            { date: new Date(req.params.date) },
            updateData,
            { new: true }
        );

        if (!attendance) {
            return res.status(404).json({ message: "Attendance not found" });
        }

        res.json({ 
            message: "Attendance updated successfully",
            data: attendance 
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating attendance",
            error: error.message
        });
    }
};

// Delete attendance
exports.delete = async (req, res) => {
    try {
        const query = {
            date: new Date(req.params.date)
        };
        
        if (req.query.className) query.className = req.query.className;
        if (req.query.session) query.session = req.query.session;

        const attendance = await Attendance.findOneAndDelete(query);

        if (!attendance) {
            return res.status(404).json({ message: "Attendance not found" });
        }

        res.json({ message: "Attendance deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting attendance",
            error: error.message
        });
    }
};

// Fetch attendance summary for all students
exports.getAttendanceSummary = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find();

        // Aggregate attendance by student and date
        const summary = {};
        attendanceRecords.forEach(record => {
            record.students.forEach(student => {
                if (!summary[student.name]) {
                    summary[student.name] = {
                        studentId: student.studentId,
                        attendanceData: {}
                    };
                }
                summary[student.name].attendanceData[record.date.toISOString().split('T')[0]] = student.status;
            });
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching attendance summary",
            error: error.message
        });
    }
};

// Add status information for UI display
exports.getStatusInfo = (req, res) => {
    const statusInfo = {
        0: { label: "Present", color: "green" },
        3: { label: "Absent", color: "red" }
        // Add other status codes as needed
    };
    
    res.json(statusInfo);
};

// Get attendance stats 
exports.getAttendanceStats = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find();
        
        const stats = {
            totalSessions: attendanceRecords.length,
            studentStats: {},
            overallAttendance: 0,
            absenteeism: 0
        };
        
        let totalEntries = 0;
        let totalPresent = 0;
        
        attendanceRecords.forEach(record => {
            record.students.forEach(student => {
                if (!stats.studentStats[student.studentId]) {
                    stats.studentStats[student.studentId] = {
                        name: student.name,
                        presentCount: 0,
                        absentCount: 0,
                        totalSessions: 0
                    };
                }
                
                stats.studentStats[student.studentId].totalSessions++;
                totalEntries++;
                
                if (student.status === 0) { // Present
                    stats.studentStats[student.studentId].presentCount++;
                    totalPresent++;
                } else if (student.status === 3) { // Absent
                    stats.studentStats[student.studentId].absentCount++;
                }
            });
        });
        
        // Calculate percentages
        Object.keys(stats.studentStats).forEach(studentId => {
            const student = stats.studentStats[studentId];
            student.attendancePercentage = (student.presentCount / student.totalSessions * 100).toFixed(2);
        });
        
        stats.overallAttendance = (totalPresent / totalEntries * 100).toFixed(2);
        stats.absenteeism = (100 - stats.overallAttendance).toFixed(2);
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error calculating attendance statistics",
            error: error.message
        });
    }
};