import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';

interface FriendProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  about?: string | null;
  favoriteWoods?: string[];
  favoriteTools?: string[];
  favoriteProjects?: string[];
}

interface FriendProfileModalProps {
  visible: boolean;
  profile: FriendProfile | null;
  onClose: () => void;
  onSendText: () => void;
  onSendSnap: () => void;
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  visible,
  profile,
  onClose,
  onSendText,
  onSendSnap,
}) => {
  if (!profile) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={() => {}}>
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <Avatar source={profile.avatar} size={90} showBorder style={styles.avatar} />
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.username}>
              {profile.username.includes('@') ? profile.username : `@${profile.username}`}
            </Text>

            {profile.about ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.sectionText}>{profile.about}</Text>
              </View>
            ) : null}

            {profile.favoriteWoods && profile.favoriteWoods.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favorite Woods</Text>
                <Text style={styles.sectionText}>{profile.favoriteWoods.join(', ')}</Text>
              </View>
            )}

            {profile.favoriteTools && profile.favoriteTools.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favorite Tools</Text>
                <Text style={styles.sectionText}>{profile.favoriteTools.join(', ')}</Text>
              </View>
            )}

            {profile.favoriteProjects && profile.favoriteProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favorite Project Types</Text>
                <Text style={styles.sectionText}>{profile.favoriteProjects.join(', ')}</Text>
              </View>
            )}

            <View style={styles.buttonsWrapper}>
              <Button
                title="Send Text Message"
                variant="primary"
                fullWidth
                onPress={onSendText}
                style={styles.button}
              />
              <Button
                title="Send Snap"
                variant="secondary"
                fullWidth
                onPress={onSendSnap}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxHeight: height * 0.8,
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 24,
  },
  avatar: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  username: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textLight,
  },
  buttonsWrapper: {
    marginTop: 8,
  },
  button: {
    marginBottom: 8,
  },
}); 