'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

interface GitHubTokenSlideshowProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguageName?: string;
  onLanguageNameChange?: (name: string) => void;
}

// Storage keys
const LANGUAGE_NAME_KEY = 'languageLearningApp_languageName';
const ONBOARDING_COMPLETE_KEY = 'languageLearningApp_onboardingComplete';
const THEME_STORAGE_KEY = 'dzardzongke-theme';

// Helper functions for localStorage
export const getStoredLanguageName = (): string => {
  if (typeof window === 'undefined') return 'Your Language';
  return localStorage.getItem(LANGUAGE_NAME_KEY) || 'Your Language';
};

export const setStoredLanguageName = (name: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_NAME_KEY, name);
  }
};

export const isOnboardingComplete = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
};

export const setOnboardingComplete = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  }
};

// Theme helpers
const setTheme = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

// ============================================
// CLICK INDICATOR COMPONENT
// ============================================
const ClickHere = ({ position = 'right', text = 'Click here' }: { position?: 'right' | 'left' | 'top' | 'bottom'; text?: string }) => {
  const positions = {
    right: 'left-full ml-2 top-1/2 -translate-y-1/2 flex-row',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2 flex-row-reverse',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2 flex-col-reverse items-center',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2 flex-col items-center',
  };

  const arrows = {
    right: 'M11 19l-7-7 7-7',
    left: 'M9 5l7 7-7 7',
    top: 'M19 15l-7 7-7-7',
    bottom: 'M5 9l7-7 7 7',
  };

  return (
    <div className={`absolute flex gap-1 items-center z-20 animate-pulse ${positions[position]}`}>
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d={arrows[position]} />
      </svg>
      <span className="px-2 py-1 bg-amber-400 text-black text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
        {text}
      </span>
    </div>
  );
};

// ============================================
// BROWSER FRAME COMPONENT
// ============================================
const BrowserFrame = ({ url, children }: { url: string; children: React.ReactNode }) => (
  <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10">
    <div className="bg-[#2d2d2d] px-3 py-2 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
      </div>
      <div className="flex-1 mx-2">
        <div className="bg-[#1a1a1a] rounded-md px-3 py-1 text-xs text-gray-400 flex items-center gap-2">
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{url}</span>
        </div>
      </div>
    </div>
    <div className="bg-[#0d1117]">{children}</div>
  </div>
);

