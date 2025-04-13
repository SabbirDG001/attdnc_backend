const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const apiRoutes = require('./routes/api');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/attendance', {});
    console.log('MongoDB connected successfully');
    
    // Check if we need to initialize session data
    await checkAndInitializeSessions();
    
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Initialize sessions from JSON files if needed
async function checkAndInitializeSessions() {
  try {
    const Session = require('./models/session');
    const sessionCount = await Session.countDocuments();
    
    if (sessionCount === 0) {
      console.log('No sessions found. Initializing from JSON files...');
      
      // Read JSON files from the data directory
      const dataDir = path.join(__dirname, 'data');
      
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
        console.log('Created data directory');
      }
      
      // Check for attendance JSON files
      const jsonFiles = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log('No JSON files found in data directory. Creating empty sessions...');
        
        // Create default sessions
        const defaultSessions = [
          '2020-2021',
          '2021-2022',
          '2022-2023',
          '2023-2024',
          '2024-2025',
          '2025-2026'
        ];
        
        for (const sessionName of defaultSessions) {
          const newSession = new Session({
            name: sessionName,
            data: [],
            students: []
          });
          
          await newSession.save();
          console.log(`Created empty session: ${sessionName}`);
        }
      } else {
        // Process each JSON file to create sessions
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(dataDir, file);
            const fileData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileData);
            
            // Extract session name from filename or use the name in the JSON
            const sessionName = file.replace('.json', '');
            
            // Check if this session already exists
            const existingSession = await Session.findOne({ name: sessionName });
            
            if (!existingSession) {
              // Create a new session with the data from JSON
              const newSession = new Session({
                name: sessionName,
                data: [],
                students: jsonData[0].students // Assuming students are in the first object
              });
              
              await newSession.save();
              console.log(`Created session from JSON: ${sessionName}`);
            }
          } catch (err) {
            console.error(`Error processing file ${file}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error initializing sessions:', err);
  }
}

// Start server
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});