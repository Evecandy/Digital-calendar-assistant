import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';
import { MongoClient } from 'mongodb';
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

// Initialize MongoDB
const mongoClient = new MongoClient(process.env.MONGODB_URI);
let db;
let appointmentsCollection;
let usersCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db('calendar-assistant');
    appointmentsCollection = db.collection('appointments');
    usersCollection = db.collection('users');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
    description: "Retrieve appointments. Always show the ID, title, date and time for each appointment.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Optional: specific date in YYYY-MM-DD format"
        }
      }
    }
  },
  {
    name: "deleteAppointment",
    description: "Delete an appointment by its title or ID",
    parameters: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "The appointment title or ID to delete"
        }
      },
      required: ["identifier"]
    }
  }
];

// Get user tokens from database
async function getUserTokens(userId) {
  const user = await usersCollection.findOne({ userId });
  return user?.tokens || null;
}

// Save user tokens to database
async function saveUserTokens(userId, tokens) {
  await usersCollection.updateOne(
    { userId },
    { $set: { userId, tokens, updatedAt: new Date() } },
    { upsert: true }
  );
}

// Schedule appointment in Google Calendar
async function scheduleToGoogleCalendar(userId, title, date, time, description) {
  try {
    const tokens = await getUserTokens(userId);
    if (!tokens) {
      return { success: false, message: "Not authenticated with Google Calendar" };
    }

    oauth2Client.setCredentials(tokens);

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Africa/Nairobi',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Africa/Nairobi',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return {
      success: true,
      googleEventId: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Google Calendar error:', error);
    return { success: false, message: error.message };
  }
}

// Function implementations with MongoDB
async function scheduleAppointment(userId, title, date, time, description = '') {
  const appointment = {
    userId,
    title,
    date,
    time,
    description,
    reminded: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Add to Google Calendar
  const gcalResult = await scheduleToGoogleCalendar(userId, title, date, time, description);
  
  if (gcalResult.success) {
    appointment.googleEventId = gcalResult.googleEventId;
    appointment.googleCalendarLink = gcalResult.htmlLink;
  }

  // Save to MongoDB
  const result = await appointmentsCollection.insertOne(appointment);
  appointment._id = result.insertedId;
  
  return JSON.stringify({
    success: true,
    message: gcalResult.success 
      ? `✅ Appointment "${title}" scheduled for ${date} at ${time} and added to Google Calendar!`
      : `✅ Appointment "${title}" scheduled for ${date} at ${time} (local only - connect Google Calendar to sync)`,
    appointment: {
      id: appointment._id.toString(),
      title: appointment.title,
      date: appointment.date,
      time: appointment.time
    },
    googleCalendarLink: gcalResult.htmlLink
  });
}

async function getAppointments(userId, date = null) {
  const query = { userId };
  
  if (date) {
    query.date = date;
  }
  
  const appointments = await appointmentsCollection
    .find(query)
    .sort({ date: 1, time: 1 })
    .toArray();
  
  return JSON.stringify({
    success: true,
    count: appointments.length,
    appointments: appointments.map(apt => ({
      id: apt._id.toString(),
      title: apt.title,
      date: apt.date,
      time: apt.time,
      description: apt.description
    }))
  });
}

async function deleteAppointment(userId, identifier) {
  let appointment;
  
  // Try to find by MongoDB _id
  try {
    const { ObjectId } = await import('mongodb');
    appointment = await appointmentsCollection.findOne({
      userId,
      _id: new ObjectId(identifier)
    });
  } catch (e) {
    // Not a valid ObjectId, continue to search by title
  }
  
  // If not found, try by title
  if (!appointment) {
    appointment = await appointmentsCollection.findOne({
      userId,
      title: { $regex: identifier, $options: 'i' }
    });
  }
  
  if (appointment) {
    // Delete from Google Calendar if synced
    if (appointment.googleEventId) {
      try {
        const tokens = await getUserTokens(userId);
        if (tokens) {
          oauth2Client.setCredentials(tokens);
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: appointment.googleEventId,
          });
        }
      } catch (error) {
        console.error('Error deleting from Google Calendar:', error);
      }
    }
    
    // Delete from MongoDB
    await appointmentsCollection.deleteOne({ _id: appointment._id });
    
    return JSON.stringify({
      success: true,
      message: `✅ Deleted appointment: "${appointment.title}" (ID: ${appointment._id.toString()})`,
      appointment: {
        id: appointment._id.toString(),
        title: appointment.title
      }
    });
  }
  
  return JSON.stringify({
    success: false,
    message: `❌ Appointment not found. Please check the list of appointments and use the correct ID or title.`
  });
}

