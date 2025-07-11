import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <Animatable.View
          animation="bounceIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>📚</Text>
          </View>
        </Animatable.View>

        {/* App Name */}
        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          duration={1000}
          style={styles.appName}
        >
          Study Challenge Hub
        </Animatable.Text>

        {/* Tagline */}
        <Animatable.Text
          animation="fadeInUp"
          delay={800}
          duration={1000}
          style={styles.tagline}
        >
          Learn Together, Excel Together
        </Animatable.Text>

        {/* Loading Indicator */}
        <Animatable.View
          animation="fadeIn"
          delay={1200}
          duration={800}
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color={colors.textLight}
            style={styles.loadingIndicator}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </Animatable.View>
      </View>

      {/* Bottom Decoration */}
      <Animatable.View
        animation="fadeInUp"
        delay={1000}
        duration={1000}
        style={styles.bottomContainer}
      >
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animatable.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: typography.fontSizes.extraLarge,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: typography.fontSizes.subheading,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.xxl,
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loadingIndicator: {
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSizes.body,
    color: colors.textLight,
    opacity: 0.8,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    opacity: 0.7,
    fontWeight: '300',
  },
});

export default LoadingScreen;