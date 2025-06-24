import { MessageType } from '@/types';

export const mockUsers = [
  {
    id: '1',
    username: 'woodmaster',
    displayName: 'John Carpenter',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: '2',
    username: 'craftygal',
    displayName: 'Sarah Miller',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
  {
    id: '3',
    username: 'woodturner',
    displayName: 'Mike Turner',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: '4',
    username: 'chiselqueen',
    displayName: 'Emma Johnson',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: '5',
    username: 'sawdust',
    displayName: 'David Wilson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
];

export const mockChats = [
  {
    id: '1',
    userId: '1',
    lastMessage: {
      type: 'text' as MessageType,
      content: 'Check out this new dovetail jig!',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isRead: true,
    },
    unreadCount: 0,
  },
  {
    id: '2',
    userId: '2',
    lastMessage: {
      type: 'image' as MessageType,
      content: 'Sent a Snap',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: false,
    },
    unreadCount: 1,
  },
  {
    id: '3',
    userId: '3',
    lastMessage: {
      type: 'text' as MessageType,
      content: "What finish would you recommend for maple?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isRead: true,
    },
    unreadCount: 0,
  },
  {
    id: '4',
    userId: '4',
    lastMessage: {
      type: 'image' as MessageType,
      content: 'Sent a Snap',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      isRead: true,
    },
    unreadCount: 0,
  },
  {
    id: '5',
    userId: '5',
    lastMessage: {
      type: 'text' as MessageType,
      content: "Thanks for the workshop tips!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      isRead: true,
    },
    unreadCount: 0,
  },
];

export const mockStories = [
  {
    id: '1',
    userId: '1',
    items: [
      {
        id: '101',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1601579112934-17ac2aa86292?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        caption: 'Working on a new walnut table',
      },
    ],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    viewed: false,
  },
  {
    id: '2',
    userId: '2',
    items: [
      {
        id: '201',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        caption: 'New chisels day!',
      },
    ],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    viewed: true,
  },
  {
    id: '3',
    userId: '3',
    items: [
      {
        id: '301',
        type: 'image' as const,
        url: 'https://images.unsplash.com/photo-1566895291281-ea63efd4a1b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        caption: 'Turned this bowl today',
      },
    ],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    viewed: false,
  },
];

export const mockFilters = [
  {
    id: '1',
    name: 'Species Stamp',
    description: 'Identifies wood species in your photo',
    icon: 'tree',
  },
  {
    id: '2',
    name: 'Shop Grid',
    description: '1x1 inch measurement grid for scale',
    icon: 'grid',
  },
  {
    id: '3',
    name: 'Retro Workshop',
    description: 'Warm vintage color grade with dust particles',
    icon: 'camera',
  },
  {
    id: '4',
    name: 'Big-Eyes Carver',
    description: 'Playful facial distortion filter',
    icon: 'eye',
  },
];