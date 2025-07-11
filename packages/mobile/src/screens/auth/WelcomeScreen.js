import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Animatable.View
              animation="bounceIn"
              duration={1500}
              style={styles.logoContainer}
            >
              <View style={styles.logo}>
                <Text style={styles.logoEmoji}>📚</Text>
              </View>
            </Animatable.View>

            <Animatable.Text
              animation="fadeInUp"
              delay={500}
              duration={1000}
              style={styles.title}
            >
              Study Challenge Hub
            </Animatable.Text>

            <Animatable.Text
              animation="fadeInUp"
              delay={700}
              duration={1000}
              style={styles.subtitle}
            >
              Learn Together, Excel Together
            </Animatable.Text>
          </View>

          {/* Features Section */}
          <Animatable.View
            animation="fadeInUp"
            delay={900}
            duration={1000}
            style={styles.featuresContainer}
          >
            <FeatureItem
              icon="group"
              title="Study Groups"
              description="Create and join study groups with friends"
            />
            <FeatureItem
              icon="timer"
              title="Challenge Timer"
              description="Real-time countdown for study challenges"
            />
            <FeatureItem
              icon="assignment"
              title="Real Exams"
              description="Submit handwritten answers for grading"
            />
            <FeatureItem
              icon="chat"
              title="Group Chat"
              description="WhatsApp-style messaging with friends"
            />
          </Animatable.View>
        </ScrollView>

        {/* Action Buttons */}
        <Animatable.View
          animation="fadeInUp"
          delay={1200}
          duration={1000}
          style={styles.actionContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </Animatable.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Icon name={icon} size={24} color={colors.primary} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150, // Space for action buttons
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.fontSizes.extraLarge,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.fontSizes.subheading,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '300',
  },
  featuresContainer: {
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSizes.subheading,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSizes.body,
    color: colors.textLight,
    opacity: 0.8,
    lineHeight: 20,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryButton: {
    backgroundColor: colors.textLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizes.subheading,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textLight,
  },
  secondaryButtonText: {
    color: colors.textLight,
    fontSize: typography.fontSizes.body,
    fontWeight: '500',
  },
});

export default WelcomeScreen;