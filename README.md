# Time To Focus Tracker

A comprehensive productivity tracking application that helps you monitor your focus sessions, analyze tab switching behavior, and gain insights into your work patterns. Built as a Progressive Web Application (PWA) with Chrome Extension integration for enhanced tab tracking capabilities.

**Note**: 
- **Chrome Extension**: Currently pending Chrome Web Store review. The extension will provide enhanced tracking capabilities once approved.
- **Cloud Integration**: Server-side features for data backup and synchronization are currently in development.
- **Current Status**: The application operates in offline-first mode with local data storage and basic tracking capabilities.

## 🚀 Features

### Core Functionality
- **Focus Session Management**: Start, track, and end focused work sessions
- **Real-time Tab Tracking**: Monitor tab switches and domain visits during sessions
- **Detailed Analytics**: Comprehensive insights with interactive charts and visualizations
- **Session History**: View and analyze past focus sessions
- **Domain Management**: Configure focus domains vs. distraction domains
- **Dark/Light Theme**: Toggle between light and dark modes

### Analytics & Insights
- **Focus vs. Distraction Time**: Pie chart showing time distribution
- **Domain Activity Timeline**: Gantt-style timeline of domain visits
- **Tab Switch Analysis**: Bar charts showing different types of tab switches
- **Domain Distribution**: Visual breakdown of time spent on different domains
- **Performance Metrics**: Focus percentage, total tab switches, session duration

### Progressive Web App Features
- **Offline Support**: Works without internet connection
- **Install on Device**: Can be installed as a native-like app
- **Responsive Design**: Optimized for desktop and mobile devices
- **Service Worker**: Background sync and caching capabilities

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 17 with SSR (Server-Side Rendering)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with SCSS
- **UI Components**: Angular CDK (Component Dev Kit)
- **State Management**: RxJS with BehaviorSubjects
- **Charts**: Chart.js with ng2-charts
- **PWA**: Angular Service Worker

### Data Storage
- **Client-side Database**: IndexedDB with Dexie.js
- **Browser Storage**: LocalStorage for preferences
- **Data Persistence**: Offline-first architecture

### Browser Extension
- **Manifest Version**: 3 (MV3)
- **Architecture**: Content Script + Background Service Worker
- **Permissions**: Tabs, Active Tab, Scripting, Storage, Alarms
- **Communication**: Message passing between extension and PWA

### Development Tools
- **Build System**: Angular CLI
- **Package Manager**: npm
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Testing**: Jasmine and Karma

### Server (Cloud Integration - In Progress)
- **Runtime**: Node.js with Express
- **Purpose**: Future cloud backup and synchronization features
- **Status**: Currently in development for data backup and cross-device sync

## 📁 Project Structure

```
time-to-focus-tracker/
├── client/                          # Angular PWA Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── models/              # TypeScript interfaces and enums
│   │   │   │   ├── focus-domain.model.ts
│   │   │   │   ├── focus-session.model.ts
│   │   │   │   └── tab-event.model.ts
│   │   │   ├── pages/               # Feature pages
│   │   │   │   ├── home/            # Main session control
│   │   │   │   ├── history/         # Session history view
│   │   │   │   └── insight/         # Analytics dashboard
│   │   │   ├── services/            # Core business logic
│   │   │   │   ├── db.service.ts    # IndexedDB operations
│   │   │   │   ├── focus-session.service.ts
│   │   │   │   ├── tab-tracking.service.ts
│   │   │   │   └── focus-domains.service.ts
│   │   │   ├── shared/              # Reusable components
│   │   │   │   └── dark-mode-toggle/
│   │   │   ├── app.component.*      # Root component
│   │   │   └── app.routes.ts        # Application routing
│   │   ├── assets/                  # Static assets
│   │   ├── environments/            # Environment configs
│   │   ├── index.html              # Main HTML template
│   │   ├── main.ts                 # Client-side bootstrap
│   │   ├── main.server.ts          # SSR bootstrap
│   │   ├── manifest.webmanifest    # PWA manifest
│   │   └── styles.scss             # Global styles
│   ├── angular.json                # Angular CLI configuration
│   ├── package.json               # Dependencies and scripts
│   ├── server.ts                  # SSR server configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   └── tsconfig.json              # TypeScript configuration
├── extension/                      # Chrome Extension
│   ├── background.js              # Service worker script
│   ├── content.js                 # Content script for page interaction
│   └── manifest.json              # Extension manifest
├── server/                        # Backend Server (In Progress)
│   ├── index.js                   # Express server
│   ├── package.json               # Server dependencies
│   └── tsconfig.json              # Server TypeScript config
└── LICENSE                        # MIT License
```

## 🔌 Chrome Extension Integration

The Time To Focus Tracker includes a Chrome extension that enables advanced tab tracking capabilities. The extension seamlessly integrates with the PWA to provide real-time productivity insights.

### Extension Status
🔄 **Currently Under Review**: The Chrome extension is pending review by the Chrome Web Store team. Once approved, it will be available for public installation.

### Extension Architecture
- **Background Script**: Monitors tab switches and window focus changes using Chrome's Tabs API
- **Content Script**: Facilitates bidirectional communication between the extension and PWA
- **Message Passing**: Real-time event communication for instant tracking updates
- **Service Worker**: Efficient background processing with MV3 compliance

