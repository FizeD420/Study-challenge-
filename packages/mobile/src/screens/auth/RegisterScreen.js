import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../../theme/theme';

const RegisterScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Screen</Text>
      <Text style={styles.subtitle}>Registration form coming soon...</Text>
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

export default RegisterScreen;