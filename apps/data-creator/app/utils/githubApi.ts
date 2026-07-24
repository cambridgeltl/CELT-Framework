/**
 * GitHub API Utilities
 * Helper functions for interacting with GitHub's API
 */

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  encoding?: 'base64' | 'utf-8';
  sha?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  message: string;
  url?: string;
  sha?: string;
  error?: string;
  mergeStats?: MergeStats;
}

export interface GitHubFileInfo {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

// LocalStorage keys
const STORAGE_KEYS = {
  OWNER: 'github_owner',
  REPO: 'github_repo',
  TOKEN: 'github_token',
} as const;

/**
 * Save GitHub config to localStorage
 */
export function saveGitHubConfig(config: GitHubConfig): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.OWNER, config.owner);
  localStorage.setItem(STORAGE_KEYS.REPO, config.repo);
  localStorage.setItem(STORAGE_KEYS.TOKEN, config.token);
}

/**
 * Load GitHub config from localStorage
 */
export function loadGitHubConfig(): Partial<GitHubConfig> {
  if (typeof window === 'undefined') return {};

  return {
    owner: localStorage.getItem(STORAGE_KEYS.OWNER) || undefined,
    repo: localStorage.getItem(STORAGE_KEYS.REPO) || undefined,
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) || undefined,
  };
}

/**
 * Clear GitHub config from localStorage
 */
export function clearGitHubConfig(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.OWNER);
  localStorage.removeItem(STORAGE_KEYS.REPO);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

/**
 * Check if GitHub config is complete
 */
export function isConfigComplete(config: Partial<GitHubConfig>): config is GitHubConfig {
  return !!(config.owner && config.repo && config.token);
}

/**
 * Get the SHA of an existing file (needed for updates)
 */
