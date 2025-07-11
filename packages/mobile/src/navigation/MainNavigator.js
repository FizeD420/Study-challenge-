import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../theme/theme';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Secondary screens
import GroupDetailsScreen from '../screens/groups/GroupDetailsScreen';
import GroupChatScreen from '../screens/groups/GroupChatScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import ExamScreen from '../screens/exam/ExamScreen';
import ExamSubmissionScreen from '../screens/exam/ExamSubmissionScreen';
import ExamResultsScreen from '../screens/exam/ExamResultsScreen';
import UserSearchScreen from '../screens/friends/UserSearchScreen';
import FriendRequestsScreen from '../screens/friends/FriendRequestsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 2,
        shadowOpacity: 0.1,
      },
      headerTintColor: colors.primary,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen 
      name="DashboardMain" 
      component={DashboardScreen}
      options={{ title: 'Study Challenge Hub' }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
  </Stack.Navigator>
);

const GroupsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 2,
        shadowOpacity: 0.1,
      },
      headerTintColor: colors.primary,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen 
      name="GroupsMain" 
      component={GroupsScreen}
      options={{ title: 'My Groups' }}
    />
    <Stack.Screen 
      name="CreateGroup" 
      component={CreateGroupScreen}
      options={{ title: 'Create Group' }}
    />
    <Stack.Screen 
      name="GroupDetails" 
      component={GroupDetailsScreen}
      options={({ route }) => ({ 
        title: route.params?.groupName || 'Group Details' 
      })}
    />
    <Stack.Screen 
      name="GroupChat" 
      component={GroupChatScreen}
      options={({ route }) => ({ 
        title: route.params?.groupName || 'Group Chat' 
      })}
    />
    <Stack.Screen 
      name="Exam" 
      component={ExamScreen}
      options={{ title: 'Exam' }}
    />
    <Stack.Screen 
      name="ExamSubmission" 
      component={ExamSubmissionScreen}
      options={{ title: 'Submit Answers' }}
    />
    <Stack.Screen 
      name="ExamResults" 
      component={ExamResultsScreen}
      options={{ title: 'Exam Results' }}
    />
  </Stack.Navigator>
);

const FriendsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 2,
        shadowOpacity: 0.1,
      },
      headerTintColor: colors.primary,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen 
      name="FriendsMain" 
      component={FriendsScreen}
      options={{ title: 'Friends' }}
    />
    <Stack.Screen 
      name="UserSearch" 
      component={UserSearchScreen}
      options={{ title: 'Find Friends' }}
    />
    <Stack.Screen 
      name="FriendRequests" 
      component={FriendRequestsScreen}
      options={{ title: 'Friend Requests' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 2,
        shadowOpacity: 0.1,
      },
      headerTintColor: colors.primary,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Groups':
              iconName = 'group';
              break;
            case 'Friends':
              iconName = 'people';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: spacing.xs,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStack}
        options={{
          tabBarLabel: 'Groups',
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsStack}
        options={{
          tabBarLabel: 'Friends',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;