import { Platform, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_CONTENT_HEIGHT = 56;
export const TAB_BAR_HORIZONTAL_INSET = 16;
export const TAB_BAR_FLOATING_GAP = 6;
export const TAB_BAR_INNER_PADDING = 10;

type TabBarPalette = {
  backgroundColor: string;
  borderColor: string;
  isDark: boolean;
};

export function useTabBarLayout(palette: TabBarPalette) {
  const insets = useSafeAreaInsets();

  const horizontalInset = Math.max(TAB_BAR_HORIZONTAL_INSET, insets.left, insets.right);
  const bottomInset = Math.max(
    insets.bottom,
    Platform.select({ android: 10, ios: 0, default: 8 }) ?? 8,
  );
  const bottom = bottomInset + TAB_BAR_FLOATING_GAP;
  const scrollBottomPadding = bottom + TAB_BAR_CONTENT_HEIGHT + 12;

  const tabBarStyle: ViewStyle = {
    position: 'absolute',
    left: horizontalInset,
    right: horizontalInset,
    bottom,
    height: TAB_BAR_CONTENT_HEIGHT,
    backgroundColor: palette.backgroundColor,
    borderColor: palette.borderColor,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: TAB_BAR_INNER_PADDING,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: palette.isDark ? 0.28 : 0.08,
    shadowRadius: 10,
    elevation: 6,
  };

  return {
    bottom,
    scrollBottomPadding,
    tabBarStyle,
    tabBarItemStyle: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 2,
    } satisfies ViewStyle,
    tabBarLabelStyle: {
      fontSize: 9,
      fontWeight: '700' as const,
      marginTop: 2,
    },
  };
}
