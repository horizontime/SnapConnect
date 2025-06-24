import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useFriendStore } from '@/store/friendStore';
import { supabase } from '@/utils/supabase';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Camera } from 'lucide-react-native';
import { User } from '@/types';

export default function AddFriendsScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const addFriendLocal = useFriendStore(state => state.addFriend);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 0) {
        searchProfiles(query.trim());
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const searchProfiles = async (searchText: string) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${searchText}%`)
        .neq('id', userId)
        .limit(20);

      if (error) throw error;

      const mapped: User[] = (data || []).map(p => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name || p.username,
        avatar: p.avatar_url,
        isOnline: false,
      }));

      setResults(mapped);
    } catch (err: any) {
      console.error('[SearchProfiles]', err.message);
      Alert.alert('Error', 'Unable to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friend: User) => {
    Keyboard.dismiss();
    try {
      const { error } = await supabase
        .from('friends')
        .insert({ user_id: userId, friend_id: friend.id });

      if (error) throw error;

      addFriendLocal(friend);
      Alert.alert('Success', `@${friend.username} added to your friends!`);
    } catch (err: any) {
      console.error('[AddFriend]', err.message);
      Alert.alert('Error', err.message || 'Failed to add friend.');
    }
  };

  const handleScanQr = () => {
    router.push('/friends/scan' as any);
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.itemContainer}>
      <Avatar source={item.avatar} size={40} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddFriend(item)}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by username"
        placeholderTextColor={colors.textLight}
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => searchProfiles(query)}
      />
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={!loading && query.length > 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : null}
      />

      <TouchableOpacity style={styles.scanButton} onPress={handleScanQr}>
        <Camera size={20} color={colors.card} />
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  searchInput: {
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: 32,
    fontSize: 14,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.card,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textLight,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  scanButton: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  scanButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 