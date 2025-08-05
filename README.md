# SnapConnect

> A RAG-Enhanced Social App for Woodworking Enthusiasts – Combining ephemeral messaging with AI-powered content discovery

## 📱 Overview

SnapConnect is a social media application designed specifically for the woodworking community. It combines the ephemeral messaging features of Snapchat with specialized tools and content discovery for woodworking enthusiasts. The app features disappearing messages, stories, AR filters for wood projects, and AI-powered content recommendations.

## Demo Screenshots

[Login page](demo-pics/Login_page.PNG)  
[Snaps DM received](demo-pics/Snaps_DM_received.PNG)  
[Text chat threads](demo-pics/Text_chat_threads.PNG)  
[Friends tab](demo-pics/Friends_tab.PNG)  
[Friends bio](demo-pics/Friends_bio.PNG)  
[Camera tab](demo-pics/Camera_tab.PNG)  
[Stories tab](demo-pics/Stories_tab.PNG)  
[Profile tab](demo-pics/Profile_tab.PNG)

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
   - Copy `env.example` to `.env`:
     ```bash
     cp env.example .env
     ```
   - Edit `.env` and add your Supabase credentials:
     ```env
      EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
      EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
      SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key 
      OPENAI_API_KEY=your_openai_api_key
     ```
   - Also edit the `.env` in the /server directory:
      ```env
      SUPABASE_URL=https://<poject-ref>.supabase.co
      SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key 
      PORT=3333          # optional, defaults to 3333
      ```

## 🏃‍♂️ Running the App

### Development Mode

1. **Start the server**
   ```bash
   cd server
   bun run dev
   ```

2. **Start the client in another terminal**
   ```bash
   bun run start
   ```


### Testing on Mobile

1. After running the start command, you'll see a QR code in the terminal
2. Open the **Expo Go** app on your mobile device
3. Scan the QR code to load the app



## 📁 Project Structure

```
SnapConnect/
├── app/
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── index.tsx
│   ├── modal.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── camera.tsx
│   │   ├── stories.tsx
│   │   └── profile.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── welcome.tsx
│   ├── camera/
│   │   └── editor.tsx
│   ├── chat/
│   │   └── [id].tsx
│   ├── friends/
│   │   ├── add.tsx
│   │   ├── remove.tsx
│   │   └── scan.tsx
│   ├── profile/
│   │   └── shoptag.tsx
│   ├── snaps/
│   │   └── [id].tsx
│   └── story/
│       ├── [id].tsx
│       └── create.tsx
├── components/
│   ├── ui/
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   └── StoryRing.tsx
│   ├── camera/
│   │   ├── CameraControls.tsx
│   │   ├── FilterSelector.tsx
│   │   └── RecordingProgressRing.tsx
│   ├── chat/
│   │   └── ChatListItem.tsx
│   ├── friend/
│   │   ├── FriendListItem.tsx
│   │   └── FriendProfileModal.tsx
│   ├── snap/
│   │   └── SnapListItem.tsx
│   ├── snap-editor/
│   │   └── OverlayItem.tsx
│   └── story/
│       ├── StoryCard.tsx
│       └── StoryThumbnail.tsx
├── constants/
│   ├── colors.ts
│   ├── mockData.ts
│   └── socket.ts
├── store/
│   ├── authStore.ts
│   ├── chatStore.ts
│   ├── friendStore.ts
│   ├── snapStore.ts
│   └── storyStore.ts
├── types/
│   └── index.ts
├── utils/
│   ├── debug.ts
│   ├── fixFriendships.ts
│   ├── socket.ts
│   ├── supabase.ts
│   ├── sync.ts
│   ├── timeUtils.ts
│   └── upload.ts
├── supabase/
│   ├── edge-functions/
│   │   ├── generate_preference_embedding/
│   │   ├── generate_story_embedding/
│   │   └── purge_expired_content/
│   │       └── index.ts
│   ├── migrations/
│   │   ├── 0001_create_snaps_stories_tables.sql
│   │   ├── 0002_rls_snaps_stories.sql
│   │   ├── 0003_storage_rls_policies.sql
│   │   ├── 0004_add_profile_preferences.sql
│   │   ├── 0005_add_story_title_description.sql
│   │   └── 0006_create_friends_table.sql
│   └── supabase-schema.json
├── assets/
│   └── images/
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── icon.png
│       └── splash-icon.png
├── server/
│   ├── index.js
│   └── package.json
├── scripts/
├── app.config.js
├── babel.config.js
├── bun.lock
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 Design System

### Profile Picture Upload

The profile picture upload feature supports:
- Taking photos with camera
- Selecting from gallery
- Automatic image compression
- Square aspect ratio with editing
- 5MB file size limit

### Troubleshooting Profile Upload

If profile picture upload is not working:

1. **Check Permissions**: Ensure the app has camera and photo library permissions
2. **Verify Supabase Config**: Confirm your environment variables are set correctly
3. **Storage Bucket**: Verify the `user-content` bucket exists and is public
4. **CORS Settings**: Ensure CORS is properly configured for web platform
5. **File Size**: Images must be under 5MB

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Development


### Key Technologies
- React Native with Expo
- TypeScript
- Expo Router for navigation
- Zustand for state management
- Supabase for backend
- Expo Image Picker for photos
- NativeWind for styling

