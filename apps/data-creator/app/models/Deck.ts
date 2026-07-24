// Card class to represent a single flashcard
export class Card {
  // Card properties
  id: string;
  front: string;
  back: string;
  notes: string;
  image: string;

  // Constructor to create a new card instance
  constructor(
    id: string,
    front: string,
    back: string,
    notes: string = "",
    image: string = ""
  ) {
    this.id = id;
    this.front = front;
    this.back = back;
    this.notes = notes;
    this.image = image;
  }

  // Method to validate if card has required fields
  isValid(): boolean {
    return this.id.trim() !== "" && this.front.trim() !== "" && this.back.trim() !== "";
  }

  // Method to convert card to JSON object
  toJSON() {
    return {
      id: this.id,
      front: this.front,
      back: this.back,
      notes: this.notes,
      image: this.image,
    };
  }

  // Static method to create Card from JSON object
  static fromJSON(json: any): Card {
    return new Card(
      json.id,
      json.front,
      json.back,
      json.notes || "",
      json.image || ""
    );
  }
}

// Deck class to represent a collection of cards
export class Deck {
  // Deck properties
  id: string;
  title: string;
  description: string;
  cards: Card[];

  // Constructor to create a new deck instance
  constructor(
    id: string = "",
    title: string = "",
    description: string = "",
    cards: Card[] = []
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.cards = cards;
  }

  // Method to add a card to the deck
  addCard(card: Card): boolean {
    // Check if card is valid
    if (!card.isValid()) {
      return false;
    }

    // Check if card ID already exists
    if (this.cards.some((c) => c.id === card.id)) {
      return false;
    }

    // Add card to deck
    this.cards.push(card);
    return true;
  }

  // Method to remove a card from the deck by ID
  removeCard(cardId: string): boolean {
    const initialLength = this.cards.length;
    this.cards = this.cards.filter((card) => card.id !== cardId);
    return this.cards.length < initialLength;
  }

  // Method to get a card by ID
  getCard(cardId: string): Card | undefined {
    return this.cards.find((card) => card.id === cardId);
  }

  // Method to get all cards
  getAllCards(): Card[] {
    return [...this.cards];
  }

  // Method to get number of cards
  getCardCount(): number {
    return this.cards.length;
  }

  // Method to validate if deck has required fields
  isValid(): boolean {
    return (
      this.id.trim() !== "" &&
      this.title.trim() !== "" &&
      this.cards.length > 0
    );
  }

  // Method to clear all cards
  clearCards(): void {
    this.cards = [];
  }

  // Method to convert deck to JSON object
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      cards: this.cards.map((card) => card.toJSON()),
    };
  }

  // Method to get JSON string with formatting
  toJSONString(pretty: boolean = true): string {
    return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0);
  }

  // Static method to create Deck from JSON object
  static fromJSON(json: any): Deck {
    const cards = (json.cards || []).map((cardJson: any) =>
      Card.fromJSON(cardJson)
    );
    return new Deck(
      json.id || "",
      json.title || "",
      json.description || "",
      cards
    );
  }

  // Method to download deck as JSON file
  downloadJSON(fileName?: string): void {
    if (!this.isValid()) {
      throw new Error("Deck is not valid. Please fill in all required fields.");
    }

    const jsonString = this.toJSONString();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || `${this.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
