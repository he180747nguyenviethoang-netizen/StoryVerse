import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../settings/hooks';
import { useAuth } from '../../auth/hooks';
import { askReaderChatbot } from '../api';
import { useNavigation } from '@react-navigation/native';

export function ReaderChatbot({ visible, onClose, comicId, currentChapterNumber }) {
  const { colors, language } = useSettings();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const styles = makeStyles(colors);
  const navigation = useNavigation();

  const handleLoginPress = () => {
    onClose();
    navigation.navigate('Profile', { goBack: true });
  };


  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text ?? input.trim();
    if (!question || loading) return;
    setInput('');
    setLoading(true);
    try {
      const data = await askReaderChatbot(comicId, question, currentChapterNumber);
      setMessages((prev) => [...prev, { question, response: data.responses }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          question,
          response: {
            vi: t('story.chatbot.errorMessage'),
            en: t('story.chatbot.errorMessage'),
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const samples = t('story.chatbot.samples', { returnObjects: true });


  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('story.chatbot.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages / Quick questions */}
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={[
              styles.bodyContent,
              !isAuthenticated
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {!isAuthenticated && (
              <View style={styles.loginRequiredContainer}>
                <Text style={styles.loginRequiredText}>
                  {t('home.loginRequiredPrefix')}
                  <Text style={styles.loginRequiredLink} onPress={handleLoginPress}>
                    {t('home.loginRequiredLink')}
                  </Text>
                  {t('home.loginRequiredSuffix')}
                </Text>
              </View>
            )}

            {isAuthenticated && messages.length === 0 && (
              <View>
                <Text style={styles.hint}>{t('story.chatbot.hint')}</Text>
                {Array.isArray(samples) &&
                  samples.map((q, i) => (
                    <TouchableOpacity key={i} style={styles.sample} onPress={() => sendMessage(q)}>
                      <Text style={styles.sampleText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            {isAuthenticated &&
              messages.map((msg, i) => (
                <View key={i} style={styles.messageGroup}>
                  <View style={styles.questionBubble}>
                    <Text style={styles.questionText}>{msg.question}</Text>
                  </View>
                  <View style={styles.responseBubble}>
                    <Text style={styles.responseText}>
                      {language === 'vi' ? msg.response.vi : msg.response.en}
                    </Text>
                  </View>
                </View>
              ))}

            {isAuthenticated && loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>{t('story.chatbot.thinking')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Input row */}
          {isAuthenticated && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder={t('story.chatbot.placeholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                <Text style={styles.sendBtnText}>➤</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      minHeight: '65%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    closeBtn: { fontSize: 18, color: colors.textSecondary, paddingHorizontal: 4 },
    body: { flex: 1 },
    bodyContent: { padding: 16, gap: 12 },
    loginRequiredContainer: { alignItems: 'center', paddingHorizontal: 12 },
    loginRequiredText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
    loginRequiredLink: { color: colors.primary, fontWeight: '600' },
    hint: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
    sample: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sampleText: { color: colors.primary, fontSize: 14 },
    messageGroup: { gap: 8, marginBottom: 8 },
    questionBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderRadius: 14,
      borderBottomRightRadius: 4,
      padding: 10,
      maxWidth: '80%',
    },
    questionText: { color: '#fff', fontSize: 14 },
    responseBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: 14,
      borderBottomLeftRadius: 4,
      padding: 10,
      maxWidth: '90%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    responseText: { color: colors.text, fontSize: 14, lineHeight: 20 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    loadingText: { color: colors.textSecondary, fontSize: 14 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
      marginBottom: 20,
    },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      color: colors.text,
      fontSize: 14,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: colors.border },
    sendBtnText: { color: '#fff', fontSize: 16 },
  });
}