// Process function calls
async function executeFunction(userId, functionCall) {
  const { name, args } = functionCall;
  
  switch (name) {
    case 'scheduleAppointment':
      return await scheduleAppointment(userId, args.title, args.date, args.time, args.description);
    case 'getAppointments':
      return await getAppointments(userId, args.date);
    case 'deleteAppointment':
      return await deleteAppointment(userId, args.identifier);
    default:
      return JSON.stringify({ error: 'Unknown function' });
  }
}

// OAuth routes
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const userId = 'default_user'; // In production, use actual user ID from session
    await saveUserTokens(userId, tokens);
    res.redirect('/?connected=true');
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/?error=auth_failed');
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message, userId = 'default_user' } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: [{ functionDeclarations }]
    });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful calendar assistant. When users ask to delete an appointment, first show them the list with IDs. Always show IDs when listing appointments. Format appointment lists clearly with ID numbers." }]
        },
        {
          role: "model",
          parts: [{ text: "I understand! I'll help manage your calendar and always show appointment IDs when listing them." }]
        }
      ]
    });
    
    let result = await chat.sendMessage(message);
    let response = result.response;
    
    // Handle function calls
    while (response.functionCalls()) {
      const functionCalls = response.functionCalls();
      const functionResponses = await Promise.all(
        functionCalls.map(async (fc) => ({
          name: fc.name,
          response: JSON.parse(await executeFunction(userId, fc))
        }))
      );
      
      result = await chat.sendMessage([{
        functionResponse: functionResponses[0]
      }]);
      response = result.response;
    }
    
    // Get appointment count
    const count = await appointmentsCollection.countDocuments({ userId });
    const hasGoogleAuth = !!(await getUserTokens(userId));
    
    res.json({ 
      response: response.text(),
      appointments: count,
      googleConnected: hasGoogleAuth
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
app.get('/appointments', async (req, res) => {
  const userId = req.query.userId || 'default_user';
  const appointments = await appointmentsCollection
    .find({ userId })
    .sort({ date: 1, time: 1 })
    .toArray();
  
  const hasGoogleAuth = !!(await getUserTokens(userId));
  
  res.json({ 
    appointments: appointments.map(apt => ({
      ...apt,
      id: apt._id.toString()
    })),
    googleConnected: hasGoogleAuth
  });
});

// Reminder system - checks every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  
  // Find appointments that need reminders
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
  const sixteenMinutesFromNow = new Date(now.getTime() + 16 * 60 * 1000);
  
  const appointmentsNeedingReminder = await appointmentsCollection
    .find({
      reminded: false,
      date: now.toISOString().split('T')[0]
    })
    .toArray();
  
  for (const apt of appointmentsNeedingReminder) {
    const aptDateTime = new Date(`${apt.date}T${apt.time}:00`);
    
    // Check if appointment is 15 minutes away
    if (aptDateTime >= fifteenMinutesFromNow && aptDateTime < sixteenMinutesFromNow) {
      console.log(`\n🔔 REMINDER: "${apt.title}" at ${apt.time}`);
      console.log(`   Date: ${apt.date}`);
      if (apt.description) {
        console.log(`   Details: ${apt.description}`);
      }
      console.log('');
      
      // Mark as reminded
      await appointmentsCollection.updateOne(
        { _id: apt._id },
        { $set: { reminded: true } }
      );
      
      // Here you would send email/SMS
    }
  }
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ Calendar Assistant running on http://localhost:${PORT}`);
    console.log(`🔔 Reminder system active\n`);
  });
});