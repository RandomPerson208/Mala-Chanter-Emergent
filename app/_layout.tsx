import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { getColors } from '@/src/theme';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

const colors = getColors('dark');

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandSecondary,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'android' ? 'rgba(20,19,17,0.92)' : 'transparent',
          height: 78,
          paddingTop: 8,
          paddingBottom: 22,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView tint="dark" intensity={70} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,19,17,0.92)' }]} />
          ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Counter',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipse" size={size} color={color} />,
          tabBarButtonTestID: 'tab-counter',
        }}
      />
      <Tabs.Screen
        name="mantras"
        options={{
          title: 'Mantras',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
          tabBarButtonTestID: 'tab-mantras',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame-outline" size={size} color={color} />,
          tabBarButtonTestID: 'tab-stats',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          tabBarButtonTestID: 'tab-history',
        }}
      />
    </Tabs>
  );
}
