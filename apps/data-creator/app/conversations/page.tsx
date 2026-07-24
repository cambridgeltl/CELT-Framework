'use client';

import { useState, useRef, useCallback } from 'react';
import { useConversations } from '../contexts/ConversationsContext';
import { useAudioStaging } from '../contexts/AudioStagingContext';
import { Category, Conversation, Exchange, SpeakerType, generateId } from '../models/Conversation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import ConversationAudioSection from '../components/ConversationAudioSection';
import { loadGitHubConfig, isConfigComplete } from '../utils/githubApi';

// Icons
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const AudioIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

// Separate component to ensure audio buttons re-render when staged files change
function ExchangeAudioButton({ exchange, index, getAudioUrl, handlePlayAudio, playingAudioIndex }: {
  exchange: Exchange;
  index: number;
  getAudioUrl: (exchange: Exchange, index: number) => string | null;
  handlePlayAudio: (index: number, audioUrl: string) => void;
  playingAudioIndex: number | null;
}) {
  const audioUrl = getAudioUrl(exchange, index);

  if (audioUrl) {
    return (
      <button
        onClick={() => handlePlayAudio(index, audioUrl)}
        className="mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors"
        style={{
          color: exchange.speaker === 'A'
            ? 'var(--color-speaker-a-text)'
            : 'var(--color-speaker-b-text)',
          backgroundColor: exchange.speaker === 'A'
            ? 'var(--color-speaker-a-accent)'
            : 'var(--color-speaker-b-accent)'
        }}
      >
        {playingAudioIndex === index ? <PauseIcon /> : <PlayIcon />}
        <span>{playingAudioIndex === index ? 'Stop' : 'Play'}</span>
      </button>
    );
  }

  if (exchange.audio) {
    return (
      <div
        className="mt-2 flex items-center gap-1.5 text-xs"
        style={{
          color: exchange.speaker === 'A'
            ? 'var(--color-speaker-a-text)'
            : 'var(--color-speaker-b-text)'
        }}
      >
        <AudioIcon />
        <span>{exchange.audio}</span>
      </div>
    );
  }

  return null;
}

type ViewLevel = 'categories' | 'conversations' | 'exchanges';

