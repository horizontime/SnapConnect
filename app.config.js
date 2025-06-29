import 'dotenv/config';

export default {
  expo: {
    name: "SnapConnect: RAG-Enhanced Social App for Woodworking Enthusiasts",
    slug: "snapconnect-rag-enhanced-social-app-for-woodworking-enthusiasts",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.random.woodworkingapp",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to take photos and videos to share with friends.",
        NSMicrophoneUsageDescription: "This app uses the microphone to record audio for videos.",
        NSPhotoLibraryUsageDescription: "This app saves photos and videos to your photo library."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.random.woodworkingapp",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to take photos and videos.",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone to record audio for videos.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos and videos.",
          isAccessMediaLocationEnabled: true
        }
      ],
      "expo-video"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://dqytpwkrdjibqunucigc.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeXRwd2tyZGppYnF1bnVjaWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDQ0MjMsImV4cCI6MjA2NjMyMDQyM30.YwIpswXekP1Vi8T753RAEzx7jmtYeOSeeKMCyj_cijU",
      openaiApiKey: process.env.OPENAI_API_KEY || null
    }
  }
}; 