<img width="1363" height="641" alt="Screenshot from 2025-10-17 21-36-50" src="https://github.com/user-attachments/assets/7b8b64be-0b4e-4e11-8f12-0bd35f1f8859" />
# 📅 Calendar Assistant

An AI-powered digital calendar assistant that intelligently schedules appointments and syncs them with Google Calendar using natural language processing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/cloud/atlas)

![Calendar Assistant Demo](https://via.placeholder.com/800x400?text=Calendar+Assistant+Demo)
 <img width="1351" height="579" alt="Screenshot from 2025-10-21 15-00-33" src="https://github.com/user-attachments/assets/131b6bee-6221-4b39-9655-8b11e492589d" />


## 🌟 Features

- **🤖 AI-Powered Scheduling** - Natural language understanding powered by Google Gemini AI
- **📆 Google Calendar Integration** - Automatic synchronization with your Google Calendar
- **💬 Conversational Interface** - Chat-based interaction for intuitive appointment management
- **👥 Multi-User Support** - Secure OAuth authentication for multiple users
- **💾 Persistent Storage** - MongoDB integration for reliable data persistence
- **🔔 Smart Reminders** - Automated reminders 15 minutes before appointments
- **🌐 Real-time Sync** - Bidirectional sync between app and Google Calendar
- **🔒 Secure Authentication** - Google OAuth 2.0 for secure user authentication

## 🚀 Live Demo

**Live Application:** [https://calendar-assistant.onrender.com](https://digital-calendar-assistant.onrender.com/))

**Demo Account:** Connect with your own Google account to try it out!

## 📸 Screenshots

### Main Interface
![Main Interface](https://via.placeholder.com/600x400?text=Main+Interface)

### Scheduling an Appointment
![Scheduling](https://via.placeholder.com/600x400?text=Scheduling+Appointment)

### Google Calendar Sync
![Google Calendar](https://via.placeholder.com/600x400?text=Google+Calendar+Sync)
<img width="1351" height="646" alt="Screenshot from 2025-10-21 14-59-27" src="https://github.com/user-attachments/assets/86979d18-a22c-4c39-8eb4-a647b297cd02" />



## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with modern CSS

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Google Gemini AI** - Natural language processing
- **MongoDB** - NoSQL database for data persistence
- **Google APIs** - Calendar and OAuth integration

### DevOps
- **Render** - Cloud hosting platform
- **GitHub Actions** - CI/CD (optional)
- **dotenv** - Environment variable management

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (free tier available)
- Google Cloud Platform account
- Git

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Evecandy/Digital-calendar-assistant.git
cd calendar-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google+ API (for user info)
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/oauth2callback`
     - `https://your-domain.com/oauth2callback` (for production)
5. Download credentials or copy Client ID and Client Secret

### 4. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get your connection string

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calendar-assistant?retryWrites=true&w=majority

# Server
PORT=3000
```

### 6. Run the Application

```bash
# Development mode
npm start

# The app will be available at http://localhost:3000
```

## 🎯 Usage

### Scheduling an Appointment

1. Open the application in your browser
2. Click "Connect Google Calendar" and authenticate
3. Type a natural language request:
   - "Schedule dentist appointment tomorrow at 2pm"
   - "Book a team meeting on Friday at 10am"
   - "Add lunch with Sarah next Monday at noon"
4. The AI will parse your request and create the appointment
5. Check your Google Calendar - it's automatically synced!

### Viewing Appointments

- Ask: "What appointments do I have?"
- Or: "Show my appointments for tomorrow"
- Or: "What's on my calendar this week?"

### Deleting Appointments

- Use appointment ID: "Delete appointment 123456789"
- Or use title: "Cancel dentist appointment"

## 🏗️ Project Structure

```
calendar-assistant/
├── server.js              # Main application server
├── package.json           # Node.js dependencies
├── .env                   # Environment variables (not in repo)
├── .gitignore            # Git ignore file
├── LICENSE               # MIT License
├── README.md             # This file
└── public/               # Frontend files
    └── index.html        # Main HTML interface
```

## 🔐 Security Features

- **OAuth 2.0 Authentication** - Secure Google account integration
- **Environment Variables** - Sensitive data stored securely
- **User Isolation** - Each user sees only their own appointments
- **HTTPS Encryption** - Secure data transmission in production
- **No Password Storage** - Leverages Google's authentication

## 🚢 Deployment

### Deploy to Render

1. Push your code to GitHub
2. Connect your GitHub account to [Render](https://render.com)
3. Create a new Web Service
4. Configure environment variables in Render dashboard
5. Deploy!

### Environment Variables for Production

Remember to update `GOOGLE_REDIRECT_URI` to your production URL:
```
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/oauth2callback
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code Quality Standards

This project follows these best practices:

- ✅ Modular code structure
- ✅ Error handling and logging
- ✅ Environment-based configuration
- ✅ RESTful API design
- ✅ Async/await for asynchronous operations
- ✅ Security best practices (OAuth, env variables)
- ✅ Responsive UI design
- ✅ Clean, commented code

## 🐛 Known Issues

- Free tier deployments may experience cold starts (30-60 second delay)
- Reminder system currently logs to console (email/SMS integration planned)

## 🗺️ Roadmap

- [ ] Email/SMS reminder notifications
- [ ] Recurring appointments support
- [ ] Calendar view visualization
- [ ] Multiple calendar support
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Voice input support
- [ ] Calendar analytics dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Eve Candy Mwende Mutunga**
- GitHub: [@yourusername](https://github.com/Evecandy)
- LinkedIn: [Your Name](https://linkedin.com/in/evecandy)
- Email: evecandymutunga@gmail.com

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - Natural language processing
- [Google Calendar API](https://developers.google.com/calendar) - Calendar integration
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Database hosting
- [Render](https://render.com) - Cloud hosting platform
- [Express.js](https://expressjs.com/) - Web framework

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub or contact me directly.
evecandymutunga@gmail.com
---

**⭐ If you found this project helpful, please give it a star!**
