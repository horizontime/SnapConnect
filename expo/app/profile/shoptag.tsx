import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import QRCode from 'react-native-qrcode-svg';

export default function MyShopTagScreen() {
  const { userId, username } = useAuthStore();
  const qrValue = `snapconnect://user/${userId}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan to add me</Text>
      {userId ? (
        <QRCode value={qrValue} size={240} backgroundColor={colors.card} color={colors.text} />
      ) : (
        <Text style={styles.error}>You need to be logged in.</Text>
      )}
      {username && <Text style={styles.username}>@{username}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
  username: {
    marginTop: 24,
    fontSize: 18,
    color: colors.text,
  },
  error: {
    color: colors.danger,
  },
}); 