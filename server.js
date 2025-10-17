import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory storage (use database in production)
let appointments = [];

// Function declarations for Gemini
const functionDeclarations = [
  {
    name: "scheduleAppointment",
    description: "Schedule a new appointment or meeting",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title or name of the appointment"
        },
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format"
        },
        time: {
          type: "string",
          description: "Time in HH:MM format (24-hour)"
        },
        description: {
          type: "string",
          description: "Additional details about the appointment"
        }
      },
      required: ["title", "date", "time"]
    }
  },
  {
    name: "getAppointments",
    description: "Retrieve appointments for a specific date or all upcoming appointments",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Optional: specific date in YYYY-MM-DD format. If not provided, returns all appointments"
        }
      }
    }
  },
  {
    name: "deleteAppointment",
    description: "Delete an appointment by its ID",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The ID of the appointment to delete"
        }
      },
      required: ["id"]
    }
  }
];

// Function implementations
function scheduleAppointment(title, date, time, description = '') {
  const appointment = {
    id: Date.now(),
    title,
    date,
    time,
    description,
    reminded: false,
    createdAt: new Date().toISOString()
  };
  appointments.push(appointment);
  return JSON.stringify({
    success: true,
    message: `Appointment "${title}" scheduled for ${date} at ${time}`,
    appointment
  });
}

function getAppointments(date = null) {
  let results = appointments;
  
  if (date) {
    results = appointments.filter(apt => apt.date === date);
  }
  
  // Sort by date and time
  results.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });
  
  return JSON.stringify({
    success: true,
    count: results.length,
    appointments: results
  });
}

function deleteAppointment(id) {
  const index = appointments.findIndex(apt => apt.id === id);
  
  if (index !== -1) {
    const deleted = appointments.splice(index, 1)[0];
    return JSON.stringify({
      success: true,
      message: `Deleted appointment: ${deleted.title}`,
      appointment: deleted
    });
  }
  
  return JSON.stringify({
    success: false,
    message: "Appointment not found"
  });
}

// Process function calls
function executeFunction(functionCall) {
  const { name, args } = functionCall;
  
  switch (name) {
    case 'scheduleAppointment':
      return scheduleAppointment(args.title, args.date, args.time, args.description);
    case 'getAppointments':
      return getAppointments(args.date);
    case 'deleteAppointment':
      return deleteAppointment(args.id);
    default:
      return JSON.stringify({ error: 'Unknown function' });
  }
}

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: [{ functionDeclarations }]
    });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful calendar assistant. Help users schedule, view, and manage their appointments. Always be friendly and confirm details. When showing appointments, format them nicely." }]
        },
        {
          role: "model",
          parts: [{ text: "I understand! I'm your calendar assistant. I can help you schedule appointments, view your calendar, and manage your schedule. Just let me know what you need!" }]
        }
      ]
    });
    
    let result = await chat.sendMessage(message);
    let response = result.response;
    
    // Handle function calls
    while (response.functionCalls()) {
      const functionCalls = response.functionCalls();
      const functionResponses = functionCalls.map(fc => ({
        name: fc.name,
        response: JSON.parse(executeFunction(fc))
      }));
      
      result = await chat.sendMessage([{
        functionResponse: functionResponses[0]
      }]);
      response = result.response;
    }
    
    res.json({ 
      response: response.text(),
      appointments: appointments.length
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Something went wrong. Please try again.',
      details: error.message 
    });
  }
});

// Get all appointments endpoint
app.get('/appointments', (req, res) => {
  res.json({ appointments });
});

// Reminder system - checks every minute
cron.schedule('* * * * *', () => {
  const now = new Date();
  
  appointments.forEach(apt => {
    if (!apt.reminded) {
      const aptDateTime = new Date(`${apt.date}T${apt.time}`);
      const timeDiff = aptDateTime - now;
      
      // Remind 15 minutes before (900000 ms = 15 minutes)
      if (timeDiff > 0 && timeDiff <= 900000) {
        console.log(`\n🔔 REMINDER: "${apt.title}" at ${apt.time}`);
        console.log(`   Date: ${apt.date}`);
        if (apt.description) {
          console.log(`   Details: ${apt.description}`);
        }
        console.log('');
        
        apt.reminded = true;
        
        // Here you would send email/SMS/push notification
        // For now, it just logs to console
      }
    }
  });
});

// Serve HTML interface
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Calendar Assistant running on http://localhost:${PORT}`);
  console.log(`📅 Total appointments: ${appointments.length}`);
  console.log(`🔔 Reminder system active (checks every minute)\n`);
});