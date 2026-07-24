// Entry class to represent a single dictionary entry
export class Entry {
  // Entry properties
  dz: string; // Dzardzongke word
  en: string; // English translation
  example: string; // Example sentence in Dzardzongke
  exampleEn: string; // Example sentence in English
  audio: string; // Audio filename

  // Constructor to create a new entry instance
  constructor(
    dz: string,
    en: string,
    example: string = "",
    exampleEn: string = "",
    audio: string = ""
  ) {
    this.dz = dz;
    this.en = en;
    this.example = example;
    this.exampleEn = exampleEn;
    this.audio = audio;
  }

  // Method to validate if entry has required fields
  isValid(): boolean {
    return typeof this.dz === 'string' && this.dz.trim() !== ""
      && typeof this.en === 'string' && this.en.trim() !== "";
  }

  // Method to convert entry to JSON object
  toJSON() {
    return {
      dz: this.dz,
      en: this.en,
      example: this.example,
      exampleEn: this.exampleEn,
    };
  }

  // Static method to create Entry from JSON object
  static fromJSON(json: any): Entry {
    return new Entry(
      json.dz || "",
      json.en || "",
      json.example || "",
      json.exampleEn || "",
      json.audio || ""
    );
  }
}

// Dictionary class to represent a collection of entries
export class Dictionary {
  // Dictionary property
  entries: Entry[];

  // Constructor to create a new dictionary instance
  constructor(entries: Entry[] = []) {
    this.entries = entries;
  }

  // Method to add an entry to the dictionary
  addEntry(entry: Entry): boolean {
    // Check if entry is valid
    if (!entry.isValid()) {
      return false;
    }

    // Check if entry already exists (same dz word)
    if (this.entries.some((e) => e.dz === entry.dz)) {
      return false;
    }

    // Add entry to dictionary
    this.entries.push(entry);
    return true;
  }

  // Method to remove an entry from the dictionary by dz word
  removeEntry(dz: string): boolean {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter((entry) => entry.dz !== dz);
    return this.entries.length < initialLength;
  }

  // Method to get an entry by dz word
  getEntry(dz: string): Entry | undefined {
    return this.entries.find((entry) => entry.dz === dz);
  }

  // Method to get all entries
  getAllEntries(): Entry[] {
    return [...this.entries];
  }

  // Method to get number of entries
  getEntryCount(): number {
    return this.entries.length;
  }

  // Method to validate if dictionary has entries
  isValid(): boolean {
    return this.entries.length > 0;
  }

  // Method to clear all entries
  clearEntries(): void {
    this.entries = [];
  }

  // Method to convert dictionary to JSON object
  toJSON() {
    return {
      entries: this.entries.map((entry) => entry.toJSON()),
    };
  }

  // Method to get JSON string with formatting
  toJSONString(pretty: boolean = true): string {
    return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0);
  }

  // Static method to create Dictionary from JSON object
  static fromJSON(json: any): Dictionary {
    const entries = (json.entries || []).map((entryJson: any) =>
      Entry.fromJSON(entryJson)
    );
    return new Dictionary(entries);
  }

  // Method to download dictionary as JSON file
  downloadJSON(fileName: string = "dictionary.dict.json"): void {
    if (!this.isValid()) {
      throw new Error(
        "Dictionary is not valid. Please add at least one entry."
      );
    }

    const jsonString = this.toJSONString();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