### Tracked Events
- **Tab Activation**: Switching between different browser tabs
- **Window Focus Changes**: Moving focus between different browser windows
- **Domain Transitions**: Navigation between different websites within tabs
- **Session Events**: Start and stop tracking events coordinated with PWA

### Key Features
- **Real-time Tracking**: Instant detection of tab switches and domain changes
- **Smart Categorization**: Automatic classification of domains as focused vs. distracted
- **Privacy Protection**: Zero data transmission to external servers
- **Performance Optimized**: Minimal resource usage with intelligent event handling
- **Session Coordination**: Seamless integration with PWA session management

### Privacy & Security
- **Local Data Only**: All tracking data remains on the user's device
- **Session-Based Activation**: Extension only monitors activity during active focus sessions
- **Minimal Permissions**: Uses only essential Chrome permissions for core functionality
- **No External Communication**: Extension operates entirely offline
- **User Control**: Users can start/stop tracking at any time

### Installation (When Available)
Once approved by Chrome Web Store, users will be able to:
1. Install the extension directly from the Chrome Web Store
2. The PWA will automatically detect the extension presence
3. Full tracking capabilities will be enabled seamlessly

### Current Limitations
While the extension is under review, users can still use the PWA with basic tracking capabilities that don't require extension permissions.

## 🎯 How It Works

1. **Setup Focus Domains**: Configure which domains count as "focused work"
2. **Install Extension**: Install the Chrome extension (when available) for enhanced tracking
3. **Start Session**: Begin a focus session with a task name and selected domains
4. **Work & Track**: The extension monitors your tab activity in real-time
5. **End Session**: Complete the session to save comprehensive analytics
6. **Review Insights**: Analyze your productivity patterns with detailed interactive charts

## 🌟 Key Benefits

- **Productivity Awareness**: Understand your distraction patterns and focus habits
- **Data-Driven Insights**: Make informed decisions about work environments and habits
- **Privacy-First**: All data stays on your device - no cloud storage or external transmission
- **Offline Capable**: Full functionality without internet connection
- **Cross-Platform**: Responsive design works on desktop, tablet, and mobile devices
- **Non-Intrusive**: Only tracks when sessions are active, respects user privacy

## 🔄 Future Enhancements

- **Cloud Synchronization**: Backup and sync data across devices (server development in progress)
- **Advanced Analytics**: Machine learning insights for productivity patterns
- **Goal Setting**: Set and track daily/weekly focus time goals
- **Team Features**: Share productivity insights with team members (optional)
- **Mobile Extensions**: Native mobile app with similar tracking capabilities
- **Third-party Integrations**: Connect with calendar, project management, and time tracking tools
- **Productivity Recommendations**: AI-powered suggestions for improving focus

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Chrome browser (for extension functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/time-to-focus-tracker.git
   cd time-to-focus-tracker
   ```

2. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:4200`

### Building for Production

```bash
# Build the PWA
npm run build

# Build with SSR
npm run build:ssr

# Serve SSR build locally
npm run serve:ssr
```

### Chrome Extension Setup (Development)

1. **Load extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

2. **Test integration**
   - Open the PWA in Chrome
   - The extension should automatically connect
   - Start a focus session to test tracking

## 📊 Analytics Dashboard

The application provides comprehensive analytics through interactive charts:

### Chart Types
- **Pie Charts**: Focus vs. distraction time distribution
- **Timeline Charts**: Domain activity over time (Gantt-style)
- **Bar Charts**: Tab switch frequency analysis
- **Distribution Charts**: Time spent per domain breakdown

### Metrics Tracked
- Total session duration
- Focus time percentage
- Tab switch frequency
- Domain transition patterns
- Productivity trends over time

## 🔒 Privacy & Data

### Data Storage
- **Local Only**: All data stored in browser's IndexedDB
- **No Cloud Storage**: No data sent to external servers by default
- **User Control**: Complete control over data retention and deletion

### Extension Permissions
- **tabs**: Monitor active tabs for tracking
- **activeTab**: Access current tab information
- **scripting**: Inject content scripts for communication
- **storage**: Store extension preferences locally
- **alarms**: Maintain service worker lifecycle

### Test Structure
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: Service interaction testing
- **E2E Tests**: Full user workflow testing

## 🛠️ Development

### Architecture Overview
- **Frontend**: Angular 17 with standalone components
- **State Management**: RxJS BehaviorSubjects for reactive state
- **Data Layer**: IndexedDB with Dexie.js for offline storage
- **Extension**: Chrome MV3 with background service worker

### Key Services
- **FocusSessionService**: Manages focus session lifecycle
- **TabTrackingService**: Handles tab monitoring and event processing
- **DbService**: IndexedDB operations and data persistence
- **FocusDomainsService**: Domain configuration management

### Development Guidelines
- Follow Angular style guide
- Use TypeScript strict mode
- Implement responsive design patterns
- Maintain offline-first approach
- Ensure privacy by design

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Areas where contributions are especially appreciated:

- UI/UX improvements
- Additional analytics features
- Performance optimizations
- Mobile responsiveness enhancements
- Documentation improvements

### Contribution Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📧 Contact & Support

For questions, suggestions, or support, please:
- Open an issue on GitHub
- Contact the maintainers through the repository
- Check the documentation for common questions

**Last Updated**: August 2025"""