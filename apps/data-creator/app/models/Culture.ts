// Step types for culture decks
export type StepType = 'text' | 'image' | 'quiz-single' | 'quiz-multi';

// Quiz option
export interface QuizOption {
  label: string;
  correct: boolean;
}

// Base step interface
export interface BaseStep {
  type: StepType;
}

// Text step
export interface TextStep extends BaseStep {
  type: 'text';
  header?: string;
  text: string;
}

// Image step
export interface ImageStep extends BaseStep {
  type: 'image';
  src: string;
  caption?: string;
}

// Quiz single step (single answer)
export interface QuizSingleStep extends BaseStep {
  type: 'quiz-single';
  question: string;
  options: QuizOption[];
}

// Quiz multi step (multiple answers)
export interface QuizMultiStep extends BaseStep {
  type: 'quiz-multi';
  question: string;
  options: QuizOption[];
}

// Union type for all steps
export type Step = TextStep | ImageStep | QuizSingleStep | QuizMultiStep;

// Culture deck
export interface CultureDeck {
  id: string;
  title: string;
  steps: Step[];
}

// Helper functions
export function createTextStep(text: string, header?: string): TextStep {
  return {
    type: 'text',
    text,
    ...(header && { header }),
  };
}

export function createImageStep(src: string, caption?: string): ImageStep {
  return {
    type: 'image',
    src,
    ...(caption && { caption }),
  };
}

export function createQuizSingleStep(question: string, options: QuizOption[]): QuizSingleStep {
  return {
    type: 'quiz-single',
    question,
    options,
  };
}

export function createQuizMultiStep(question: string, options: QuizOption[]): QuizMultiStep {
  return {
    type: 'quiz-multi',
    question,
    options,
  };
}

export function createCultureDeck(id: string, title: string, steps: Step[] = []): CultureDeck {
  return {
    id,
    title,
    steps,
  };
}

// Generate ID from title
export function generateDeckId(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'deck';
}

// Validate deck
export function isDeckValid(deck: CultureDeck): boolean {
  return deck.id.trim() !== '' && deck.title.trim() !== '' && deck.steps.length > 0;
}

// Convert deck to JSON string
export function deckToJSON(deck: CultureDeck, pretty: boolean = true): string {
  return JSON.stringify(deck, null, pretty ? 2 : 0);
}

// Parse deck from JSON
export function deckFromJSON(json: string): CultureDeck | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.id && parsed.title && Array.isArray(parsed.steps)) {
      return parsed as CultureDeck;
    }
    return null;
  } catch {
    return null;
  }
}

// Culture data manager
export class CultureDataManager {
  decks: CultureDeck[];

  constructor(decks: CultureDeck[] = []) {
    this.decks = decks;
  }

  // Add a new deck
  addDeck(deck: CultureDeck): boolean {
    if (this.decks.some(d => d.id === deck.id)) {
      return false;
    }
    this.decks.push(deck);
    return true;
  }

  // Update deck
  updateDeck(id: string, updates: Partial<Omit<CultureDeck, 'id'>>): boolean {
    const index = this.decks.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.decks[index] = { ...this.decks[index], ...updates };
    return true;
  }

  // Remove deck
  removeDeck(id: string): boolean {
    const initialLength = this.decks.length;
    this.decks = this.decks.filter(d => d.id !== id);
    return this.decks.length < initialLength;
  }

  // Get deck by id
  getDeck(id: string): CultureDeck | undefined {
    return this.decks.find(d => d.id === id);
  }

  // Add step to deck
  addStep(deckId: string, step: Step): boolean {
    const deck = this.getDeck(deckId);
    if (!deck) return false;
    deck.steps.push(step);
    return true;
  }

  // Update step in deck
  updateStep(deckId: string, stepIndex: number, step: Step): boolean {
    const deck = this.getDeck(deckId);
    if (!deck || stepIndex < 0 || stepIndex >= deck.steps.length) return false;
    deck.steps[stepIndex] = step;
    return true;
  }

  // Remove step from deck
  removeStep(deckId: string, stepIndex: number): boolean {
    const deck = this.getDeck(deckId);
    if (!deck || stepIndex < 0 || stepIndex >= deck.steps.length) return false;
    deck.steps.splice(stepIndex, 1);
    return true;
  }

  // Move step up
  moveStepUp(deckId: string, stepIndex: number): boolean {
    const deck = this.getDeck(deckId);
    if (!deck || stepIndex <= 0 || stepIndex >= deck.steps.length) return false;
    [deck.steps[stepIndex - 1], deck.steps[stepIndex]] = [deck.steps[stepIndex], deck.steps[stepIndex - 1]];
    return true;
  }

  // Move step down
  moveStepDown(deckId: string, stepIndex: number): boolean {
    const deck = this.getDeck(deckId);
    if (!deck || stepIndex < 0 || stepIndex >= deck.steps.length - 1) return false;
    [deck.steps[stepIndex], deck.steps[stepIndex + 1]] = [deck.steps[stepIndex + 1], deck.steps[stepIndex]];
    return true;
  }

  // Export single deck to JSON
  exportDeck(id: string): string | null {
    const deck = this.getDeck(id);
    if (!deck) return null;
    return deckToJSON(deck);
  }

  // Export all decks
  exportAll(): string {
    return JSON.stringify({ decks: this.decks }, null, 2);
  }

  // Import decks from JSON
  importFromJSON(json: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(json);

      // Check if it's a single deck
      if (parsed.id && parsed.title && Array.isArray(parsed.steps)) {
        if (this.addDeck(parsed)) {
          return { success: true, message: `Imported deck: ${parsed.title}` };
        }
        return { success: false, message: `Deck with ID "${parsed.id}" already exists` };
      }

      // Check if it's multiple decks
      if (Array.isArray(parsed.decks)) {
        let imported = 0;
        for (const deck of parsed.decks) {
          if (deck.id && deck.title && Array.isArray(deck.steps)) {
            if (this.addDeck(deck)) imported++;
          }
        }
        return { success: true, message: `Imported ${imported} deck(s)` };
      }

      return { success: false, message: 'Invalid format. Expected a culture deck or { decks: [...] }' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }

  // Get stats
  getStats(): { decks: number; steps: number } {
    return {
      decks: this.decks.length,
      steps: this.decks.reduce((sum, deck) => sum + deck.steps.length, 0),
    };
  }

  // Clone for immutable updates
  clone(): CultureDataManager {
    return new CultureDataManager(JSON.parse(JSON.stringify(this.decks)));
  }
}
