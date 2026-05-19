import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#c2410c',
        tabBarInactiveTintColor: '#78716c',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fffbeb',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: '#1c1917',
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: '#fffaf0',
          borderTopColor: '#fed7aa',
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventário',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerRight: () => (
            <Link href="/(app)/book-form" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="plus-circle"
                    size={24}
                    color="#9a3412"
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
          tabBarIcon: ({ color }) => <TabBarIcon name="play-circle" color={color} />,
          headerRight: () => (
            <Link href="/(app)/signal-form" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="bullhorn"
                    size={22}
                    color="#9a3412"
                    style={{ marginRight: 16, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}
