'use client';

import { useState, useMemo, useCallback } from 'react';
import { Entry } from '../models/Dictionary';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import AudioSection from '../components/AudioSection';
import AudioReviewDashboard from '../components/AudioReviewDashboard';
import { useAudioStaging } from '../contexts/AudioStagingContext';
import { useDictionary } from '../contexts/DictionaryContext';

type SortOption = 'dz-asc' | 'dz-desc' | 'en-asc' | 'en-desc' | 'recent';

const sortOptions = [
  { value: 'dz-asc', label: 'Dzardzongke (A-Z)' },
  { value: 'dz-desc', label: 'Dzardzongke (Z-A)' },
  { value: 'en-asc', label: 'English (A-Z)' },
  { value: 'en-desc', label: 'English (Z-A)' },
  { value: 'recent', label: 'Recently Added' },
];

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

export default function DictionaryPage() {
  // Dictionary from context (persisted across navigation)
  const {
    entries,
    addEntry,
    updateEntry,
    removeEntry,
    getEntryCount,
    toJSONString,
    downloadJSON,
    clearEntries,
  } = useDictionary();

  // Audio staging
  const { stagedFiles, getStagedForWord } = useAudioStaging();

  // Form state
  const [formData, setFormData] = useState({
    dz: '',
    en: '',
    example: '',
    exampleEn: '',
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);
  const [showAudioReview, setShowAudioReview] = useState(false);
  const [fileName, setFileName] = useState('dictionary.dict.json');
  const [showJsonPreviewModal, setShowJsonPreviewModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.dz.toLowerCase().includes(query) ||
          entry.en.toLowerCase().includes(query) ||
          entry.example?.toLowerCase().includes(query) ||
          entry.exampleEn?.toLowerCase().includes(query)
      );
    }

    // Sort entries
    switch (sortBy) {
      case 'dz-asc':
        filtered.sort((a, b) => a.dz.localeCompare(b.dz));
        break;
      case 'dz-desc':
        filtered.sort((a, b) => b.dz.localeCompare(a.dz));
        break;
      case 'en-asc':
        filtered.sort((a, b) => a.en.localeCompare(b.en));
        break;
      case 'en-desc':
        filtered.sort((a, b) => b.en.localeCompare(a.en));
        break;
      case 'recent':
      default:
        // Keep original order (most recent first)
        filtered.reverse();
        break;
    }

    return filtered;
  }, [entries, searchQuery, sortBy]);

  // Show message helper
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // Handle form input
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({ dz: '', en: '', example: '', exampleEn: '' });
  };

  // Add entry
  const handleAddEntry = () => {
    // Check if there's staged audio for this word
    const stagedAudio = getStagedForWord(formData.dz);
    const audioFilename = stagedAudio ? stagedAudio.targetFilename : '';

    const newEntry = new Entry(
      formData.dz,
      formData.en,
      formData.example,
      formData.exampleEn,
      audioFilename
    );

    if (!newEntry.isValid()) {
      showMessage('error', 'Please fill in Dzardzongke word and English translation');
      return;
    }

    // Check if entry already exists
    if (entries.some(e => e.dz === newEntry.dz)) {
      showMessage('error', 'This word already exists in the dictionary');
      return;
    }

    addEntry(newEntry);
    resetForm();
    setShowAddModal(false);
    showMessage('success', 'Entry added successfully!');
  };

  // Edit entry
  const handleEditEntry = () => {
    if (!editingEntry) return;

    // Check if there's staged audio for this word
    const stagedAudio = getStagedForWord(formData.dz);
    const audioFilename = stagedAudio ? stagedAudio.targetFilename : editingEntry.audio;

    // Create updated entry
    const updatedEntry = new Entry(
      formData.dz,
      formData.en,
      formData.example,
      formData.exampleEn,
      audioFilename
    );

    if (!updatedEntry.isValid()) {
      showMessage('error', 'Please fill in Dzardzongke word and English translation');
      return;
    }

    updateEntry(editingEntry.dz, updatedEntry);
    setEditingEntry(null);
    resetForm();
    showMessage('success', 'Entry updated successfully!');
  };

  // Open edit modal
  const openEditModal = (entry: Entry) => {
    setEditingEntry(entry);
    setFormData({
      dz: entry.dz,
      en: entry.en,
      example: entry.example,
      exampleEn: entry.exampleEn,
    });
  };

  // Delete entry
  const handleDeleteEntry = () => {
    if (!deleteEntry) return;

    removeEntry(deleteEntry.dz);
    setDeleteEntry(null);
    showMessage('success', 'Entry deleted successfully!');
  };

  // Download JSON
  const handleDownloadJson = () => {
    try {
      downloadJSON(fileName);
      showMessage('success', 'JSON file downloaded!');
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to download');
    }
  };

  // Handle audio upload completion
  const handleAudioUploadComplete = (uploadedFiles: string[]) => {
    showMessage('success', `Uploaded ${uploadedFiles.length} audio file${uploadedFiles.length === 1 ? '' : 's'} to GitHub!`);
    setShowAudioReview(false);
  };

  const entryCount = getEntryCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">Dictionary</h2>
          <p className="text-[var(--color-text-muted)] mt-1">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <div className="flex gap-3">
          {stagedFiles.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowAudioReview(true)}
              leftIcon={<MicIcon />}
            >
              Audio ({stagedFiles.length})
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowJsonPreviewModal(true)}
            leftIcon={<CodeIcon />}
            disabled={entryCount === 0}
          >
            Show JSON
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            leftIcon={<PlusIcon />}
            size="lg"
          >
            Add Entry
          </Button>
          {entryCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => confirm('Clear all dictionary entries?') && clearEntries()}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg animate-slideDown ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search and Filters */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              leftIcon={<SearchIcon />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              placeholder="Sort by..."
            />
          </div>
        </div>
      </Card>

      {/* Entries Grid */}
      {filteredEntries.length === 0 ? (
        <Card variant="default" padding="lg">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              {searchQuery ? 'No matches found' : 'No entries yet'}
            </h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Start building your dictionary by adding entries'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddModal(true)} leftIcon={<PlusIcon />}>
                Add Your First Entry
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => {
            const hasAudio = entry.audio || getStagedForWord(entry.dz);

            return (
              <Card
                key={entry.dz}
                variant="default"
                padding="none"
                className="overflow-hidden group"
                hover
              >
                <div className="p-4">
                  {/* Word Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--color-text)] truncate">
                        {entry.dz}
                      </h3>
                      <p className="text-[var(--color-primary)] font-medium">
                        {entry.en}
                      </p>
                    </div>

                    {/* Audio indicator */}
                    {hasAudio && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                        <span className="text-xs font-medium">Audio</span>
                      </div>
                    )}
                  </div>

                  {/* Examples */}
                  {entry.example && (
                    <div className="text-sm text-[var(--color-text-muted)] mb-3 space-y-1">
                      <p className="italic">&ldquo;{entry.example}&rdquo;</p>
                      {entry.exampleEn && (
                        <p className="text-[var(--color-text-muted)]">&ldquo;{entry.exampleEn}&rdquo;</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                  >
                    <EditIcon />
                    Edit
                  </button>
                  <div className="w-px bg-[var(--color-border)]" />
                  <button
                    onClick={() => setDeleteEntry(entry)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors"
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Entry Modal */}
      <Modal
        isOpen={showAddModal || !!editingEntry}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntry(null);
          resetForm();
        }}
        title={editingEntry ? 'Edit Entry' : 'Add Entry'}
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setEditingEntry(null);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={editingEntry ? handleEditEntry : handleAddEntry}
              fullWidth
            >
              {editingEntry ? 'Save Changes' : 'Add Entry'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Dzardzongke Word *"
            value={formData.dz}
            onChange={(e) => handleInputChange('dz', (e.target as HTMLInputElement).value)}
            placeholder="Enter the Dzardzongke word"
          />

          <Input
            label="English Translation *"
            value={formData.en}
            onChange={(e) => handleInputChange('en', (e.target as HTMLInputElement).value)}
            placeholder="Enter the English translation"
          />

          <Input
            label="Example Sentence (Dzardzongke)"
            multiline
            rows={2}
            value={formData.example}
            onChange={(e) => handleInputChange('example', (e.target as HTMLTextAreaElement).value)}
            placeholder="Example sentence in Dzardzongke..."
          />

          <Input
            label="Example Translation (English)"
            multiline
            rows={2}
            value={formData.exampleEn}
            onChange={(e) => handleInputChange('exampleEn', (e.target as HTMLTextAreaElement).value)}
            placeholder="Example sentence in English..."
          />

          {/* Audio Section */}
          <AudioSection
            wordId={formData.dz}
            wordDisplay={formData.dz || 'Word'}
            englishMeaning={formData.en}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        title="Delete Entry"
        description={`Are you sure you want to delete "${deleteEntry?.dz}"? This action cannot be undone.`}
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => setDeleteEntry(null)} fullWidth>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteEntry} fullWidth>
              Delete
            </Button>
          </div>
        }
      >
        <div />
      </Modal>

      {/* Audio Review Modal */}
      <Modal
        isOpen={showAudioReview}
        onClose={() => setShowAudioReview(false)}
        title="Audio Files"
        size="xl"
      >
        <AudioReviewDashboard
          audioFolder="audio"
          onUploadComplete={handleAudioUploadComplete}
          onClose={() => setShowAudioReview(false)}
        />
      </Modal>

      {/* JSON Preview Modal */}
      <Modal
        isOpen={showJsonPreviewModal}
        onClose={() => setShowJsonPreviewModal(false)}
        title="JSON Preview"
        size="xl"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setShowJsonPreviewModal(false)}
              fullWidth
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleDownloadJson();
                setShowJsonPreviewModal(false);
              }}
              leftIcon={<DownloadIcon />}
              fullWidth
            >
              Download JSON
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'} in dictionary
          </p>
          <pre className="bg-[var(--color-bg-tertiary)] text-[var(--color-text)] p-4 rounded-lg overflow-x-auto text-sm max-h-[60vh] overflow-y-auto">
            {toJSONString()}
          </pre>
        </div>
      </Modal>

    </div>
  );
}
