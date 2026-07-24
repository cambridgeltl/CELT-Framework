'use client';

import { useState, useCallback } from 'react';
import { useDecks } from '../contexts/DecksContext';
import { Card as FlashCard } from '../models/Deck';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import ImageSection from './ImageSection';
import { useImageStaging } from '../contexts/ImageStagingContext';

type ViewMode = 'grid' | 'list';

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

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
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

// Flashcard component with flip animation - Premium Design
function FlashCardComponent({
  card,
  onEdit,
  onDelete,
  compact = false,
  imageUrl,
}: {
  card: FlashCard;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  imageUrl?: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`perspective cursor-pointer group ${compact ? 'h-44' : imageUrl ? 'h-80' : 'h-64'}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full transition-all duration-700 ease-out preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          {imageUrl ? (
            /* Image card - Full bleed immersive design */
            <div className="h-full rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] transition-all duration-300 backface-hidden">
              {/* Full-bleed image background */}
              <div className="absolute inset-0">
                <img
                  src={imageUrl}
                  alt={card.front}
                  className="w-full h-full object-cover"
                />
                {/* Multi-layer gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-900/30" />
              </div>

              {/* Content overlay */}
              <div className="relative h-full flex flex-col p-4">
                {/* Top section with label */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-white/90 rounded-lg backdrop-blur-md border border-white/10">
                    Front
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                    <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom text section with glassmorphism */}
                <div className="mt-auto">
                  <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                    <p className={`text-center font-semibold text-white leading-snug tracking-tight drop-shadow-sm ${
                      compact ? 'text-lg' : 'text-xl'
                    }`}>
                      {card.front}
                    </p>
                    {!compact && (
                      <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-white/10">
                        <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5 5 5-5" />
                        </svg>
                        <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
                          Tap to reveal answer
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Text-only card - Clean minimal design */
            <div className="h-full bg-[var(--color-card)] rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.25)] transition-shadow duration-300 border border-[var(--color-card-border)] backface-hidden">
              <div className="relative flex-1 flex flex-col p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-md">
                    Front
                  </span>
                  <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center px-2">
                  <p className={`text-center font-medium text-[var(--color-text)] leading-relaxed tracking-tight ${
                    compact ? 'text-lg' : 'text-2xl'
                  }`}>
                    {card.front}
                  </p>
                </div>
                {!compact && (
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide">
                      Tap to reveal
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Back - Eye-friendly muted design */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[var(--color-card-answer-from)] via-[var(--color-card-answer-via)] to-[var(--color-card-answer-to)] backface-hidden">
            <div className="relative flex-1 flex flex-col p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-[var(--color-card-answer-text)] rounded-md backdrop-blur-sm">
                  Answer
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-2">
                <p className={`text-center font-medium text-[var(--color-card-answer-text)] leading-relaxed tracking-tight ${compact ? 'text-lg' : 'text-2xl'}`}>
                  {card.back}
                </p>
                {card.notes && !compact && (
                  <p className="text-sm text-[var(--color-card-answer-muted)] mt-4 text-center leading-relaxed max-w-[90%] whitespace-pre-line">
                    {card.notes}
                  </p>
                )}
              </div>
              {!compact && (
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <span className="text-[11px] text-[var(--color-card-answer-muted)] font-medium tracking-wide">
                    Tap to flip back
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium floating actions */}
      {(onEdit || onDelete) && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 translate-y-1 group-hover:translate-y-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
            >
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeckView() {
  const { currentDeck, deselectDeck, addCard, updateCard, removeCard } = useDecks();
  const { getStagedForCard } = useImageStaging();

  // Card form state
  const [cardForm, setCardForm] = useState({
    id: '',
    front: '',
    back: '',
    notes: '',
    image: '',
  });

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);
  const [deletingCard, setDeletingCard] = useState<FlashCard | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentDeck) {
    return null;
  }

  const cards = currentDeck.getAllCards();
  const cardCount = currentDeck.getCardCount();

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetCardForm = () => {
    setCardForm({ id: '', front: '', back: '', notes: '', image: '' });
  };

  // Add card
  const handleAddCard = () => {
    // Get staged image filename if available
    const stagedImage = getStagedForCard(cardForm.id);
    const imageFilename = stagedImage ? stagedImage.targetFilename : cardForm.image;

    const newCard = new FlashCard(
      cardForm.id,
      cardForm.front,
      cardForm.back,
      cardForm.notes,
      imageFilename
    );

    if (!newCard.isValid()) {
      showMessage('error', 'Please fill in Card ID, Front, and Back fields');
      return;
    }

    if (!addCard(newCard)) {
      showMessage('error', 'Card ID already exists in this deck');
      return;
    }

    resetCardForm();
    setShowAddCardModal(false);
    showMessage('success', 'Card added successfully!');
  };

  // Edit card
  const handleEditCard = () => {
    if (!editingCard) return;

    // Get staged image filename if available
    const stagedImage = getStagedForCard(cardForm.id);
    const imageFilename = stagedImage ? stagedImage.targetFilename : cardForm.image;

    const updatedCard = new FlashCard(
      cardForm.id,
      cardForm.front,
      cardForm.back,
      cardForm.notes,
      imageFilename
    );

    if (!updatedCard.isValid()) {
      showMessage('error', 'Please fill in Card ID, Front, and Back fields');
      return;
    }

    if (!updateCard(editingCard.id, updatedCard)) {
      showMessage('error', 'Failed to update card');
      return;
    }

    setEditingCard(null);
    resetCardForm();
    showMessage('success', 'Card updated successfully!');
  };

  // Open edit modal
  const openEditModal = (card: FlashCard) => {
    setEditingCard(card);
    setCardForm({
      id: card.id,
      front: card.front,
      back: card.back,
      notes: card.notes,
      image: card.image,
    });
  };

  // Delete card
  const handleDeleteCard = () => {
    if (!deletingCard) return;

    removeCard(deletingCard.id);
    setDeletingCard(null);
    showMessage('success', 'Card deleted!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <button
          onClick={deselectDeck}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors w-fit"
        >
          <BackIcon />
          <span>Back to All Decks</span>
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-text)]">
              {currentDeck.title}
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              {currentDeck.description && ` • ${currentDeck.description}`}
            </p>
          </div>
          <Button onClick={() => setShowAddCardModal(true)} leftIcon={<PlusIcon />}>
            Add Card
          </Button>
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

      {/* Stats & Actions Bar */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{cardCount}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Cards</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="flex border border-[var(--color-border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)]'}`}
                title="Grid view"
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)]'}`}
                title="List view"
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Cards Display */}
      {cardCount === 0 ? (
        <Card variant="default" padding="lg">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              No cards yet
            </h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              Start building your deck by adding flashcards
            </p>
            <Button onClick={() => setShowAddCardModal(true)} leftIcon={<PlusIcon />}>
              Add Your First Card
            </Button>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => {
            const stagedImage = getStagedForCard(card.id);
            const imageUrl = stagedImage?.url;
            return (
              <FlashCardComponent
                key={card.id}
                card={card}
                onEdit={() => openEditModal(card)}
                onDelete={() => setDeletingCard(card)}
                imageUrl={imageUrl}
              />
            );
          })}
        </div>
      ) : (
        <Card variant="default" padding="none">
          <div className="divide-y divide-[var(--color-border)]">
            {cards.map((card) => {
              const stagedImage = getStagedForCard(card.id);
              const imageUrl = stagedImage?.url;
              return (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  {/* Image thumbnail */}
                  {imageUrl && (
                    <div className="flex-shrink-0 w-12 h-12 mr-4 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                      <img
                        src={imageUrl}
                        alt={card.front}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-[var(--color-text)] truncate">
                        {card.front}
                      </p>
                      <span className="text-[var(--color-text-muted)]">→</span>
                      <p className="text-[var(--color-text-secondary)] truncate">
                        {card.back}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">ID: {card.id}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {imageUrl && <Badge variant="info" size="sm">Image</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(card)}>
                      <EditIcon />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingCard(card)}>
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add/Edit Card Modal */}
      <Modal
        isOpen={showAddCardModal || !!editingCard}
        onClose={() => {
          setShowAddCardModal(false);
          setEditingCard(null);
          resetCardForm();
        }}
        title={editingCard ? 'Edit Card' : 'Add Card'}
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddCardModal(false);
                setEditingCard(null);
                resetCardForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button onClick={editingCard ? handleEditCard : handleAddCard} fullWidth>
              {editingCard ? 'Save Changes' : 'Add Card'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Card ID *"
            value={cardForm.id}
            onChange={(e) => setCardForm({ ...cardForm, id: (e.target as HTMLInputElement).value })}
            placeholder="unique-card-id"
          />
          <Input
            label="Front (Question/Term) *"
            value={cardForm.front}
            onChange={(e) => setCardForm({ ...cardForm, front: (e.target as HTMLInputElement).value })}
            placeholder="The word or phrase to learn"
          />
          <Input
            label="Back (Answer/Translation) *"
            value={cardForm.back}
            onChange={(e) => setCardForm({ ...cardForm, back: (e.target as HTMLInputElement).value })}
            placeholder="The translation or answer"
          />
          <Input
            label="Notes"
            multiline
            rows={3}
            value={cardForm.notes}
            onChange={(e) => setCardForm({ ...cardForm, notes: (e.target as HTMLTextAreaElement).value })}
            placeholder="Additional notes, hints, or explanations..."
          />

          {/* Image Section */}
          <ImageSection
            cardId={cardForm.id}
            cardDisplay={cardForm.front || cardForm.id}
            deckId={currentDeck.id}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        title="Delete Card"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => setDeletingCard(null)} fullWidth>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCard} fullWidth>
              Delete
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <p className="text-[var(--color-text-secondary)]">
            Are you sure you want to delete the card <strong className="text-[var(--color-text)]">&ldquo;{deletingCard?.front}&rdquo;</strong>?
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
