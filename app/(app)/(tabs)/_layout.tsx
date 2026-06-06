import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, router } from 'expo-router';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { useAppInsets } from '@/hooks/useAppInsets';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { CommunityFeedProvider, useCommunityFeedContextOptional } from '@/contexts/CommunityFeedContext';
import { useAuthenticatedBackGuard } from '@/hooks/useAuthenticatedBackGuard';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} {...props} />;
}

function InventoryHeaderActions({ actionClr }: { actionClr: string }) {
  const unreadCount = useUnreadNotificationCount();

  return (
    <View className="mr-4 flex-row items-center gap-4">
      <Pressable accessibilityLabel="Notificações" onPress={() => router.push('/(app)/notifications')}>
        {({ pressed }) => (
          <View>
            <FontAwesome
              name="bell"
              size={20}
              color={actionClr}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
            {unreadCount > 0 ? (
              <View className="absolute -right-1.5 -top-1.5 min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
      <Link href="/(app)/book-form" asChild>
        <Pressable accessibilityLabel="Adicionar livro">
          {({ pressed }) => (
            <FontAwesome
              name="plus-circle"
              size={22}
              color={actionClr}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </Link>
    </View>
  );
}

function ConnectionsHeaderActions({ actionClr }: { actionClr: string }) {
  const feedContext = useCommunityFeedContextOptional();

  return (
    <View className="mr-4 flex-row items-center gap-4">
      {!feedContext?.searchMode ? (
        <Pressable accessibilityLabel="Buscar sinais" onPress={() => feedContext?.openSearch()}>
          {({ pressed }) => (
            <FontAwesome
              name="search"
              size={20}
              color={actionClr}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      ) : null}
      <Link href="/(app)/chats" asChild>
        <Pressable accessibilityLabel="Conversas">
          {({ pressed }) => (
            <FontAwesome
              name="comments"
              size={20}
              color={actionClr}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </Link>
      <Link href="/(app)/my-signals" asChild>
        <Pressable accessibilityLabel="Meus sinais">
          {({ pressed }) => (
            <FontAwesome
              name="list-alt"
              size={20}
              color={actionClr}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </Link>
      <Link href="/(app)/signal-form" asChild>
        <Pressable accessibilityLabel="Criar sinal">
          {({ pressed }) => (
            <FontAwesome
              name="bullhorn"
              size={20}
              color={actionClr}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </Link>
    </View>
  );
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
    <CommunityFeedProvider>
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
          headerRight: () => <InventoryHeaderActions actionClr={actionClr} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          headerShown: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="film" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Conexões',
          headerShown: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="play-circle" color={color} />,
          headerRight: () => <ConnectionsHeaderActions actionClr={actionClr} />,
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
    </CommunityFeedProvider>
  );
}
