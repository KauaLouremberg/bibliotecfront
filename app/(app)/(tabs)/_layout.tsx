import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAuthenticatedBackGuard } from '@/hooks/useAuthenticatedBackGuard';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  useAuthenticatedBackGuard();
  const { monochrome } = useInterfaceMode();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark' && !monochrome;

  const activeColor = monochrome ? '#000000' : isDark ? '#fb923c' : '#c2410c';
  const inactiveColor = monochrome ? '#737373' : isDark ? '#78716c' : '#a8a29e';
  const tabBarBg = monochrome ? '#ffffff' : isDark ? '#1c1917' : '#fffbeb';
  const borderClr = monochrome ? '#d4d4d4' : isDark ? '#44403c' : '#fed7aa';
  const headerBg = monochrome ? '#ffffff' : isDark ? '#0c0a09' : '#fffbeb';
  const headerClr = monochrome ? '#111111' : isDark ? '#fafaf9' : '#1c1917';
  const actionClr = monochrome ? '#111111' : isDark ? '#fb923c' : '#9a3412';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: headerBg },
        headerTitleStyle: { color: headerClr, fontWeight: '800' },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          backgroundColor: tabBarBg,
          borderTopColor: borderClr,
          borderColor: borderClr,
          borderWidth: 1,
          borderRadius: 28,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventário',
          headerShown: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerRight: () => (
            <Link href="/(app)/book-form" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="plus-circle"
                    size={22}
                    color={actionClr}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Conexões',
          headerShown: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="play-circle" color={color} />,
          headerRight: () => (
            <Link href="/(app)/signal-form" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="bullhorn"
                    size={20}
                    color={actionClr}
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Negociações',
          tabBarIcon: ({ color }) => <TabBarIcon name="exchange" color={color} />,
        }}
      />
    </Tabs>
  );
}
