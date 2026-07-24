'use client';

import { useState } from 'react';
import { useDecks, DeckMeta } from '../contexts/DecksContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CardsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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

interface DeckCardProps {
  deck: DeckMeta;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DeckCard({ deck, onSelect, onEdit, onDelete }: DeckCardProps) {
  const formattedDate = new Date(deck.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card
      variant="default"
      padding="none"
      className="overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[var(--color-border-hover)]"
      hover
    >
      <div onClick={onSelect} className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-text)]">
              <CardsIcon />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text)] text-lg leading-tight">
                {deck.title}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Updated {formattedDate}
              </p>
            </div>
          </div>
          <Badge variant={deck.cardCount > 0 ? 'primary' : 'default'} size="sm">
            {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
          </Badge>
        </div>

        {/* Description */}
        {deck.description ? (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
            {deck.description}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)] italic mb-4">
            No description
          </p>
        )}

        {/* Click to open hint */}
        <p className="text-xs text-[var(--color-text-muted)]">
          Click to open deck
        </p>
      </div>

      {/* Actions */}
      <div className="flex border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <EditIcon />
          Edit
        </button>
        <div className="w-px bg-[var(--color-border)]" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors"
        >
          <TrashIcon />
          Delete
        </button>
      </div>
    </Card>
  );
}

function DeckCardSkeleton() {
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <Skeleton className="h-3 w-20" />
      </div>
    </Card>
  );
}

function EmptyState({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <Card variant="default" padding="lg" className="text-center">
      <div className="py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          No decks yet
        </h3>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
          Create your first flashcard deck to start learning. Organize your vocabulary, phrases, and concepts into separate decks.
        </p>
        <Button onClick={onCreateDeck} leftIcon={<PlusIcon />} size="lg">
          Create Your First Deck
        </Button>
      </div>
    </Card>
  );
}

export default function DecksDashboard() {
  const { decks, isLoading, createDeck, updateDeckMeta, deleteDeck, selectDeck } = useDecks();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckMeta | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<DeckMeta | null>(null);

  // Form state
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetForm = () => {
    setDeckTitle('');
    setDeckDescription('');
    setFormError('');
  };

  const handleCreateDeck = () => {
    if (!deckTitle.trim()) {
      setFormError('Please enter a deck title');
      return;
    }

    createDeck(deckTitle.trim(), deckDescription.trim());
    setShowCreateModal(false);
    resetForm();
    showMessage('success', 'Deck created successfully!');
  };

  const handleEditDeck = () => {
    if (!editingDeck) return;

    if (!deckTitle.trim()) {
      setFormError('Please enter a deck title');
      return;
    }

    updateDeckMeta(editingDeck.id, deckTitle.trim(), deckDescription.trim());
    setEditingDeck(null);
    resetForm();
    showMessage('success', 'Deck updated successfully!');
  };

  const handleDeleteDeck = () => {
    if (!deletingDeck) return;

    deleteDeck(deletingDeck.id);
    setDeletingDeck(null);
    showMessage('success', 'Deck deleted successfully!');
  };

  const openEditModal = (deck: DeckMeta) => {
    setEditingDeck(deck);
    setDeckTitle(deck.title);
    setDeckDescription(deck.description);
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">My Decks</h2>
          <p className="text-[var(--color-text-muted)] mt-1">
            {decks.length} {decks.length === 1 ? 'deck' : 'decks'} •{' '}
            {decks.reduce((sum, d) => sum + d.cardCount, 0)} total cards
          </p>
        </div>
        {decks.length > 0 && (
          <Button onClick={openCreateModal} leftIcon={<PlusIcon />} size="lg">
            New Deck
          </Button>
        )}
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

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <DeckCardSkeleton key={i} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <EmptyState onCreateDeck={openCreateModal} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onSelect={() => selectDeck(deck.id)}
              onEdit={() => openEditModal(deck)}
              onDelete={() => setDeletingDeck(deck)}
            />
          ))}
        </div>
      )}

      {/* Create Deck Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Deck"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDeck} fullWidth>
              Create Deck
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Deck Title *"
            value={deckTitle}
            onChange={(e) => {
              setDeckTitle((e.target as HTMLInputElement).value);
              setFormError('');
            }}
            placeholder="e.g., Basic Vocabulary"
            error={formError}
            autoFocus
          />
          <Input
            label="Description"
            value={deckDescription}
            onChange={(e) => setDeckDescription((e.target as HTMLTextAreaElement).value)}
            placeholder="What will you learn with this deck?"
            multiline
            rows={3}
          />
        </div>
      </Modal>

      {/* Edit Deck Modal */}
      <Modal
        isOpen={!!editingDeck}
        onClose={() => {
          setEditingDeck(null);
          resetForm();
        }}
        title="Edit Deck"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingDeck(null);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button onClick={handleEditDeck} fullWidth>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Deck Title *"
            value={deckTitle}
            onChange={(e) => {
              setDeckTitle((e.target as HTMLInputElement).value);
              setFormError('');
            }}
            placeholder="e.g., Basic Vocabulary"
            error={formError}
          />
          <Input
            label="Description"
            value={deckDescription}
            onChange={(e) => setDeckDescription((e.target as HTMLTextAreaElement).value)}
            placeholder="What will you learn with this deck?"
            multiline
            rows={3}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDeck}
        onClose={() => setDeletingDeck(null)}
        title="Delete Deck"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => setDeletingDeck(null)} fullWidth>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDeck} fullWidth>
              Delete Deck
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-danger-light)] flex items-center justify-center text-[var(--color-danger)]">
            <TrashIcon />
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong className="text-[var(--color-text)]">&ldquo;{deletingDeck?.title}&rdquo;</strong>?
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            This will permanently delete all {deletingDeck?.cardCount} cards in this deck. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