export default function ConversationsPage() {
  const {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    addConversation,
    updateConversation,
    removeConversation,
    addExchange,
    updateExchange,
    removeExchange,
    clearAll,
    stats,
  } = useConversations();

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [editingExchangeIndex, setEditingExchangeIndex] = useState<number | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ id: '', title: '', description: '' });
  const [conversationForm, setConversationForm] = useState({ id: '', title: '' });
  const [exchangeForm, setExchangeForm] = useState({
    speaker: 'A' as SpeakerType,
    english: '',
    dzardzongke: '',
    audio: '',
  });

  // Audio staging
  const { stagedFiles } = useAudioStaging();

  // Audio playback state
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Navigation handlers
  const navigateToCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewLevel('conversations');
  };

  const navigateToConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setViewLevel('exchanges');
  };

  const navigateBack = () => {
    if (viewLevel === 'exchanges') {
      setSelectedConversation(null);
      setViewLevel('conversations');
    } else if (viewLevel === 'conversations') {
      setSelectedCategory(null);
      setViewLevel('categories');
    }
  };

  // Keep selected data in sync
  const currentCategory = selectedCategory
    ? categories.find(c => c.id === selectedCategory.id) || null
    : null;

  const currentConversation = currentCategory && selectedConversation
    ? currentCategory.conversations.find(c => c.id === selectedConversation.id) || null
    : null;

  // Auto-generate ID from title
  const handleTitleChange = (title: string, type: 'category' | 'conversation') => {
    const id = generateId(title);
    if (type === 'category') {
      setCategoryForm({ ...categoryForm, title, id });
    } else {
      setConversationForm({ ...conversationForm, title, id });
    }
  };

  // Category handlers
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ id: category.id, title: category.title, description: category.description });
    } else {
      setEditingCategory(null);
      setCategoryForm({ id: '', title: '', description: '' });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.title.trim() || !categoryForm.id.trim()) {
      showMessage('error', 'Please enter a category title');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryForm.title, categoryForm.description);
      showMessage('success', 'Category updated!');
    } else {
      const result = addCategory(categoryForm.id, categoryForm.title, categoryForm.description);
      if (result) {
        showMessage('success', 'Category added!');
      } else {
        showMessage('error', 'Category ID already exists');
        return;
      }
    }

    setShowCategoryModal(false);
    setCategoryForm({ id: '', title: '', description: '' });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Delete "${category.title}" and all its conversations?`)) {
      removeCategory(category.id);
      showMessage('success', 'Category deleted!');
    }
  };

  // Conversation handlers
  const openConversationModal = (conversation?: Conversation) => {
    if (conversation) {
      setEditingConversation(conversation);
      setConversationForm({ id: conversation.id, title: conversation.title });
    } else {
      setEditingConversation(null);
      setConversationForm({ id: '', title: '' });
    }
    setShowConversationModal(true);
  };

  const handleSaveConversation = () => {
    if (!conversationForm.title.trim() || !conversationForm.id.trim() || !currentCategory) {
      showMessage('error', 'Please enter a conversation title');
      return;
    }

    if (editingConversation) {
      updateConversation(currentCategory.id, editingConversation.id, conversationForm.title);
      showMessage('success', 'Conversation updated!');
    } else {
      const result = addConversation(currentCategory.id, conversationForm.id, conversationForm.title);
      if (result) {
        showMessage('success', 'Conversation added!');
      } else {
        showMessage('error', 'Conversation ID already exists');
        return;
      }
    }

    setShowConversationModal(false);
    setConversationForm({ id: '', title: '' });
    setEditingConversation(null);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    if (!currentCategory) return;
    if (confirm(`Delete "${conversation.title}" and all its exchanges?`)) {
      removeConversation(currentCategory.id, conversation.id);
      showMessage('success', 'Conversation deleted!');
    }
  };

  // Exchange handlers
  const openExchangeModal = (index?: number) => {
    if (index !== undefined && currentConversation) {
      const exchange = currentConversation.exchanges[index];
      setEditingExchangeIndex(index);
      setExchangeForm({
        speaker: exchange.speaker,
        english: exchange.english,
        dzardzongke: exchange.dzardzongke,
        audio: exchange.audio || '',
      });
    } else {
      setEditingExchangeIndex(null);
      // Alternate speaker based on last exchange
      const lastSpeaker = currentConversation?.exchanges.slice(-1)[0]?.speaker;
      setExchangeForm({
        speaker: lastSpeaker === 'A' ? 'B' : 'A',
        english: '',
        dzardzongke: '',
        audio: '',
      });
    }
    setShowExchangeModal(true);
  };

  const handleSaveExchange = () => {
    if (!exchangeForm.english.trim() || !exchangeForm.dzardzongke.trim() || !currentCategory || !currentConversation) {
      showMessage('error', 'Please enter both English and Dzardzongke text');
      return;
    }

    if (editingExchangeIndex !== null) {
      updateExchange(currentCategory.id, currentConversation.id, editingExchangeIndex, {
        speaker: exchangeForm.speaker,
        english: exchangeForm.english,
        dzardzongke: exchangeForm.dzardzongke,
        audio: exchangeForm.audio || undefined,
      });
      showMessage('success', 'Exchange updated!');
    } else {
      addExchange(
        currentCategory.id,
        currentConversation.id,
        exchangeForm.speaker,
        exchangeForm.english,
        exchangeForm.dzardzongke,
        exchangeForm.audio || undefined
      );
      showMessage('success', 'Exchange added!');
    }

    setShowExchangeModal(false);
    setExchangeForm({ speaker: 'A', english: '', dzardzongke: '', audio: '' });
    setEditingExchangeIndex(null);
  };

  const handleDeleteExchange = (index: number) => {
    if (!currentCategory || !currentConversation) return;
    removeExchange(currentCategory.id, currentConversation.id, index);
    showMessage('success', 'Exchange deleted!');
  };

  // Generate unique exchange ID for audio staging
  const getExchangeAudioId = useCallback((categoryId: string, conversationId: string, index: number) => {
    return `conv-${categoryId}-${conversationId}-${index}`;
  }, []);

  // Get audio URL for playback
  const getAudioUrl = useCallback((exchange: Exchange, index: number) => {
    // Check if audio is staged (even if exchange.audio is not set yet)
    if (currentCategory && currentConversation) {
      const exchangeId = getExchangeAudioId(currentCategory.id, currentConversation.id, index);
      const staged = stagedFiles.find(f => f.wordId === exchangeId);
      if (staged) {
        return staged.url;
      }
    }

    if (!exchange.audio) return null;

    // Otherwise construct GitHub URL
    // exchange.audio now contains the full path: assets/audio/conversations/{title}/{title}_{textno}_{A or B}.wav
    const config = loadGitHubConfig();
    if (isConfigComplete(config)) {
      return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/main/${exchange.audio}`;
    }

    return null;
  }, [currentCategory, currentConversation, stagedFiles, getExchangeAudioId]);

  // Audio playback handlers
  const handlePlayAudio = useCallback((index: number, audioUrl: string) => {
    if (playingAudioIndex === index) {
      // Stop current audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setPlayingAudioIndex(null);
    } else {
      // Stop any playing audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      // Play new audio
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        setPlayingAudioIndex(null);
        audioPlayerRef.current = null;
      };
      audio.onerror = () => {
        showMessage('error', 'Failed to play audio');
        setPlayingAudioIndex(null);
        audioPlayerRef.current = null;
      };
      audio.play();
      setPlayingAudioIndex(index);
    }
  }, [playingAudioIndex]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          {viewLevel !== 'categories' && (
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors w-fit"
            >
              <BackIcon />
              <span>Back</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
                {viewLevel === 'categories' && 'Conversations'}
                {viewLevel === 'conversations' && currentCategory?.title}
                {viewLevel === 'exchanges' && currentConversation?.title}
              </h1>
              <p className="text-[var(--color-text-muted)] mt-1">
                {viewLevel === 'categories' && `${stats.categories} categories, ${stats.conversations} conversations, ${stats.exchanges} exchanges`}
                {viewLevel === 'conversations' && currentCategory?.description}
                {viewLevel === 'exchanges' && `${currentConversation?.exchanges.length || 0} exchanges`}
              </p>
            </div>

            {viewLevel === 'categories' && (
              <div className="flex gap-2">
                <Button onClick={() => openCategoryModal()} leftIcon={<PlusIcon />}>
                  Add Category
                </Button>
                {categories.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => confirm('Clear all conversations data?') && clearAll()}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            )}
            {viewLevel === 'conversations' && (
              <Button onClick={() => openConversationModal()} leftIcon={<PlusIcon />}>
                Add Conversation
              </Button>
            )}
            {viewLevel === 'exchanges' && (
              <Button onClick={() => openExchangeModal()} leftIcon={<PlusIcon />}>
                Add Exchange
              </Button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border animate-slideDown ${
              message.type === 'success'
                ? 'bg-[var(--color-success-light)] border-[var(--color-success)] text-[var(--color-success)]'
                : 'bg-[var(--color-danger-light)] border-[var(--color-danger)] text-[var(--color-danger)]'
            }`}
          >
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              message.type === 'success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'
            }`}>
              {message.type === 'success' ? (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Categories View */}
        {viewLevel === 'categories' && (
          <>
            {categories.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <ChatIcon />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                    No categories yet
                  </h3>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Create categories to organize your conversations
                  </p>
                  <Button onClick={() => openCategoryModal()} leftIcon={<PlusIcon />}>
                    Add Your First Category
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => navigateToCategory(category)}
                    className="bg-[var(--color-bg-secondary)] rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-[var(--color-border)] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
                        <ChatIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--color-text)]">
                          {category.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] truncate">
                          {category.description}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {category.conversations.length} conversation{category.conversations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openCategoryModal(category); }}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon />
                        </button>
                        <ChevronRightIcon />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Conversations View */}
        {viewLevel === 'conversations' && currentCategory && (
          <>
            {currentCategory.conversations.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <ChatIcon />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Add conversations to this category
                  </p>
                  <Button onClick={() => openConversationModal()} leftIcon={<PlusIcon />}>
                    Add Your First Conversation
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {currentCategory.conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => navigateToConversation(conversation)}
                    className="bg-[var(--color-bg-secondary)] rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-[var(--color-border)] group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--color-text)]">
                          {conversation.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {conversation.exchanges.length} exchange{conversation.exchanges.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openConversationModal(conversation); }}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conversation); }}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon />
                        </button>
                        <ChevronRightIcon />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Exchanges View - Chat Style */}
        {viewLevel === 'exchanges' && currentConversation && currentCategory && (
          <div className="space-y-4">
            {/* Speaker Legend */}
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">Speaker A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  B
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">Speaker B</span>
              </div>
            </div>

            {/* Chat Messages */}
            {currentConversation.exchanges.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                    No exchanges yet
                  </h3>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Add dialogue exchanges between speakers
                  </p>
                  <Button onClick={() => openExchangeModal()} leftIcon={<PlusIcon />}>
                    Add First Exchange
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {currentConversation.exchanges.map((exchange, index) => (
                  <div
                    key={index}
                    className={`flex ${exchange.speaker === 'A' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className="max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]">
                      <div
                        className={`rounded-2xl p-4 shadow-sm group relative ${exchange.speaker === 'A' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
                        style={{
                          backgroundColor: exchange.speaker === 'A' 
                            ? 'var(--color-speaker-a-bg)' 
                            : 'var(--color-speaker-b-bg)'
                        }}
                      >
                        {/* English text */}
                        <p className="text-[var(--color-text)] font-medium">
                          {exchange.english}
                        </p>

                        {/* Dzardzongke translation */}
                        <p 
                          className="mt-2 text-sm font-medium"
                          style={{
                            color: exchange.speaker === 'A' 
                              ? 'var(--color-speaker-a-text)' 
                              : 'var(--color-speaker-b-text)'
                          }}
                        >
                          {exchange.dzardzongke}
                        </p>

                        {/* Audio playback button */}
                        <ExchangeAudioButton
                          exchange={exchange}
                          index={index}
                          getAudioUrl={getAudioUrl}
                          handlePlayAudio={handlePlayAudio}
                          playingAudioIndex={playingAudioIndex}
                        />

                        {/* Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openExchangeModal(index)}
                            className="p-1.5 bg-[var(--color-bg-secondary)] rounded-lg shadow text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteExchange(index)}
                            className="p-1.5 bg-[var(--color-bg-secondary)] rounded-lg shadow text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      {/* Exchange number */}
                      <p className={`text-xs text-[var(--color-text-muted)] mt-1 ${
                        exchange.speaker === 'A' ? 'text-left pl-2' : 'text-right pr-2'
                      }`}>
                        #{index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          size="md"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => setShowCategoryModal(false)} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} fullWidth>
                {editingCategory ? 'Save Changes' : 'Add Category'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Title *"
              value={categoryForm.title}
              onChange={(e) => handleTitleChange((e.target as HTMLInputElement).value, 'category')}
              placeholder="Greetings & Introductions"
            />
            <Input
              label="ID *"
              value={categoryForm.id}
              onChange={(e) => setCategoryForm({ ...categoryForm, id: (e.target as HTMLInputElement).value })}
              placeholder="greetings"
              disabled={!!editingCategory}
            />
            <Input
              label="Description"
              multiline
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: (e.target as HTMLTextAreaElement).value })}
              placeholder="Learn how to greet people and introduce yourself"
            />
          </div>
        </Modal>

        {/* Conversation Modal */}
        <Modal
          isOpen={showConversationModal}
          onClose={() => { setShowConversationModal(false); setEditingConversation(null); }}
          title={editingConversation ? 'Edit Conversation' : 'Add Conversation'}
          size="md"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => setShowConversationModal(false)} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleSaveConversation} fullWidth>
                {editingConversation ? 'Save Changes' : 'Add Conversation'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Title *"
              value={conversationForm.title}
              onChange={(e) => handleTitleChange((e.target as HTMLInputElement).value, 'conversation')}
              placeholder="Basic Greeting"
            />
            <Input
              label="ID *"
              value={conversationForm.id}
              onChange={(e) => setConversationForm({ ...conversationForm, id: (e.target as HTMLInputElement).value })}
              placeholder="basic-greeting"
              disabled={!!editingConversation}
            />
          </div>
        </Modal>

        {/* Exchange Modal */}
        <Modal
          isOpen={showExchangeModal}
          onClose={() => { setShowExchangeModal(false); setEditingExchangeIndex(null); }}
          title={editingExchangeIndex !== null ? 'Edit Exchange' : 'Add Exchange'}
          size="lg"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => setShowExchangeModal(false)} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleSaveExchange} fullWidth>
                {editingExchangeIndex !== null ? 'Save Changes' : 'Add Exchange'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Speaker Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Speaker *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setExchangeForm({ ...exchangeForm, speaker: 'A' })}
                  className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                    exchangeForm.speaker === 'A'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                      : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    A
                  </div>
                  <span className="font-medium">Speaker A</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExchangeForm({ ...exchangeForm, speaker: 'B' })}
                  className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                    exchangeForm.speaker === 'B'
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    B
                  </div>
                  <span className="font-medium">Speaker B</span>
                </button>
              </div>
            </div>

            <Input
              label="English Text *"
              multiline
              rows={2}
              value={exchangeForm.english}
              onChange={(e) => setExchangeForm({ ...exchangeForm, english: (e.target as HTMLTextAreaElement).value })}
              placeholder="Hello! How's it going?"
            />

            <Input
              label="Dzardzongke *"
              multiline
              rows={2}
              value={exchangeForm.dzardzongke}
              onChange={(e) => setExchangeForm({ ...exchangeForm, dzardzongke: (e.target as HTMLTextAreaElement).value })}
              placeholder="Dangsang yoe te? / Denchak yoe te? / Kham zanga yoe te?"
            />

            {/* Audio Section */}
            {currentCategory && currentConversation && (
              <ConversationAudioSection
                exchangeId={getExchangeAudioId(
                  currentCategory.id,
                  currentConversation.id,
                  editingExchangeIndex ?? currentConversation.exchanges.length
                )}
                categoryId={currentCategory.id}
                conversationId={currentConversation.id}
                exchangeIndex={editingExchangeIndex ?? currentConversation.exchanges.length}
                speaker={exchangeForm.speaker}
                audioFilename={exchangeForm.audio}
                onAudioChange={(filename) => setExchangeForm({ ...exchangeForm, audio: filename })}
              />
            )}
          </div>
        </Modal>

      </div>
    </div>
  );
}
