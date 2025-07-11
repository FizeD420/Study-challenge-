import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Card, Avatar, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { useAuth } from '../../context/AuthContext';
import { colors, typography, spacing, borderRadius, commonStyles, getSubjectColor } from '../../theme/theme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeGroups, setActiveGroups] = useState([]);
  const [pendingExams, setPendingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    activeGroups: 0,
    completedChallenges: 0,
    averageScore: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // TODO: Implement API calls
    // Mock data for now
    setActiveGroups([
      {
        id: '1',
        name: 'Physics Study Group',
        subject: 'Physics',
        chapter: 'Mechanics',
        timeRemaining: 86400000, // 24 hours in ms
        progress: 75,
        memberCount: 5,
      },
      {
        id: '2',
        name: 'Math Challenge',
        subject: 'Mathematics',
        chapter: 'Calculus',
        timeRemaining: 172800000, // 48 hours in ms
        progress: 45,
        memberCount: 8,
      },
    ]);

    setPendingExams([
      {
        id: '1',
        groupName: 'Chemistry Lab',
        subject: 'Chemistry',
        deadline: new Date(Date.now() + 3600000), // 1 hour from now
      },
    ]);

    setStats({
      totalGroups: 12,
      activeGroups: 3,
      completedChallenges: 8,
      averageScore: 85.5,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleGroupPress = (group) => {
    navigation.navigate('Groups', {
      screen: 'GroupDetails',
      params: { groupId: group.id, groupName: group.name },
    });
  };

  const formatTime = (timeInMs) => {
    const hours = Math.floor(timeInMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Student'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotifications}
        >
          <Icon name="notifications" size={24} color={colors.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Active Groups"
          value={stats.activeGroups}
          icon="group"
          color={colors.primary}
        />
        <StatCard
          title="Completed"
          value={stats.completedChallenges}
          icon="check-circle"
          color={colors.secondary}
        />
        <StatCard
          title="Avg Score"
          value={`${stats.averageScore}%`}
          icon="school"
          color={colors.warning}
        />
      </View>

      {/* Active Challenges */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Groups', { screen: 'GroupsMain' })}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {activeGroups.length > 0 ? (
          activeGroups.map((group, index) => (
            <Animatable.View
              key={group.id}
              animation="fadeInUp"
              delay={index * 200}
            >
              <ChallengeCard
                group={group}
                onPress={() => handleGroupPress(group)}
              />
            </Animatable.View>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="group-add" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Active Challenges</Text>
              <Text style={styles.emptySubtitle}>
                Join or create a study group to get started
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('Groups', { screen: 'CreateGroup' })}
              >
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Pending Exams */}
      {pendingExams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Exams</Text>
          {pendingExams.map((exam) => (
            <Card key={exam.id} style={styles.examCard}>
              <Card.Content style={styles.examContent}>
                <View style={styles.examInfo}>
                  <Icon
                    name="assignment"
                    size={24}
                    color={getSubjectColor(exam.subject)}
                  />
                  <View style={styles.examDetails}>
                    <Text style={styles.examTitle}>{exam.groupName}</Text>
                    <Text style={styles.examSubject}>{exam.subject}</Text>
                  </View>
                </View>
                <View style={styles.examDeadline}>
                  <Text style={styles.deadlineText}>Due in 1h</Text>
                  <Icon name="arrow-forward" size={20} color={colors.error} />
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="group-add"
            title="Create Group"
            onPress={() => navigation.navigate('Groups', { screen: 'CreateGroup' })}
          />
          <QuickActionButton
            icon="person-add"
            title="Find Friends"
            onPress={() => navigation.navigate('Friends', { screen: 'UserSearch' })}
          />
          <QuickActionButton
            icon="assignment"
            title="View Results"
            onPress={() => navigation.navigate('Groups', { screen: 'GroupsMain' })}
          />
          <QuickActionButton
            icon="settings"
            title="Settings"
            onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <Card style={styles.statCard}>
    <Card.Content style={styles.statContent}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card.Content>
  </Card>
);

const ChallengeCard = ({ group, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Card style={styles.challengeCard}>
      <LinearGradient
        colors={[getSubjectColor(group.subject), `${getSubjectColor(group.subject)}CC`]}
        style={styles.challengeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Card.Content style={styles.challengeContent}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{group.name}</Text>
              <Text style={styles.challengeSubject}>{group.subject} • {group.chapter}</Text>
            </View>
            <View style={styles.timerContainer}>
              <CountdownCircleTimer
                isPlaying
                duration={group.timeRemaining / 1000}
                size={40}
                strokeWidth={3}
                colors={[colors.textLight]}
              >
                {({ remainingTime }) => (
                  <Text style={styles.timerText}>
                    {Math.floor(remainingTime / 3600)}h
                  </Text>
                )}
              </CountdownCircleTimer>
            </View>
          </View>
          
          <View style={styles.challengeFooter}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Progress</Text>
              <ProgressBar
                progress={group.progress / 100}
                color={colors.textLight}
                style={styles.progressBar}
              />
            </View>
            <Text style={styles.memberCount}>{group.memberCount} members</Text>
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  </TouchableOpacity>
);

const QuickActionButton = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <View style={styles.quickActionIcon}>
      <Icon name={icon} size={24} color={colors.primary} />
    </View>
    <Text style={styles.quickActionTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSizes.body,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: typography.fontSizes.title,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSizes.title,
    fontWeight: '700',
    color: colors.text,
  },
  statTitle: {
    fontSize: typography.fontSizes.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.title,
    fontWeight: '600',
    color: colors.text,
  },
  seeAllText: {
    fontSize: typography.fontSizes.body,
    color: colors.primary,
    fontWeight: '500',
  },
  challengeCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  challengeGradient: {
    borderRadius: borderRadius.medium,
  },
  challengeContent: {
    padding: spacing.lg,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: typography.fontSizes.subheading,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  challengeSubject: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    opacity: 0.8,
  },
  timerContainer: {
    marginLeft: spacing.md,
  },
  timerText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  progressText: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 4,
  },
  memberCount: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    opacity: 0.8,
  },
  emptyCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.subheading,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  createButtonText: {
    color: colors.textLight,
    fontSize: typography.fontSizes.body,
    fontWeight: '600',
  },
  examCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  examContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  examTitle: {
    fontSize: typography.fontSizes.body,
    fontWeight: '600',
    color: colors.text,
  },
  examSubject: {
    fontSize: typography.fontSizes.small,
    color: colors.textSecondary,
  },
  examDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: typography.fontSizes.small,
    color: colors.error,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
  },
  quickActionButton: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    marginRight: spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: typography.fontSizes.small,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DashboardScreen;