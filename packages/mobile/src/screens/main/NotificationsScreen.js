import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../../theme/theme';

const NotificationsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Coming Soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...commonStyles.heading,
    marginBottom: 8,
  },
  subtitle: {
    ...commonStyles.textSecondary,
  },
});

export default NotificationsScreen;