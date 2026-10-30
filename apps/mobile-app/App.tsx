import { NavigationContainer, type NavigationState, type PartialState } from '@react-navigation/native';
import {
  createStackNavigator,
  type StackNavigationOptions,
  CardStyleInterpolators,
  TransitionPresets,
} from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardConfig } from './app/components/KeyboardConfig';
import AppDrawer from './app/components/AppDrawer';
import ModernTopNavigation from './app/components/ModernTopNavigation';
import Account from './app/screens/Account';
import Login from './app/screens/Auth/Login';
import SignUp from './app/screens/Auth/SignUp';
import { Congrats } from './app/screens/Congrats';
import { ConversationCategories } from './app/screens/ConversationCategories';
import { ConversationList } from './app/screens/ConversationList';
import { ConversationPractice } from './app/screens/ConversationPractice';
import Credits from './app/screens/Credits';
import Culture from './app/screens/CultureDynamic';
import DeckList from './app/screens/DeckList';
import Dictionary from './app/screens/Dictionary';
import MultipleChoice from './app/screens/MultipleChoice';
import NumbersWrite from './app/screens/NumbersWrite';
import Onboarding from './app/screens/Onboarding';
import Profile from './app/screens/Profile';
import Settings from './app/screens/Settings';
import { Stats } from './app/screens/Stats';
import Study from './app/screens/Study';
import { Write } from './app/screens/Write';
import { useAuth } from './app/stores/useAuth';
import { useLanguage } from './app/stores/useLanguage';
import { APP_NAME } from './app/config/appName';
import * as analytics from './app/analytics';

const DeckStackNav = createStackNavigator();
const ConvoStackNav = createStackNavigator();
const RootStack = createStackNavigator();

// Custom screen options with smooth transitions
const screenOptions: StackNavigationOptions = {
  headerShown: true,
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

// Modal-style transitions for celebration screens
const modalScreenOptions = {
  ...TransitionPresets.ModalSlideFromBottomIOS,
  gestureEnabled: true,
};

function DeckStack() {
  return (
    <DeckStackNav.Navigator screenOptions={{ ...screenOptions, headerLeftContainerStyle: { paddingLeft: 36 } }}>
      <DeckStackNav.Screen name="Decks" component={DeckList} options={{ headerTitleStyle: { color: '#6366f1', fontWeight: '800', fontSize: 22 }, headerTitleContainerStyle: { paddingLeft: 16 } }} />
      <DeckStackNav.Screen name="Study" component={Study} />
      <DeckStackNav.Screen name="Write" component={Write} options={{ title: 'Write Practice' }} />
      <DeckStackNav.Screen name="NumbersWrite" component={NumbersWrite} options={{ title: 'Numbers Practice' }} />
      <DeckStackNav.Screen
        name="Congrats"
        component={Congrats}
        options={{
          ...modalScreenOptions,
          headerShown: false,
        }}
      />
    </DeckStackNav.Navigator>
  );
}

function ConversationsStack() {
  return (
    <ConvoStackNav.Navigator screenOptions={{ ...screenOptions, headerLeftContainerStyle: { paddingLeft: 36 } }}>
      <ConvoStackNav.Screen name="Categories" component={ConversationCategories} options={{ title: 'Conversation Categories', headerTitleContainerStyle: { paddingLeft: 16 } }} />
      <ConvoStackNav.Screen name="ConversationList" component={ConversationList} options={({ route }: any) => ({ title: route.params?.title || 'Conversations' })} />
      <ConvoStackNav.Screen name="ConversationPractice" component={ConversationPractice} options={({ route }: any) => ({ title: route.params?.title || 'Practice' })} />
    </ConvoStackNav.Navigator>
  );
}

// Name of the innermost focused route, e.g. "Study" inside the deck stack.
function focusedRouteName(state: NavigationState | PartialState<NavigationState> | undefined): string | null {
  if (!state || state.index === undefined || !state.routes) return null;
  const route = state.routes[state.index];
  return focusedRouteName(route.state as NavigationState | undefined) ?? route.name;
}

// Tabs that host their own stack report the stack's screens instead (via onStateChange).
const TAB_SCREEN_NAMES: Record<string, string> = {
  DeckStack: 'Decks',
  Stats: 'Progress',
  Dictionary: 'Dictionary',
  Conversations: 'Categories',
  MultipleChoice: 'Quiz',
  Culture: 'Culture',
};

function MainTabs() {
  const [currentTab, setCurrentTab] = useState('DeckStack');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    analytics.trackScreen(TAB_SCREEN_NAMES[currentTab] ?? currentTab);
  }, [currentTab]);

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'DeckStack':
        return <DeckStack />;
      case 'Stats':
        return <Stats />;
      case 'Dictionary':
        return <Dictionary />;
      case 'Conversations':
        return <ConversationsStack />;
      case 'MultipleChoice':
        return <MultipleChoice />;
      case 'Culture':
        return <Culture />;
      default:
        return <DeckStack />;
    }
  };

  return (
    <AppDrawer
      isOpen={drawerOpen}
      onToggle={() => setDrawerOpen(prev => !prev)}
      currentTab={currentTab}
      onTabChange={(tab) => {
        setCurrentTab(tab);
        setDrawerOpen(false);
      }}
    >
      <View style={{ flex: 1 }}>
        <ModernTopNavigation />
        <View style={{ flex: 1 }}>
          {renderCurrentScreen()}
        </View>
      </View>
    </AppDrawer>
  );
}

