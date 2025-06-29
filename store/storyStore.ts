import { create } from 'zustand';
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
  getAllStories: () => any[];
  fetchStories: (userId?: string) => Promise<void>;
  subscribeToRealtime: (userId: string) => void;
  deleteStory: (storyId: string) => Promise<boolean>;
};

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  currentStoryId: null,
  currentStoryItemIndex: 0,
  
  setCurrentStory: (storyId, itemIndex = 0) => 
    set({ currentStoryId: storyId, currentStoryItemIndex: itemIndex }),
  
  getStoriesWithUserData: () => {
    const { stories } = get();
    return stories.filter(story => (story as any).user) as (Story & { user: User })[];
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
    return friendStories.filter(story => (story as any).user) as (Story & { user: User })[];
  },
  
  getAllStories: () => {
    return get().stories;
  },
  
  deleteStory: async (storyId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);
        
      if (error) {
        console.error('[StoryStore] Failed to delete story', error.message);
        throw error;
      }
      
      // Update local state
      set(state => ({
        stories: state.stories.filter(s => s.id !== storyId)
      }));
      
      return true;
    } catch (error) {
      console.error('[StoryStore] Delete story error:', error);
      return false;
    }
  },
  
  // Fetch stories from Supabase (replaces mock data when available)
  fetchStories: async (userId) => {
    const { data, error } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[StoryStore] Failed to fetch stories', error.message);
      return;
    }

    let stories: any[] = data || [];

    // If userId is provided, fetch friend relationships and view status
    if (userId) {
      // Fetch friend relationships
      const { data: friendships } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      const friendIds = new Set(
        (friendships || []).map(f => 
          f.user_id === userId ? f.friend_id : f.user_id
        )
      );

      // Fetch view status
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', userId);

      const viewedIds = new Set((views || []).map(v => v.story_id));

      // Map stories with friend and view status
      stories = stories.map(s => {
        const isFriend = friendIds.has(s.user_id);
        return {
          ...s,
          viewed: viewedIds.has(s.id),
          user: {
            ...s.user,
            isFriend,
          },
        };
      });
    }

    // ensure required fields exist
    stories = stories.map((s: any) => ({
      ...s,
      userId: s.user_id,
      lastUpdated: s.lastUpdated || s.created_at || new Date().toISOString(),
      items: [], // Stories in new structure don't have items
    }));

    set({ stories });
  },

  subscribeToRealtime: (userId: string) => {
    const channel = supabase.channel('rt-stories');

    // New story snap inserted
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, payload => {
      const story = payload.new as any;
      // If story belongs to current user or a friend
      get().fetchStories(userId);
    });

    // Story deleted (expired)
    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stories' }, payload => {
      const id = payload.old.id;
      set({ stories: get().stories.filter(s => s.id !== id) });
    });

    // Story views
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_views' }, payload => {
      const { story_id, viewer_id } = payload.new as any;
      if (viewer_id === userId) {
        set({ stories: get().stories.map(s => s.id === story_id ? { ...s, viewed: true } : s) });
      }
    });

    channel.subscribe();
  },
}));