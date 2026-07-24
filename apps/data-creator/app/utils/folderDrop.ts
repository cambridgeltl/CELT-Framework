/**
 * Recursively reads all files from dropped folders and files using the
 * DataTransferItem.webkitGetAsEntry() API.
 *
 * When a user drops a folder (or mixture of folders and files), the browser's
 * native dataTransfer.files only contains top-level items. This utility
 * traverses directories recursively to collect every nested file.
 */

/**
 * Read all entries from a directory reader, handling the batching behavior
 * where readEntries() may return partial results.
 */
function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(all);
          } else {
            all.push(...entries);
            readBatch(); // keep reading until empty batch
          }
        },
        reject,
      );
    };
    readBatch();
  });
}

/**
 * Convert a FileSystemFileEntry to a File object.
 */
function entryToFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

/**
 * Recursively collect all files from a FileSystemEntry tree.
 * Attaches the relative path (from drop root) as file.webkitRelativePath-like
 * property via a custom `relativePath` field on the File object.
 */
async function collectFiles(entry: FileSystemEntry, parentPath = ''): Promise<File[]> {
  if (entry.isFile) {
    const file = await entryToFile(entry as FileSystemFileEntry);
    // Attach the relative path from the dropped folder root
    const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    Object.defineProperty(file, 'relativePath', { value: relativePath, writable: false });
    return [file];
  }

  if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readAllEntries(dirReader);
    const dirPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    const nested = await Promise.all(entries.map((e) => collectFiles(e, dirPath)));
    return nested.flat();
  }

  return [];
}

/**
 * Extract all files from a drop event, recursively traversing any folders.
 * Returns a flat array of File objects regardless of folder structure.
 *
 * Falls back to dataTransfer.files if webkitGetAsEntry is not supported.
 */
export async function getFilesFromDrop(e: React.DragEvent): Promise<File[]> {
  const items = e.dataTransfer.items;

  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }

    const allFiles = await Promise.all(entries.map((entry) => collectFiles(entry)));
    return allFiles.flat();
  }

  return Array.from(e.dataTransfer.files);
}
