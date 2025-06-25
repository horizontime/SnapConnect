# SnapConnect

> A RAG-Enhanced Social App for Woodworking Enthusiasts – Combining ephemeral messaging with AI-powered content discovery

<div align="center">
  <img src="assets/images/icon.png" alt="SnapConnect Logo" width="120" height="120" />
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.79.4-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-53.0.12-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
</div>

## 📱 Overview

SnapConnect is a social media application designed specifically for the woodworking community. It combines the ephemeral messaging features of Snapchat with specialized tools and content discovery for woodworking enthusiasts. The app features disappearing messages, stories, AR filters for wood projects, and AI-powered content recommendations.

## ✨ Features

### Core Features
- **📸 Ephemeral Messaging**: Send photos and videos that disappear after viewing
- **⏱️ Custom Timers**: Set custom expiration times for messages (1-10 seconds)
- **📖 Stories**: Share 24-hour visible content with your woodworking community
- **🎭 AR Filters**: Apply woodworking-themed filters and effects to your photos
- **👥 Friend Management**: Connect with other woodworkers through usernames or QR codes
- **🏷️ ShopTags**: Scan QR codes to quickly follow creators and access their content
- **💬 Real-time Chat**: Instant messaging with typing indicators and read receipts

### Woodworking-Specific Features
- **🪵 Project Showcases**: Share your woodworking projects with time-limited visibility
- **🛠️ Tool Tips**: Quick video messages demonstrating techniques
- **📚 Community Content**: Discover trending projects and techniques
- **🤖 AI Integration** (Phase 2): RAG-powered content recommendations and project assistance

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with persistence
- **Styling**: React Native StyleSheet
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Media**: Expo Camera, Expo Image, Expo Video
- **Package Manager**: Bun

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Bun** package manager ([Installation guide](https://bun.sh/docs/installation))
- **Expo Go** app on your mobile device for testing
- **Git** for version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/snapconnect.git
   cd snapconnect
   ```

2. **Install dependencies using Bun**
   ```bash
   bun install
   ```

3. **Set up environment variables** (when connecting to Supabase)
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

## 🏃‍♂️ Running the App

### Development Mode

1. **Start the development server with tunnel**
   ```bash
   bun run start
   ```

2. **For web development**
   ```bash
   bun run start-web
   ```

3. **For web development with debug logs**
   ```bash
   bun run start-web-dev
   ```

### Testing on Mobile

1. After running the start command, you'll see a QR code in the terminal
2. Open the **Expo Go** app on your mobile device
3. Scan the QR code to load the app

### Testing on Web

1. Run `bun run start-web`
2. Press `w` in the terminal or navigate to the URL shown
3. The app will open in your default web browser

## 📁 Project Structure

```
SnapConnect/
├── app/                    # Expo Router screens and navigation
│   ├── _layout.tsx        # Root layout with navigation setup
│   ├── index.tsx          # Entry point with auth redirect
│   ├── modal.tsx          # Modal screen template
│   ├── +not-found.tsx     # 404 error page
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── _layout.tsx    # Tab navigator configuration
│   │   ├── index.tsx      # Chat list (default tab)
│   │   ├── camera.tsx     # Camera screen
│   │   ├── stories.tsx    # Stories feed
│   │   └── profile.tsx    # User profile
│   ├── auth/              # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── signup.tsx     # Sign up screen
│   ├── chat/              # Chat-related screens
│   │   └── [id].tsx       # Individual chat screen
│   ├── friends/           # Friend management screens
│   │   ├── add.tsx        # Add friends screen
│   │   └── scan.tsx       # QR code scanner
│   ├── profile/           # Profile-related screens
│   │   └── shoptag.tsx    # ShopTag QR code display
│   └── story/             # Story viewer
│       └── [id].tsx       # Individual story viewer
├── assets/                # Static assets
│   └── images/           # App images
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── icon.png
│       └── splash-icon.png
├── components/            # Reusable React components
│   ├── ui/               # Generic UI components
│   │   ├── Avatar.tsx    # User avatar component
│   │   ├── Button.tsx    # Reusable button component
│   │   └── StoryRing.tsx # Story status ring
│   ├── chat/             # Chat-specific components
│   │   └── ChatListItem.tsx
│   ├── camera/           # Camera-related components
│   │   ├── CameraControls.tsx
│   │   └── FilterSelector.tsx
│   ├── friend/           # Friend-related components
│   │   └── FriendListItem.tsx
│   └── story/            # Story-specific components
│       └── StoryThumbnail.tsx
├── constants/            # App constants and configuration
│   ├── colors.ts         # Color palette
│   └── mockData.ts       # Development mock data
├── store/                # Zustand state management
│   ├── authStore.ts      # Authentication state
│   ├── chatStore.ts      # Chat and messages state
│   ├── friendStore.ts    # Friends and contacts state
│   └── storyStore.ts     # Stories state
├── types/                # TypeScript type definitions
│   └── index.ts          # Centralized type exports
├── utils/                # Utility functions
│   ├── supabase.ts       # Supabase client configuration
│   └── timeUtils.ts      # Time formatting utilities
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── bun.lock              # Bun lockfile
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentationsteps
```

## 🎨 Design System

### Color Palette
- **Primary**: `#8B5A2B` (Warm Brown) - Represents wood and craftsmanship
- **Secondary**: `#7D8C75` (Sage Green) - Natural, earthy feel
- **Background**: `#F8F7F4` (Warm Off-White) - Premium, crafted appearance
- **Text**: `#333333` (Dark Gray) - High readability

### Typography
- Clean, modern sans-serif fonts
- Clear hierarchy with consistent sizing
- Optimized for mobile readability

## 🧪 Development

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Component-based architecture
- Functional components with hooks

### State Management
- Zustand stores for different domains
- Persistent auth state with AsyncStorage
- Mock data integration for rapid development


## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Supabase for backend infrastructure
- The React Native community
- All contributors and testers

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

<div align="center">
  Made with ❤️ for the woodworking community
</div> 