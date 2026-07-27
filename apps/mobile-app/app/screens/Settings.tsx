import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../stores/useLanguage';
import { getAvailableLanguages, getLanguageDisplayName } from '../services/contentRegistry';
import AnimatedButton from '../components/AnimatedButton';

const Settings: React.FC = () => {
  const navigation = useNavigation<any>();
  const { selectedLanguage, setLanguage } = useLanguage();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const languages = getAvailableLanguages();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.infoText}>
          Currently learning: {getLanguageDisplayName(selectedLanguage)}
        </Text>
      </View>

      {/* Navigation cards */}
      <View style={styles.card}>
        <AnimatedButton
          style={styles.navRow}
          onPress={() => navigation.navigate('Account')}
          hapticFeedback="light"
        >
          <View style={[styles.iconBadge, { backgroundColor: '#eef2ff' }]}>
            <MaterialCommunityIcons name="account-circle-outline" size={18} color="#6366f1" />
          </View>
          <Text style={styles.navLabel}>Account</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
        </AnimatedButton>

        <View style={styles.rowDivider} />

        <AnimatedButton
          style={styles.navRow}
          onPress={() => setShowLanguagePicker((v) => !v)}
          hapticFeedback="light"
        >
          <View style={[styles.iconBadge, { backgroundColor: '#f0f9ff' }]}>
            <MaterialCommunityIcons name="translate" size={18} color="#0284c7" />
          </View>
          <View style={styles.navLabelContainer}>
            <Text style={styles.navLabel}>Language</Text>
            <Text style={styles.navSubLabel}>{getLanguageDisplayName(selectedLanguage)}</Text>
          </View>
          <MaterialCommunityIcons
            name={showLanguagePicker ? 'chevron-down' : 'chevron-right'}
            size={20}
            color="#94a3b8"
          />
        </AnimatedButton>

        {showLanguagePicker && (
          <View style={styles.languageList}>
            {languages.map((lang) => (
              <AnimatedButton
                key={lang}
                style={styles.languageOption}
                onPress={() => {
                  setLanguage(lang);
                  setShowLanguagePicker(false);
                }}
                hapticFeedback="light"
              >
                <Text style={styles.navLabel}>{getLanguageDisplayName(lang)}</Text>
                {lang === selectedLanguage && (
                  <MaterialCommunityIcons name="check" size={18} color="#6366f1" />
                )}
              </AnimatedButton>
            ))}
          </View>
        )}
      </View>

      {/* App version */}
      <Text style={styles.version}>App v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabelContainer: {
    flex: 1,
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  navSubLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  languageList: {
    marginTop: 8,
    paddingLeft: 44,
    gap: 4,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 8,
  },
  version: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default Settings;
