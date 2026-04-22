import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();

  const isMapping = employee?.role === 'mapping';

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 60,
      android: insets.bottom + 60,
      default: 70,
    }),
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: insets.bottom + 8,
      android: insets.bottom + 8,
      default: 8,
    }),
    paddingHorizontal: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Today's Calls — only for sales */}
      <Tabs.Screen
        name="index"
        options={{
          title: isMapping ? '' : "Today's Calls",
          tabBarIcon: ({ color, size }) =>
            isMapping ? null : (
              <MaterialIcons name="today" size={size} color={color} />
            ),
          tabBarItemStyle: isMapping ? { display: 'none' } : undefined,
        }}
      />

      {/* Mapping Form — only for mapping agents */}
      <Tabs.Screen
        name="mapping"
        options={{
          title: isMapping ? 'Mapping' : '',
          tabBarIcon: ({ color, size }) =>
            isMapping ? (
              <MaterialIcons name="map" size={size} color={color} />
            ) : null,
          tabBarItemStyle: isMapping ? undefined : { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
