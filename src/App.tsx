import React, { useState, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './screens/HomeScreen';
import { ChatScreen } from './screens/ChatScreen';
import { NotesScreen } from './screens/NotesScreen';
import { TasksScreen } from './screens/TasksScreen';
import { TablesScreen } from './screens/TablesScreen';
import { CamperScreen } from './screens/CamperScreen';
import { FocusScreen } from './screens/FocusScreen';
import { PdfScreen } from './screens/PdfScreen';
import { VoiceScreen } from './screens/VoiceScreen';
import { SplashScreen } from './screens/SplashScreen';
import { useEagerEngineInit } from './hooks/useEagerEngineInit';

type Screen =
  | { name: 'splash' }
  | { name: 'home' }
  | { name: 'chat' }
  | { name: 'notes' }
  | { name: 'tasks' }
  | { name: 'tables' }
  | { name: 'camper' }
  | { name: 'focus' }
  | { name: 'pdf' }
  | { name: 'voice' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'splash' });

  // Begin initializing a downloaded model in the background on launch.
  useEagerEngineInit();

  const handleNavigateToChat = useCallback(() => {
    setScreen({ name: 'chat' });
  }, []);

  const handleNavigateToNotes = useCallback(() => {
    setScreen({ name: 'notes' });
  }, []);

  const handleNavigateToTasks = useCallback(() => {
    setScreen({ name: 'tasks' });
  }, []);

  const handleNavigateToTables = useCallback(() => {
    setScreen({ name: 'tables' });
  }, []);

  const handleNavigateToCamper = useCallback(() => {
    setScreen({ name: 'camper' });
  }, []);

  const handleNavigateToTimer = useCallback(() => {
    setScreen({ name: 'focus' });
  }, []);

  const handleNavigateToPdf = useCallback(() => {
    setScreen({ name: 'pdf' });
  }, []);

  const handleNavigateToVoice = useCallback(() => {
    setScreen({ name: 'voice' });
  }, []);

  const handleNavigateToHome = useCallback(() => {
    setScreen({ name: 'home' });
  }, []);

  const handleEnterApp = useCallback(() => {
    setScreen({ name: 'home' });
  }, []);

  let content: React.ReactNode;
  switch (screen.name) {
    case 'splash':
      content = <SplashScreen onEnter={handleEnterApp} />;
      break;
    case 'chat':
      content = <ChatScreen onBack={handleNavigateToHome} />;
      break;
    case 'notes':
      content = <NotesScreen onBack={handleNavigateToHome} />;
      break;
    case 'tasks':
      content = <TasksScreen onBack={handleNavigateToHome} />;
      break;
    case 'tables':
      content = <TablesScreen onBack={handleNavigateToHome} />;
      break;
    case 'camper':
      content = <CamperScreen onBack={handleNavigateToHome} />;
      break;
    case 'focus':
      content = <FocusScreen onBack={handleNavigateToHome} />;
      break;
    case 'pdf':
      content = <PdfScreen onBack={handleNavigateToHome} />;
      break;
    case 'voice':
      content = <VoiceScreen onBack={handleNavigateToHome} />;
      break;
    default:
      content = (
        <HomeScreen
          onNavigateToChat={handleNavigateToChat}
          onNavigateToNotes={handleNavigateToNotes}
          onNavigateToTasks={handleNavigateToTasks}
          onNavigateToTables={handleNavigateToTables}
          onNavigateToCamper={handleNavigateToCamper}
          onNavigateToTimer={handleNavigateToTimer}
          onNavigateToPdf={handleNavigateToPdf}
          onNavigateToVoice={handleNavigateToVoice}
        />
      );
  }

  return <SafeAreaProvider>{content}</SafeAreaProvider>;
}
