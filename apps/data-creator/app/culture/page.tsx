'use client';

import { useState, useCallback } from 'react';
import { useCulture } from '../contexts/CultureContext';
import {
  CultureDeck,
  Step,
  StepType,
  QuizOption,
  generateDeckId,
  createTextStep,
  createImageStep,
  createQuizSingleStep,
  createQuizMultiStep,
} from '../models/Culture';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import CultureImageSection from '../components/CultureImageSection';

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

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const TextIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const QuizIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type ViewLevel = 'decks' | 'steps';

// Step type labels
const stepTypeLabels: Record<StepType, string> = {
  'text': 'Text',
  'image': 'Image',
  'quiz-single': 'Single Answer Quiz',
  'quiz-multi': 'Multiple Answer Quiz',
};

// Step type icons
const stepTypeIcons: Record<StepType, React.ReactNode> = {
  'text': <TextIcon />,
  'image': <ImageIcon />,
  'quiz-single': <QuizIcon />,
  'quiz-multi': <QuizIcon />,
};

export default function CulturePage() {
  const {
    decks,
    addDeck,
    updateDeck,
    removeDeck,
    addStep,
    updateStep,
    removeStep,
    moveStepUp,
    moveStepDown,
    exportDeck,
    clearAll,
    stats,
  } = useCulture();

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('decks');
  const [selectedDeck, setSelectedDeck] = useState<CultureDeck | null>(null);

  // Modal states
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<CultureDeck | null>(null);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Form states
  const [deckForm, setDeckForm] = useState({ id: '', title: '' });
  const [stepType, setStepType] = useState<StepType>('text');
  const [textForm, setTextForm] = useState({ header: '', text: '' });
  const [imageForm, setImageForm] = useState({ src: '', caption: '' });
  const [quizForm, setQuizForm] = useState({
    question: '',
    options: [
      { label: '', correct: false },
      { label: '', correct: false },
    ] as QuizOption[],
  });

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Navigation handlers
  const navigateToDeck = (deck: CultureDeck) => {
    setSelectedDeck(deck);
    setViewLevel('steps');
  };

  const navigateBack = () => {
    setSelectedDeck(null);
    setViewLevel('decks');
  };

  // Keep selected data in sync
  const currentDeck = selectedDeck
    ? decks.find(d => d.id === selectedDeck.id) || null
    : null;

  // Auto-generate ID from title
  const handleTitleChange = (title: string) => {
    const id = generateDeckId(title);
    setDeckForm({ ...deckForm, title, id });
  };

  // Deck handlers
  const openDeckModal = (deck?: CultureDeck) => {
    if (deck) {
      setEditingDeck(deck);
      setDeckForm({ id: deck.id, title: deck.title });
    } else {
      setEditingDeck(null);
      setDeckForm({ id: '', title: '' });
    }
    setShowDeckModal(true);
  };

  const handleSaveDeck = () => {
    if (!deckForm.title.trim() || !deckForm.id.trim()) {
      showMessage('error', 'Please enter a deck title');
      return;
    }

    if (editingDeck) {
      updateDeck(editingDeck.id, deckForm.title);
      showMessage('success', 'Deck updated!');
    } else {
      const result = addDeck(deckForm.id, deckForm.title);
      if (result) {
        showMessage('success', 'Deck added!');
      } else {
        showMessage('error', 'Deck ID already exists');
        return;
      }
    }

    setShowDeckModal(false);
    setDeckForm({ id: '', title: '' });
    setEditingDeck(null);
  };

  const handleDeleteDeck = (deck: CultureDeck) => {
    if (confirm(`Delete "${deck.title}" and all its steps?`)) {
      removeDeck(deck.id);
      showMessage('success', 'Deck deleted!');
    }
  };

  const handleDownloadDeck = (deck: CultureDeck) => {
    const json = exportDeck(deck.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', `Downloaded ${deck.id}.json`);
    }
  };

  // Step handlers
  const openStepModal = (index?: number) => {
    if (index !== undefined && currentDeck) {
      const step = currentDeck.steps[index];
      setEditingStepIndex(index);
      setStepType(step.type);

      if (step.type === 'text') {
        setTextForm({ header: step.header || '', text: step.text });
      } else if (step.type === 'image') {
        setImageForm({ src: step.src, caption: step.caption || '' });
      } else if (step.type === 'quiz-single' || step.type === 'quiz-multi') {
        setQuizForm({
          question: step.question,
          options: [...step.options],
        });
      }
    } else {
      setEditingStepIndex(null);
      setStepType('text');
      setTextForm({ header: '', text: '' });
      setImageForm({ src: '', caption: '' });
      setQuizForm({
        question: '',
        options: [
          { label: '', correct: false },
          { label: '', correct: false },
        ],
      });
    }
    setShowStepModal(true);
  };

  const handleSaveStep = () => {
    if (!currentDeck) return;

    let step: Step;

    if (stepType === 'text') {
      if (!textForm.text.trim()) {
        showMessage('error', 'Please enter text content');
        return;
      }
      step = createTextStep(textForm.text, textForm.header || undefined);
    } else if (stepType === 'image') {
      if (!imageForm.src.trim()) {
        showMessage('error', 'Please enter image filename');
        return;
      }
      step = createImageStep(imageForm.src, imageForm.caption || undefined);
    } else if (stepType === 'quiz-single' || stepType === 'quiz-multi') {
      if (!quizForm.question.trim()) {
        showMessage('error', 'Please enter a question');
        return;
      }
      const validOptions = quizForm.options.filter(o => o.label.trim());
      if (validOptions.length < 2) {
        showMessage('error', 'Please enter at least 2 options');
        return;
      }
      if (!validOptions.some(o => o.correct)) {
        showMessage('error', 'Please mark at least one correct answer');
        return;
      }

      if (stepType === 'quiz-single') {
        step = createQuizSingleStep(quizForm.question, validOptions);
      } else {
        step = createQuizMultiStep(quizForm.question, validOptions);
      }
    } else {
      return;
    }

    if (editingStepIndex !== null) {
      updateStep(currentDeck.id, editingStepIndex, step);
      showMessage('success', 'Step updated!');
    } else {
      addStep(currentDeck.id, step);
      showMessage('success', 'Step added!');
    }

    setShowStepModal(false);
    resetStepForms();
  };

  const resetStepForms = () => {
    setTextForm({ header: '', text: '' });
    setImageForm({ src: '', caption: '' });
    setQuizForm({
      question: '',
      options: [
        { label: '', correct: false },
        { label: '', correct: false },
      ],
    });
    setEditingStepIndex(null);
  };

  const handleDeleteStep = (index: number) => {
    if (!currentDeck) return;
    removeStep(currentDeck.id, index);
    showMessage('success', 'Step deleted!');
  };

  const handleMoveStepUp = (index: number) => {
    if (!currentDeck) return;
    moveStepUp(currentDeck.id, index);
  };

  const handleMoveStepDown = (index: number) => {
    if (!currentDeck) return;
    moveStepDown(currentDeck.id, index);
  };

  // Quiz option handlers
  const addQuizOption = () => {
    setQuizForm({
      ...quizForm,
      options: [...quizForm.options, { label: '', correct: false }],
    });
  };

  const removeQuizOption = (index: number) => {
    if (quizForm.options.length <= 2) return;
    setQuizForm({
      ...quizForm,
      options: quizForm.options.filter((_, i) => i !== index),
    });
  };

  const updateQuizOption = (index: number, updates: Partial<QuizOption>) => {
    const newOptions = [...quizForm.options];
    newOptions[index] = { ...newOptions[index], ...updates };

    // For single answer quiz, uncheck others when one is checked
    if (stepType === 'quiz-single' && updates.correct === true) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.correct = false;
      });
    }

    setQuizForm({ ...quizForm, options: newOptions });
  };

  // Generate unique step ID for image staging
  const getStepImageId = useCallback((deckId: string, stepIndex: number) => {
    return `culture-${deckId}-step-${stepIndex}`;
  }, []);

  // Render step preview
  const renderStepPreview = (step: Step, index: number) => {
    return (
      <div
        key={index}
        className="bg-[var(--color-bg-secondary)] rounded-xl p-4 shadow-sm border border-[var(--color-border)] group"
      >
        <div className="flex items-start gap-4">
          {/* Step number and icon */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-[var(--color-text-muted)]">#{index + 1}</span>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step.type === 'text' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
              step.type === 'image' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
              'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            }`}>
              {stepTypeIcons[step.type]}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              {stepTypeLabels[step.type]}
            </span>

            {step.type === 'text' && (
              <div className="mt-1">
                {step.header && (
                  <p className="font-semibold text-[var(--color-text)]">{step.header}</p>
                )}
                <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                  {step.text}
                </p>
              </div>
            )}

            {step.type === 'image' && (
              <div className="mt-1">
                <p className="text-sm font-medium text-[var(--color-text)]">{step.src}</p>
                {step.caption && (
                  <p className="text-sm text-[var(--color-text-muted)]">{step.caption}</p>
                )}
              </div>
            )}

            {(step.type === 'quiz-single' || step.type === 'quiz-multi') && (
              <div className="mt-1">
                <p className="text-sm font-medium text-[var(--color-text)]">{step.question}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {step.options.length} options, {step.options.filter(o => o.correct).length} correct
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleMoveStepUp(index)}
              disabled={index === 0}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            >
              <ChevronUpIcon />
            </button>
            <button
              onClick={() => handleMoveStepDown(index)}
              disabled={index === (currentDeck?.steps.length || 0) - 1}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            >
              <ChevronDownIcon />
            </button>
            <button
              onClick={() => openStepModal(index)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => handleDeleteStep(index)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          {viewLevel !== 'decks' && (
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
              <h1 className="text-3xl font-bold text-[var(--color-text)]">
                {viewLevel === 'decks' && 'Culture'}
                {viewLevel === 'steps' && currentDeck?.title}
              </h1>
              <p className="text-[var(--color-text-muted)] mt-1">
                {viewLevel === 'decks' && `${stats.decks} decks, ${stats.steps} steps`}
                {viewLevel === 'steps' && `${currentDeck?.steps.length || 0} steps`}
              </p>
            </div>

            {viewLevel === 'decks' && (
              <div className="flex gap-2">
                <Button onClick={() => openDeckModal()} leftIcon={<PlusIcon />}>
                  Add Deck
                </Button>
                {decks.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => confirm('Clear all culture decks?') && clearAll()}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            )}
            {viewLevel === 'steps' && (
              <div className="flex gap-2">
                {currentDeck && (
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadDeck(currentDeck)}
                    leftIcon={<DownloadIcon />}
                  >
                    Download JSON
                  </Button>
                )}
                <Button onClick={() => openStepModal()} leftIcon={<PlusIcon />}>
                  Add Step
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg animate-slideDown ${
              message.type === 'success'
                ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Decks View */}
        {viewLevel === 'decks' && (
          <>
            {decks.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <BookIcon />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                    No culture decks yet
                  </h3>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Create decks to organize cultural content with text, images, and quizzes
                  </p>
                  <Button onClick={() => openDeckModal()} leftIcon={<PlusIcon />}>
                    Add Your First Deck
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    onClick={() => navigateToDeck(deck)}
                    className="bg-[var(--color-bg-secondary)] rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-[var(--color-border)] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
                        <BookIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--color-text)]">
                          {deck.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          ID: {deck.id} | {deck.steps.length} step{deck.steps.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadDeck(deck); }}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors opacity-0 group-hover:opacity-100"
                          title="Download JSON"
                        >
                          <DownloadIcon />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeckModal(deck); }}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck); }}
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

        {/* Steps View */}
        {viewLevel === 'steps' && currentDeck && (
          <>
            {currentDeck.steps.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                    No steps yet
                  </h3>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Add text, images, and quizzes to this deck
                  </p>
                  <Button onClick={() => openStepModal()} leftIcon={<PlusIcon />}>
                    Add First Step
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {currentDeck.steps.map((step, index) => renderStepPreview(step, index))}
              </div>
            )}
          </>
        )}

        {/* Deck Modal */}
        <Modal
          isOpen={showDeckModal}
          onClose={() => { setShowDeckModal(false); setEditingDeck(null); }}
          title={editingDeck ? 'Edit Deck' : 'Add Deck'}
          size="md"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => setShowDeckModal(false)} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleSaveDeck} fullWidth>
                {editingDeck ? 'Save Changes' : 'Add Deck'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Title *"
              value={deckForm.title}
              onChange={(e) => handleTitleChange((e.target as HTMLInputElement).value)}
              placeholder="Dzardzongke: Language & Region"
            />
            <Input
              label="ID *"
              value={deckForm.id}
              onChange={(e) => setDeckForm({ ...deckForm, id: (e.target as HTMLInputElement).value })}
              placeholder="deck-1"
              disabled={!!editingDeck}
            />
          </div>
        </Modal>

        {/* Step Modal */}
        <Modal
          isOpen={showStepModal}
          onClose={() => { setShowStepModal(false); resetStepForms(); }}
          title={editingStepIndex !== null ? 'Edit Step' : 'Add Step'}
          size="lg"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => { setShowStepModal(false); resetStepForms(); }} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleSaveStep} fullWidth>
                {editingStepIndex !== null ? 'Save Changes' : 'Add Step'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Step Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Step Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['text', 'image', 'quiz-single', 'quiz-multi'] as StepType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setStepType(type)}
                    className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                      stepType === type
                        ? 'bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary)]'
                        : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stepType === type
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}>
                      {stepTypeIcons[type]}
                    </div>
                    <span className="font-medium text-sm">{stepTypeLabels[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Step Form */}
            {stepType === 'text' && (
              <>
                <Input
                  label="Header (optional)"
                  value={textForm.header}
                  onChange={(e) => setTextForm({ ...textForm, header: (e.target as HTMLInputElement).value })}
                  placeholder="Part a"
                />
                <Input
                  label="Text *"
                  multiline
                  rows={4}
                  value={textForm.text}
                  onChange={(e) => setTextForm({ ...textForm, text: (e.target as HTMLTextAreaElement).value })}
                  placeholder="Enter the text content..."
                />
              </>
            )}

            {/* Image Step Form */}
            {stepType === 'image' && currentDeck && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Image *
                  </label>
                  <CultureImageSection
                    stepId={getStepImageId(currentDeck.id, editingStepIndex ?? currentDeck.steps.length)}
                    imageFilename={imageForm.src}
                    onImageChange={(filename) => setImageForm({ ...imageForm, src: filename })}
                  />
                </div>
                <Input
                  label="Caption (optional)"
                  value={imageForm.caption}
                  onChange={(e) => setImageForm({ ...imageForm, caption: (e.target as HTMLInputElement).value })}
                  placeholder="Part of the Muktinath Valley..."
                />
              </>
            )}

            {/* Quiz Step Form */}
            {(stepType === 'quiz-single' || stepType === 'quiz-multi') && (
              <>
                <Input
                  label="Question *"
                  multiline
                  rows={2}
                  value={quizForm.question}
                  onChange={(e) => setQuizForm({ ...quizForm, question: (e.target as HTMLTextAreaElement).value })}
                  placeholder="What does the name of the town Jomsom mean?"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Options * {stepType === 'quiz-multi' && '(select all correct answers)'}
                  </label>
                  {quizForm.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type={stepType === 'quiz-single' ? 'radio' : 'checkbox'}
                        checked={option.correct}
                        onChange={(e) => updateQuizOption(index, { correct: e.target.checked })}
                        className="w-4 h-4 text-[var(--color-primary)]"
                        name="quiz-correct"
                      />
                      <Input
                        value={option.label}
                        onChange={(e) => updateQuizOption(index, { label: (e.target as HTMLInputElement).value })}
                        placeholder={`Option ${index + 1}`}
                      />
                      {quizForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeQuizOption(index)}
                          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addQuizOption}
                    leftIcon={<PlusIcon />}
                  >
                    Add Option
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

      </div>
    </div>
  );
}