// ============================================
// THEME SELECTION VISUAL
// ============================================
const ThemeSelectionVisual = ({ selectedTheme, onSelect }: { selectedTheme: 'light' | 'dark' | null; onSelect: (theme: 'light' | 'dark') => void }) => (
  <div className="flex gap-6 justify-center py-8">
    <button
      onClick={() => onSelect('light')}
      className={`relative group w-36 h-52 rounded-2xl transition-all duration-500 overflow-hidden
        ${selectedTheme === 'light' ? 'ring-4 ring-amber-400 scale-105 shadow-2xl shadow-amber-500/30' : 'hover:scale-102 shadow-xl hover:shadow-2xl'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-slate-100">
        <div className="absolute top-4 right-4 w-10 h-10">
          <div className="absolute inset-0 bg-amber-400 rounded-full" />
          <div className="absolute inset-1 bg-amber-300 rounded-full" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          <div className="h-2 bg-slate-300 rounded-full w-3/4" />
          <div className="h-2 bg-slate-300 rounded-full w-1/2" />
          <div className="h-6 bg-amber-200 rounded-lg mt-2" />
        </div>
      </div>
      {selectedTheme === 'light' && (
        <div className="absolute top-2 left-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="px-3 py-1 bg-white/90 rounded-full text-xs font-semibold text-slate-700">Light</span>
      </div>
    </button>

    <button
      onClick={() => onSelect('dark')}
      className={`relative group w-36 h-52 rounded-2xl transition-all duration-500 overflow-hidden
        ${selectedTheme === 'dark' ? 'ring-4 ring-indigo-400 scale-105 shadow-2xl shadow-indigo-500/30' : 'hover:scale-102 shadow-xl hover:shadow-2xl'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="absolute top-4 right-4 w-8 h-8">
          <div className="absolute inset-0 bg-slate-300 rounded-full" />
          <div className="absolute top-0.5 right-0 w-5 h-5 bg-slate-800 rounded-full" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{ left: `${15 + i * 15}%`, top: `${15 + (i % 3) * 10}%`, animationDelay: `${i * 0.3}s` }} />
        ))}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          <div className="h-2 bg-slate-700 rounded-full w-3/4" />
          <div className="h-2 bg-slate-700 rounded-full w-1/2" />
          <div className="h-6 bg-indigo-900/50 rounded-lg mt-2" />
        </div>
      </div>
      {selectedTheme === 'dark' && (
        <div className="absolute top-2 left-2 w-7 h-7 bg-indigo-400 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="px-3 py-1 bg-slate-700/90 rounded-full text-xs font-semibold text-slate-200">Dark</span>
      </div>
    </button>
  </div>
);

// ============================================
// WHY GITHUB VISUAL
// ============================================
const WhyGitHubVisual = () => (
  <div className="py-4">
    {/* Flow diagram */}
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* This App */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <span className="text-[11px] mt-1.5 text-[var(--color-text-muted)] font-medium">This App</span>
      </div>

      <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>

      {/* GitHub Repo */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-[#161b22] rounded-xl flex items-center justify-center shadow-lg border border-[#30363d]">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-[11px] mt-1.5 text-[var(--color-text-muted)] font-medium">GitHub</span>
      </div>

      <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>

      {/* Learning App */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-[11px] mt-1.5 text-[var(--color-text-muted)] font-medium">Learn App</span>
      </div>
    </div>

    {/* Steps explanation */}
    <div className="space-y-2 max-w-sm mx-auto">
      {[
        { num: '1', title: 'Create data here', desc: 'Dictionary, flashcards, dialogues, culture notes' },
        { num: '2', title: 'Upload to GitHub', desc: 'Your data is saved as JSON files in your repo' },
        { num: '3', title: 'Learning app reads it', desc: 'Students learn from your language data!' },
      ].map((item) => (
        <div key={item.num} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
          <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {item.num}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--color-text)]">{item.title}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// GITHUB STEP VISUALS
// ============================================
const GitHubStep1Visual = () => (
  <BrowserFrame url="github.com">
    <div className="bg-[#010409] px-4 py-3 flex items-center justify-between border-b border-[#30363d]">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 ring-2 ring-amber-400 ring-offset-2 ring-offset-[#010409]" />
        <ClickHere position="bottom" text="Click profile" />
      </div>
    </div>
    <div className="p-4 opacity-30">
      <div className="h-4 bg-gray-600 rounded w-1/2 mb-3" />
      <div className="h-4 bg-gray-600 rounded w-1/3" />
    </div>
  </BrowserFrame>
);

const GitHubStep2Visual = () => (
  <BrowserFrame url="github.com">
    <div className="bg-[#010409] px-4 py-3 flex items-center justify-between border-b border-[#30363d]">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
        <div className="absolute right-0 top-10 w-48 bg-[#161b22] rounded-lg border border-[#30363d] shadow-xl overflow-hidden z-10">
          <div className="px-3 py-2 border-b border-[#30363d] text-white text-sm">username</div>
          <div className="py-1">
            <div className="px-3 py-1.5 text-gray-400 text-sm">Your profile</div>
            <div className="relative px-3 py-1.5 text-white text-sm bg-[#238636]/20 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
              <ClickHere position="left" text="Click Settings" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="p-4 opacity-20"><div className="h-4 bg-gray-600 rounded w-1/2" /></div>
  </BrowserFrame>
);

const GitHubStep3Visual = () => (
  <BrowserFrame url="github.com/settings/profile">
    <div className="flex min-h-[240px]">
      <div className="w-44 bg-[#0d1117] border-r border-[#30363d] p-3 text-sm">
        <div className="text-xs text-gray-500 uppercase mb-2 px-2">Access</div>
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-gray-400">Profile</div>
          <div className="px-2 py-1 text-gray-400">Account</div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          <div className="relative px-2 py-1 text-white bg-[#238636]/20 rounded flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Developer settings
            <ClickHere position="right" text="Click here" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 opacity-20">
        <div className="h-6 bg-gray-600 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-600 rounded w-full" />
      </div>
    </div>
  </BrowserFrame>
);

const GitHubStep4Visual = () => (
  <BrowserFrame url="github.com/settings/apps">
    <div className="flex min-h-[240px]">
      <div className="w-48 bg-[#0d1117] border-r border-[#30363d] p-3 text-sm">
        <div className="text-white font-medium mb-3 px-2">Developer Settings</div>
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-gray-400">GitHub Apps</div>
          <div className="px-2 py-1 text-gray-400">OAuth Apps</div>
          <div className="mt-2 ml-2 space-y-0.5">
            <div className="px-2 py-1 text-gray-400 text-xs">Fine-grained tokens</div>
            <div className="relative px-2 py-1 text-white bg-[#238636]/20 rounded text-xs">
              Tokens (classic)
              <ClickHere position="right" text="Click this" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 opacity-20">
        <div className="h-6 bg-gray-600 rounded w-1/3" />
      </div>
    </div>
  </BrowserFrame>
);

const GitHubStep5Visual = () => (
  <BrowserFrame url="github.com/settings/tokens">
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-base font-semibold">Personal access tokens (classic)</h2>
          <p className="text-gray-400 text-xs">Tokens for GitHub API access</p>
        </div>
        <div className="relative">
          <button className="px-3 py-1.5 bg-[#238636] text-white text-sm rounded-md flex items-center gap-1">
            Generate new token
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-[#161b22] rounded-lg border border-[#30363d] shadow-xl">
            <div className="relative px-3 py-2 text-white text-sm">
              Generate new token (classic)
              <ClickHere position="left" text="Click this" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

const GitHubStep6Visual = () => (
  <BrowserFrame url="github.com/settings/tokens/new">
    <div className="p-4">
      <h2 className="text-white text-base font-semibold mb-3">New personal access token</h2>
      <div className="mb-3">
        <label className="text-white text-sm block mb-1">Note</label>
        <input type="text" value="Language Data Creator" readOnly className="w-full bg-[#0d1117] border-2 border-[#238636] rounded px-3 py-1.5 text-white text-sm" />
      </div>
      <div className="mb-3">
        <label className="text-white text-sm block mb-1">Select scopes</label>
        <div className="relative bg-[#161b22] border-2 border-[#238636] rounded p-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-[#238636] bg-[#238636] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white text-sm font-medium">repo</span>
          </div>
          <ClickHere position="right" text="Check ONLY repo" />
        </div>
      </div>
      <div className="relative inline-block">
        <button className="px-3 py-1.5 bg-[#238636] text-white text-sm rounded">Generate token</button>
        <ClickHere position="right" text="Generate!" />
      </div>
    </div>
  </BrowserFrame>
);

const GitHubStep7Visual = () => (
  <BrowserFrame url="github.com/settings/tokens">
    <div className="p-4">
      <div className="bg-[#238636]/20 border border-[#238636] rounded p-3 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#238636]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[#238636] text-sm font-medium">Token created!</span>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mb-3">
        <p className="text-amber-400 text-xs font-medium">Copy now - you won't see it again!</p>
      </div>
      <div className="relative flex items-center gap-2 bg-[#161b22] rounded p-2 border-2 border-[#238636]">
        <code className="flex-1 text-[#238636] font-mono text-xs">ghp_xK7yB9mN2pQ4rT6wE8uI0oA3sD5fG7hJ</code>
        <button className="relative p-1.5 bg-[#238636] rounded text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <ClickHere position="top" text="COPY!" />
        </button>
      </div>
    </div>
  </BrowserFrame>
);

const FinalSetupVisual = () => (
  <div className="py-2">
    <div className="max-w-xs mx-auto">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-xl border border-[var(--color-border)] overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-emerald-500/10 px-3 py-2 border-b border-[var(--color-border)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-[var(--color-text)]">GitHub Settings</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--color-text-muted)] uppercase">Owner</label>
            <input type="text" placeholder="your-username" className="w-full h-7 bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--color-text-muted)] uppercase">Repo</label>
            <input type="text" placeholder="language-data" className="w-full h-7 bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 text-xs" />
          </div>
          <div className="relative space-y-1">
            <label className="text-[10px] text-[var(--color-text-muted)] uppercase">Token</label>
            <input type="password" placeholder="ghp_xxxx..." className="w-full h-7 bg-[var(--color-bg)] border-2 border-[var(--color-primary)] rounded px-2 text-xs" />
            <ClickHere position="right" text="Paste here" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function GitHubTokenSlideshow({ isOpen, onClose, initialLanguageName, onLanguageNameChange }: GitHubTokenSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false); // Ref for synchronous animation lock
  const [languageName, setLanguageName] = useState(initialLanguageName || '');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    if (isOpen && !initialLanguageName) {
      const stored = getStoredLanguageName();
      if (stored !== 'Your Language') {
        setLanguageName(stored);
      }
    }
  }, [isOpen, initialLanguageName]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(0);
      setSelectedTheme(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLanguageNameChange = useCallback((name: string) => {
    setLanguageName(name);
    setStoredLanguageName(name);
    onLanguageNameChange?.(name);
  }, [onLanguageNameChange]);

  const handleThemeSelect = useCallback((theme: 'light' | 'dark') => {
    setSelectedTheme(theme);
    setTheme(theme);
  }, []);

  const handleComplete = useCallback(() => {
    if (languageName.trim()) {
      setStoredLanguageName(languageName.trim());
    }
    setOnboardingComplete();
    onClose();
  }, [languageName, onClose]);

  const goToSlide = (index: number) => {
    if (isAnimatingRef.current || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    isAnimatingRef.current = true; // Immediately block further calls
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
      isAnimatingRef.current = false; // Allow next navigation
    }, 150);
  };

  const goNext = () => goToSlide(currentSlide + 1);
  const goPrev = () => goToSlide(currentSlide - 1);

  const canProceed = () => {
    if (currentSlide === 0) return selectedTheme !== null;
    if (currentSlide === 1) return languageName.trim().length > 0;
    return true;
  };

  // Slides configuration
  const slides = [
    // 0: Theme
    {
      title: "Welcome!",
      subtitle: "Choose your preferred theme",
      visual: <ThemeSelectionVisual selectedTheme={selectedTheme} onSelect={handleThemeSelect} />,
      content: <p className="text-center text-[var(--color-text-muted)] text-xs">You can change this anytime</p>,
    },
    // 1: Language Name
    {
      title: "Your Language",
      subtitle: "What language are you documenting?",
      visual: (
        <div className="py-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-emerald-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <input
            type="text"
            value={languageName}
            onChange={(e) => handleLanguageNameChange(e.target.value)}
            placeholder="e.g., Dzongkha, Tibetan..."
            className="w-full max-w-xs px-4 py-3 text-center bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] outline-none transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            autoFocus
          />
        </div>
      ),
      content: <p className="text-center text-[var(--color-text-muted)] text-xs">This name will appear in the app header</p>,
    },
    // 2: Why GitHub
    {
      title: "How It Works",
      subtitle: "Your data powers the learning app",
      visual: <WhyGitHubVisual />,
      content: (
        <div className="bg-[var(--color-primary)]/10 rounded-lg p-3 border border-[var(--color-primary)]/20">
          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            A GitHub token lets this app upload your data to a repo. The learning app reads from that repo so students can learn.
          </p>
        </div>
      ),
    },
    // 3-9: GitHub Steps
    { title: "Step 1 of 8", subtitle: "Click your profile picture", visual: <GitHubStep1Visual />, content: null },
    { title: "Step 2 of 8", subtitle: "Click 'Settings'", visual: <GitHubStep2Visual />, content: null },
    { title: "Step 3 of 8", subtitle: "Click 'Developer settings'", visual: <GitHubStep3Visual />, content: null },
    { title: "Step 4 of 8", subtitle: "Click 'Tokens (classic)'", visual: <GitHubStep4Visual />, content: null },
    { title: "Step 5 of 8", subtitle: "Generate new token (classic)", visual: <GitHubStep5Visual />, content: null },
    { title: "Step 6 of 8", subtitle: "Name it & check 'repo' scope", visual: <GitHubStep6Visual />, content: null },
    { title: "Step 7 of 8", subtitle: "Copy your token immediately!", visual: <GitHubStep7Visual />, content: null },
    // 10: Paste token
    { title: "Step 8 of 8", subtitle: "Paste token in this app", visual: <FinalSetupVisual />, content: null },
    // 11: Done
    {
      title: "You're Ready!",
      subtitle: `Start creating ${languageName || 'language'} content`,
      visual: (
        <div className="py-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)] mb-1">{languageName || 'Your Language'}</h3>
          <p className="text-[var(--color-text-muted)] text-sm">Start building your language data!</p>
        </div>
      ),
      content: (
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg transition-colors mx-auto w-fit"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Open GitHub Token Settings
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ),
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && canProceed() && currentSlide < slides.length - 1) goNext();
      if (e.key === 'ArrowLeft' && currentSlide > 0) goPrev();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, currentSlide, selectedTheme, languageName]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">{slide.title}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">{slide.subtitle}</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-overlay)] rounded-lg transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress */}
          <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto px-5 py-3 transition-all duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: isAnimating ? `translateX(${direction === 'next' ? '20px' : '-20px'})` : 'none' }}>
          {slide.visual}
          {slide.content}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Dots - disabled during GitHub steps (slides 3-10) */}
            <div className="flex gap-1">
              {slides.map((_, i) => {
                const isGitHubSection = currentSlide >= 3 && currentSlide <= 10;
                const isClickable = !isGitHubSection;
                return (
                  <div
                    key={i}
                    onClick={isClickable ? () => goToSlide(i) : undefined}
                    className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-4 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--color-border)]'} ${isClickable ? 'cursor-pointer hover:bg-[var(--color-text-muted)]' : 'cursor-default'}`}
                  />
                );
              })}
            </div>

            {/* Nav */}
            <div className="flex gap-2">
              {currentSlide > 0 && (
                <button onClick={goPrev} className="px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-overlay)]">
                  Back
                </button>
              )}
              {currentSlide === slides.length - 1 ? (
                <button onClick={handleComplete} className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-[var(--color-primary)] text-white rounded-lg text-sm font-medium">
                  Get Started
                </button>
              ) : (
                <button onClick={goNext} disabled={!canProceed()}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!canProceed() ? 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed' : 'bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 text-white'}`}>
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
}
