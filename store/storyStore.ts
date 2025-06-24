import { create } from 'zustand';
import { mockStories, mockUsers } from '@/constants/mockData';
import { supabase } from '@/utils/supabase';
import { Story, StoryItem, User } from '@/types';

type StoryState = {
  stories: Story[];
  currentStoryId: string | null;
  currentStoryItemIndex: number;
  setCurrentStory: (storyId: string | null, itemIndex?: number) => void;
  getStoriesWithUserData: () => (Story & { user: User })[];
  addStoryItem: (userId: string, item: Omit<StoryItem, 'id' | 'timestamp'>) => void;
  markStoryAsViewed: (storyId: string) => void;
  getMyStories: (userId: string) => Story[];
  getFriendsStories: (userId: string) => (Story & { user: User })[];
  fetchStories: () => Promise<void>;
};

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: mockStories,
  currentStoryId: null,
  currentStoryItemIndex: 0,
  
  setCurrentStory: (storyId, itemIndex = 0) => 
    set({ currentStoryId: storyId, currentStoryItemIndex: itemIndex }),
  
  getStoriesWithUserData: () => {
    const { stories } = get();
    return stories.map(story => {
      if ((story as any).user) {
        return story as Story & { user: User };
      }
      const user = mockUsers.find(user => user.id === story.userId);
      return { ...story, user: user! } as Story & { user: User };
    });
  },
  
  addStoryItem: (userId, item) => set(state => {
    const newItem: StoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...item,
    };
    
    const existingStoryIndex = state.stories.findIndex(s => s.userId === userId);
    
    if (existingStoryIndex >= 0) {
      // Update existing story
      const updatedStories = [...state.stories];
      updatedStories[existingStoryIndex] = {
        ...updatedStories[existingStoryIndex],
        items: [...updatedStories[existingStoryIndex].items, newItem],
        lastUpdated: newItem.timestamp,
        viewed: false,
      };
      return { stories: updatedStories };
    } else {
      // Create new story
      const newStory: Story = {
        id: Date.now().toString(),
        userId,
        items: [newItem],
        lastUpdated: newItem.timestamp,
        viewed: false,
      };
      return { stories: [...state.stories, newStory] };
    }
  }),
  
  markStoryAsViewed: (storyId) => set(state => ({
    stories: state.stories.map(story => 
      story.id === storyId ? { ...story, viewed: true } : story
    )
  })),
  
  getMyStories: (userId) => {
    return get().stories.filter(story => story.userId === userId);
  },
  
  getFriendsStories: (userId) => {
    const { stories } = get();
    const friendStories = stories.filter(story => story.userId !== userId);
    return friendStories.map(story => {
      if ((story as any).user) return story as Story & { user: User };
      const user = mockUsers.find(user => user.id === story.userId);
      return { ...story, user: user! } as Story & { user: User };
    });
  },
  
  // Fetch stories from Supabase (replaces mock data when available)
  fetchStories: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('[StoryStore] Failed to fetch stories', error.message);
      return;
    }

    if (data) {
      set({ stories: data as unknown as Story[] });
    }
  },
}));