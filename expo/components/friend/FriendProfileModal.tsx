import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { X as XIcon } from 'lucide-react-native';

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
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Modal Card */}
      <View style={styles.centerContainer}>
        <View style={styles.modalContainer}>
          {/* Close icon */}
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <XIcon size={24} color={colors.danger} />
          </Pressable>
          <ScrollView
            style={{ maxHeight: maxModalHeight }}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
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
                title="Send Message"
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
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');
const maxModalHeight = height * 0.8;

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
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