export async function getFileSha(
  config: GitHubConfig,
  path: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Upload a file to GitHub
 */
export async function uploadFile(
  config: GitHubConfig,
  file: GitHubFile,
  commitMessage: string = 'Upload file via Dzardzongke app'
): Promise<UploadResult> {
  try {
    // Get existing file SHA if it exists (for updates)
    const existingSha = await getFileSha(config, file.path);

    const body: Record<string, string> = {
      message: commitMessage,
      content: file.encoding === 'base64' ? file.content : btoa(unescape(encodeURIComponent(file.content))),
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: existingSha ? 'File updated successfully' : 'File uploaded successfully',
        url: data.content?.html_url,
        sha: data.content?.sha,
      };
    }

    return {
      success: false,
      message: 'Upload failed',
      error: data.message || 'Unknown error',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload a binary file to GitHub
 */
export async function uploadBinaryFile(
  config: GitHubConfig,
  file: File,
  path: string,
  commitMessage?: string
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Content = (reader.result as string).split(',')[1];

      const result = await uploadFile(
        config,
        {
          path,
          content: base64Content,
          encoding: 'base64',
        },
        commitMessage || `Upload ${file.name}`
      );

      resolve(result);
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Failed to read file',
        error: 'FileReader error',
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload multiple files to GitHub
 */
export async function uploadMultipleFiles(
  config: GitHubConfig,
  files: Array<{ file: File; path: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const { file, path } = files[i];
    const result = await uploadBinaryFile(config, file, path);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }

  return results;
}

/**
 * List files in a GitHub directory
 */
export async function listFiles(
  config: GitHubConfig,
  path: string = ''
): Promise<GitHubFileInfo[] | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Delete a file from GitHub
 */
export async function deleteFile(
  config: GitHubConfig,
  path: string,
  commitMessage: string = 'Delete file via Dzardzongke app'
): Promise<UploadResult> {
  try {
    const sha = await getFileSha(config, path);

    if (!sha) {
      return {
        success: false,
        message: 'File not found',
        error: 'Cannot delete: file does not exist',
      };
    }

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          sha,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'File deleted successfully',
      };
    }

    return {
      success: false,
      message: 'Delete failed',
      error: data.message || 'Unknown error',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Delete failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the raw content URL for a file
 */
export function getRawContentUrl(
  config: GitHubConfig,
  path: string,
  branch: string = 'main'
): string {
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${branch}/${path}`;
}

/**
 * Get the content of a file from GitHub
 */
export async function getFileContent(
  config: GitHubConfig,
  path: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // GitHub returns content as base64
      const content = decodeURIComponent(escape(atob(data.content)));
      return { content, sha: data.sha };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Merge two JSON arrays, avoiding duplicates based on a key field
 */
function mergeJsonArrays<T extends Record<string, unknown>>(
  existing: T[],
  newItems: T[],
  keyField: string
): T[] {
  const existingKeys = new Set(existing.map(item => item[keyField]));
  const uniqueNewItems = newItems.filter(item => !existingKeys.has(item[keyField]));
  return [...existing, ...uniqueNewItems];
}

export interface MergeStats {
  totalNew: number;
  totalSkipped: number;
  skippedIds: string[];  // IDs of skipped (duplicate) items
}

/**
 * Merge conversations data (format: { categories: [...] })
 * Merges categories by id, and conversations within matching categories
 * Returns merge stats including skipped conversation IDs
 */
function mergeConversationsData(
  existing: { categories: Record<string, unknown>[] },
  newData: { categories: Record<string, unknown>[] }
): { merged: { categories: Record<string, unknown>[] }; stats: MergeStats } {
  const existingCategories = existing.categories || [];
  const newCategories = newData.categories || [];

  const mergedCategories = [...existingCategories];
  const existingCategoryIds = new Set(existingCategories.map(c => c.id));

  const stats: MergeStats = { totalNew: 0, totalSkipped: 0, skippedIds: [] };

  for (const newCat of newCategories) {
    if (existingCategoryIds.has(newCat.id)) {
      // Merge conversations into existing category
      const existingCat = mergedCategories.find(c => c.id === newCat.id);
      if (existingCat) {
        const existingConvs = (existingCat.conversations as Record<string, unknown>[]) || [];
        const newConvs = (newCat.conversations as Record<string, unknown>[]) || [];
        const existingConvIds = new Set(existingConvs.map(c => c.id as string));

        for (const conv of newConvs) {
          if (existingConvIds.has(conv.id as string)) {
            stats.totalSkipped++;
            stats.skippedIds.push(conv.id as string);
          } else {
            stats.totalNew++;
            existingConvs.push(conv);
          }
        }
        existingCat.conversations = existingConvs;
      }
    } else {
      // Add new category - all conversations are new
      const convs = (newCat.conversations as Record<string, unknown>[]) || [];
      stats.totalNew += convs.length;
      mergedCategories.push(newCat);
    }
  }

  return { merged: { categories: mergedCategories }, stats };
}

/**
 * Merge dictionary data and return stats
 */
function mergeDictionaryDataWithStats(
  existing: { entries: Record<string, unknown>[] },
  newData: { entries: Record<string, unknown>[] }
): { merged: { entries: Record<string, unknown>[] }; stats: MergeStats } {
  const existingEntries = existing.entries || [];
  const newEntries = newData.entries || [];
  const existingKeys = new Set(existingEntries.map(item => item.dz as string));

  const stats: MergeStats = { totalNew: 0, totalSkipped: 0, skippedIds: [] };
  const uniqueNewEntries: Record<string, unknown>[] = [];

  for (const entry of newEntries) {
    if (existingKeys.has(entry.dz as string)) {
      stats.totalSkipped++;
      stats.skippedIds.push(entry.dz as string);
    } else {
      stats.totalNew++;
      uniqueNewEntries.push(entry);
    }
  }

  return {
    merged: { entries: [...existingEntries, ...uniqueNewEntries] },
    stats
  };
}

export type MergeType = 'dictionary' | 'conversations';

/**
 * Upload a JSON file with merge support
 * For dictionary and conversations, this will add new items to existing data
 * Returns merge statistics including skipped IDs (useful for skipping related audio uploads)
 */
export async function uploadJsonWithMerge(
  config: GitHubConfig,
  path: string,
  newContent: string,
  mergeType: MergeType,
  commitMessage: string = 'Update file via Language Learning app'
): Promise<UploadResult> {
  try {
    // Try to get existing file
    const existing = await getFileContent(config, path);

    let finalContent = newContent;
    let existingSha: string | undefined;
    let mergeStats: MergeStats | undefined;

    if (existing) {
      existingSha = existing.sha;

      try {
        const existingData = JSON.parse(existing.content);
        const newData = JSON.parse(newContent);

        if (mergeType === 'dictionary' && existingData.entries && newData.entries) {
          const result = mergeDictionaryDataWithStats(existingData, newData);
          finalContent = JSON.stringify(result.merged, null, 2);
          mergeStats = result.stats;
        } else if (mergeType === 'conversations' && existingData.categories && newData.categories) {
          const result = mergeConversationsData(existingData, newData);
          finalContent = JSON.stringify(result.merged, null, 2);
          mergeStats = result.stats;
        }
      } catch {
        // If parsing fails, just overwrite
      }
    }

    const body: Record<string, string> = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(finalContent))),
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (response.ok) {
      let message = 'File uploaded';
      if (mergeStats) {
        if (mergeStats.totalSkipped > 0 && mergeStats.totalNew > 0) {
          message = `Merged: ${mergeStats.totalNew} new, ${mergeStats.totalSkipped} skipped`;
        } else if (mergeStats.totalSkipped > 0) {
          message = `All ${mergeStats.totalSkipped} items already exist`;
        } else if (mergeStats.totalNew > 0) {
          message = `Added ${mergeStats.totalNew} new items`;
        }
      } else if (existingSha) {
        message = 'File updated';
      }

      return {
        success: true,
        message,
        url: data.content?.html_url,
        sha: data.content?.sha,
        mergeStats,
      };
    }

    return {
      success: false,
      message: 'Upload failed',
      error: data.message || 'Unknown error',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  saveGitHubConfig,
  loadGitHubConfig,
  clearGitHubConfig,
  isConfigComplete,
  getFileSha,
  getFileContent,
  uploadFile,
  uploadJsonWithMerge,
  uploadBinaryFile,
  uploadMultipleFiles,
  listFiles,
  deleteFile,
  getRawContentUrl,
};