export default function App() {
  const { loadLanguage, hasChosenLanguage } = useLanguage();
  const { currentUser, hydrate, loadUserStores } = useAuth();
  const selectedLanguage = useLanguage((s) => s.selectedLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    analytics.startAnalytics();
  }, []);

  useEffect(() => {
    void analytics.setUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    analytics.setLanguage(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    async function bootstrap() {
      const minDelay = new Promise(r => setTimeout(r, 400));
      // Phase 1: hydrate auth + load language (independent, can be parallel)
      await Promise.all([hydrate(), loadLanguage(), minDelay]);
      // Phase 2: now currentUser is set, load user-scoped stores
      await loadUserStores();
    }
    bootstrap().then(() => setReady(true));
  }, [hydrate, loadLanguage, loadUserStores]);

  const theme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, surface: '#ffffff', onSurface: '#0f172a' } } as typeof MD3LightTheme;

  if (!ready) {
    return (
      <View style={splashStyles.container}>
        <StatusBar style="dark" />
        <Text style={splashStyles.title}>{APP_NAME}</Text>
      </View>
    );
  }

  return (
    <analytics.AnalyticsErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <PaperProvider theme={theme}>
            <KeyboardConfig>
              <NavigationContainer
                onStateChange={(state) => {
                  const name = focusedRouteName(state);
                  // "Main" hosts the drawer tabs, which MainTabs reports itself.
                  if (name && name !== 'Main') analytics.trackScreen(name);
                }}
              >
                <RootStack.Navigator screenOptions={{ ...screenOptions, headerShown: false, cardStyle: { flex: 1 } }}>
                  {!currentUser ? (
                    <>
                      <RootStack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                      <RootStack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
                    </>
                  ) : !hasChosenLanguage ? (
                    <RootStack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
                  ) : (
                    <>
                      <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                      <RootStack.Screen name="Settings" component={Settings} options={{ headerShown: true, headerTitle: 'Settings' }} />
                      <RootStack.Screen name="Account" component={Account} options={{ headerShown: true, headerTitle: 'Account' }} />
                      <RootStack.Screen name="Profile" component={Profile} options={{ headerShown: true, headerTitle: 'Saved' }} />
                      <RootStack.Screen name="Credits" component={Credits} options={{ headerShown: true, headerTitle: 'Credits' }} />
                    </>
                  )}
                </RootStack.Navigator>
              </NavigationContainer>
            </KeyboardConfig>
          </PaperProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </analytics.AnalyticsErrorBoundary>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: -0.8,
  },
});
