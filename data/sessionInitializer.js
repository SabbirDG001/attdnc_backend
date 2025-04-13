const mongoose = require('mongoose');
const Session = require('./models/session');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/attendance', {})
  .then(() => {
    console.log('MongoDB connected for session initialization');
    initializeSessions();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function initializeSessions() {
  try {
    console.log('Initializing session data...');
    
    // Get list of JSON files in the data directory
    const dataDir = path.join(__dirname, 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
      console.log('Created data directory');
    }
    
    const jsonFiles = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files in data directory`);
    
    // If no JSON files are found, create default empty sessions
    if (jsonFiles.length === 0) {
      console.log('No JSON files found. Creating default empty sessions...');
      
      const defaultSessions = [
        '2020-2021',
        '2021-2022',
        '2022-2023',
        '2023-2024',
        '2024-2025',
        '2025-2026'
      ];
      
      for (const sessionName of defaultSessions) {
        // Check if session already exists
        const existingSession = await Session.findOne({ name: sessionName });
        
        if (!existingSession) {
          const newSession = new Session({
            name: sessionName,
            data: [],
            students: []
          });
          
          await newSession.save();
          console.log(`Created empty session: ${sessionName}`);
        } else {
          console.log(`Session ${sessionName} already exists. Skipping.`);
        }
      }
    } else {
      // Process each JSON file
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(dataDir, file);
          const fileData = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(fileData);
          
          // Extract session name - either from filename or from the data
          let sessionName;
          
          // Try to get name from filename (e.g., "2021-2022.json" -> "2021-2022")
          if (file.includes('-')) {
            sessionName = file.replace('.json', '');
          } else {
            // Try to get name from the JSON data
            sessionName = jsonData[0]?.name || path.basename(file, '.json');
          }
          
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
          } else {
            console.log(`Session ${sessionName} already exists. Skipping.`);
          }
        } catch (fileErr) {
          console.error(`Error processing file ${file}:`, fileErr);
        }
      }
    }
    
    console.log('Session initialization complete!');
    process.exit(0);
    
  } catch (err) {
    console.error('Session initialization error:', err);
    process.exit(1);
  }
}