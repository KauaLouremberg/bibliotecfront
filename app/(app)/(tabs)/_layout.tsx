import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import { useAppInsets } from '@/hooks/useAppInsets';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAuthenticatedBackGuard } from '@/hooks/useAuthenticatedBackGuard';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  useAuthenticatedBackGuard();
  const { monochrome } = useInterfaceMode();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark' && !monochrome;

  const activeColor = monochrome ? '#000000' : isDark ? '#C9A96E' : '#8B6534';
  const inactiveColor = monochrome ? '#737373' : isDark ? '#C9A96E' : '#C9A96E';
  const tabBarBg = monochrome ? '#ffffff' : isDark ? '#4A3520' : '#E8D5B0';
  const borderClr = monochrome ? '#d4d4d4' : '#C9A96E';
  const headerBg = monochrome ? '#ffffff' : isDark ? '#4A3520' : '#F5ECD7';
  const headerClr = monochrome ? '#111111' : isDark ? '#F5ECD7' : '#4A3520';
  const actionClr = monochrome ? '#111111' : '#8B6534';

  const { topInset, headerStatusBarHeight } = useAppInsets();
  const { tabBarStyle, tabBarItemStyle, tabBarLabelStyle, scrollBottomPadding } = useTabBarLayout({
    backgroundColor: tabBarBg,
    borderColor: borderClr,
    isDark,
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: headerBg },
        headerTitleStyle: { color: headerClr, fontWeight: '800' },
        headerStatusBarHeight,
        tabBarStyle,
        tabBarItemStyle,
        tabBarLabelStyle,
        tabBarAllowFontScaling: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { paddingBottom: scrollBottomPadding },
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
          sceneStyle: { paddingTop: topInset, paddingBottom: scrollBottomPadding },
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Trocas',
          tabBarIcon: ({ color }) => <TabBarIcon name="exchange" color={color} />,
          sceneStyle: { paddingTop: topInset, paddingBottom: scrollBottomPadding },
        }}
      />
    </Tabs>
  );
}
