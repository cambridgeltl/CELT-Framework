'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DeployGuideSlideshowProps {
  isOpen: boolean;
  onClose: () => void;
}

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
// PHONE FRAME COMPONENT
// ============================================
const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-48 relative">
    <div className="border-[6px] border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl bg-black">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-10" />
      <div className="bg-white pt-6 pb-4 min-h-[280px]">
        {children}
      </div>
    </div>
  </div>
);

// ============================================
// SLIDE VISUALS
// ============================================

// Slide 0: Overview - GitHub Actions flow
const OverviewVisual = () => (
  <div className="py-4">
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* Data Creator */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <span className="text-[10px] mt-1 text-[var(--color-text-muted)] font-medium">Data Creator</span>
      </div>

      <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>

      {/* GitHub */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-[#161b22] rounded-xl flex items-center justify-center shadow-lg border border-[#30363d]">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-[10px] mt-1 text-[var(--color-text-muted)] font-medium">GitHub</span>
      </div>

      <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>

      {/* GitHub Actions */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-[#161b22] rounded-xl flex items-center justify-center shadow-lg border border-blue-500/30">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-[10px] mt-1 text-[var(--color-text-muted)] font-medium">GitHub Actions</span>
      </div>

      <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>

      {/* Android Phone */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        </div>
        <span className="text-[10px] mt-1 text-[var(--color-text-muted)] font-medium">Android Phone</span>
      </div>
    </div>

    <div className="space-y-2 max-w-sm mx-auto">
      {[
        { num: '1', title: 'Fork the app repository', desc: 'Your own copy on GitHub' },
        { num: '2', title: 'Set your app name & add content', desc: 'Customize with langdatacreator' },
        { num: '3', title: 'Build with one click', desc: 'GitHub Actions builds the APK' },
        { num: '4', title: 'Download & install', desc: 'Get the .apk on your Android phone' },
      ].map((item) => (
        <div key={item.num} className="flex items-center gap-3 p-2.5 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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

// Slide 1: Fork the repository
const ForkRepoVisual = () => (
  <BrowserFrame url="github.com/org/language-learning-app">
    <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-white text-sm font-medium">language-learning-app</span>
      </div>
      <div className="relative">
        <button className="px-3 py-1 bg-[#21262d] border border-[#30363d] text-gray-300 text-xs rounded-md flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Fork
        </button>
        <ClickHere position="bottom" text="Fork this repo" />
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 bg-[#238636]/20 text-[#238636] text-xs rounded-full border border-[#238636]/30">Expo</span>
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">React Native</span>
      </div>
      <p className="text-gray-400 text-xs mb-3">A language learning mobile app. Built with Expo & React Native. Fork this repo and build your own app with GitHub Actions.</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />TypeScript
        </span>
      </div>
    </div>
  </BrowserFrame>
);

// Slide 2: Set your app name
const SetAppNameVisual = () => (
  <BrowserFrame url="github.com/you/language-learning-app/edit/main/app-config.json">
    <div className="px-4 py-3 border-b border-[#30363d]">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
        <span className="text-blue-400 hover:underline">language-learning-app</span>
        <span>/</span>
        <span className="text-white font-medium">app-config.json</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs">Edit file</span>
        <div className="relative">
          <div className="w-7 h-7 bg-[#21262d] border border-[#30363d] rounded flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <ClickHere position="right" text="Edit this file" />
        </div>
      </div>
    </div>
    <div className="p-4">
      {/* Code editor area */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 font-mono text-sm">
        <div className="text-gray-500 text-xs mb-2">1</div>
        <div className="text-gray-300">
          <span className="text-gray-500">{'{'}</span>
        </div>
        <div className="text-gray-500 text-xs mb-1 mt-1">2</div>
        <div className="text-gray-300 pl-4">
          <span className="text-[#7ee787]">&quot;appName&quot;</span>
          <span className="text-gray-400">: </span>
          <span className="text-[#a5d6ff]">&quot;Learn Dzardzongke&quot;</span>
        </div>
        <div className="text-gray-500 text-xs mb-1 mt-1">3</div>
        <div className="text-gray-300">
          <span className="text-gray-500">{'}'}</span>
        </div>
      </div>

      {/* Commit button */}
      <div className="mt-4 flex justify-end relative">
        <button className="px-4 py-1.5 bg-[#238636] text-white text-xs rounded-md font-medium">
          Commit changes
        </button>
        <ClickHere position="left" text="Commit changes" />
      </div>
    </div>
  </BrowserFrame>
);

// Slide 3: Add your content
const AddContentVisual = () => (
  <BrowserFrame url="langdatacreator.vercel.app">
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-emerald-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <span className="text-white text-sm font-medium">langdatacreator</span>
      </div>

      {/* Content type cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { name: 'Dictionary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'violet' },
          { name: 'Decks', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'blue' },
          { name: 'Conversations', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'emerald' },
          { name: 'Culture', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'amber' },
        ].map((item) => (
          <div key={item.name} className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center gap-2">
            <svg className={`w-4 h-4 text-${item.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="text-gray-300 text-xs font-medium">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Push to GitHub button */}
      <div className="relative">
        <button className="w-full py-2 bg-[#238636] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Push to GitHub
        </button>
        <ClickHere position="top" text="Push content" />
      </div>
    </div>
  </BrowserFrame>
);

// Slide 4: Enable GitHub Actions
const EnableActionsVisual = () => (
  <BrowserFrame url="github.com/you/language-learning-app/actions">
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
        <span className="text-white text-sm font-medium">Actions</span>
      </div>

      {/* Warning banner */}
      <div className="bg-[#161b22] border border-yellow-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-yellow-400 text-sm font-medium mb-1">Workflows aren&apos;t being run on this forked repository</p>
            <p className="text-gray-400 text-xs">Because this repository has been forked, workflows need to be enabled before they can run.</p>
          </div>
        </div>
      </div>

      {/* Enable button */}
      <div className="relative flex justify-center">
        <button className="px-4 py-2 bg-[#238636] text-white text-sm font-medium rounded-md">
          I understand my workflows, go ahead and enable them
        </button>
        <ClickHere position="bottom" text="Enable Actions" />
      </div>
    </div>
  </BrowserFrame>
);

// Slide 5: Run the build workflow
const RunBuildVisual = () => (
  <BrowserFrame url="github.com/you/language-learning-app/actions">
    <div className="p-4">
      <div className="flex gap-3">
        {/* Sidebar */}
        <div className="w-40 space-y-1 text-xs">
          <span className="text-gray-500 text-[10px] uppercase tracking-wide block mb-2">Workflows</span>
          <div className="relative px-2 py-1.5 text-white bg-violet-600/20 rounded flex items-center gap-1.5 border border-violet-500/30">
            <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
            Build Android App
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-3">This workflow has a <span className="text-white font-mono text-[10px] bg-[#0d1117] px-1.5 py-0.5 rounded">workflow_dispatch</span> event trigger.</p>

            {/* Run workflow button */}
            <div className="relative inline-block mb-4">
              <button className="px-3 py-1.5 bg-[#238636] text-white text-xs rounded-md font-medium flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                Run workflow
              </button>
              <ClickHere position="right" text="Run workflow" />
            </div>

            {/* Dropdown expanded */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-3">
              <div>
                <label className="text-gray-400 text-[10px] block mb-1">Use workflow from</label>
                <div className="bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-xs text-gray-300">
                  Branch: main
                </div>
              </div>
              <div className="relative">
                <button className="w-full py-1.5 bg-[#238636] text-white text-xs rounded-md font-medium">
                  Run workflow
                </button>
                <ClickHere position="bottom" text="Confirm!" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

// Slide 6: Download the APK
const DownloadApkVisual = () => (
  <BrowserFrame url="github.com/you/language-learning-app/releases">
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
        <span className="text-white text-sm font-medium">Releases</span>
      </div>

      {/* Release card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d]">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#238636]/20 text-[#238636] text-[10px] rounded-full border border-[#238636]/30 font-medium">Latest</span>
            <span className="text-white text-sm font-semibold">learn-dzardzongke build #1</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>build-1</span>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-[#30363d]">
          <p className="text-gray-400 text-xs">Android APK built from commit <span className="text-blue-400 font-mono text-[10px]">a1b2c3d</span></p>
        </div>
        <div className="px-4 py-3">
          <span className="text-gray-500 text-xs uppercase tracking-wide block mb-2">Assets</span>
          <div className="relative flex items-center justify-between p-2 bg-[#0d1117] border border-[#30363d] rounded">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-blue-400 text-xs font-medium">learn-dzardzongke.apk</span>
            </div>
            <span className="text-gray-500 text-[10px]">~50 MB</span>
            <ClickHere position="top" text="Download!" />
          </div>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

// Slide 7: Install on phone
const InstallOnPhoneVisual = () => (
  <div className="py-2">
    <div className="flex items-center justify-center gap-8">
      {/* Computer with .apk */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-14 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg flex items-center justify-center shadow-lg">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-[10px] text-violet-400 font-mono font-bold">.apk</span>
          </div>
        </div>
        <span className="text-[10px] mt-1.5 text-[var(--color-text-muted)]">Downloaded file</span>
      </div>

      <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>

      {/* Phone */}
      <PhoneFrame>
        <div className="px-3 pt-2 flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-[10px] text-gray-800 font-medium mb-3">Learn Dzardzongke</p>
          <div className="w-full space-y-1.5 px-1">
            <div className="h-2 bg-gray-200 rounded-full w-full" />
            <div className="h-2 bg-gray-200 rounded-full w-3/4" />
            <div className="h-6 bg-violet-100 rounded-lg mt-2 flex items-center justify-center">
              <span className="text-[8px] text-violet-600 font-medium">Start Learning</span>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>

    <div className="mt-4 space-y-2 max-w-sm mx-auto">
      {[
        { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', text: 'Transfer the .apk to your Android phone (email, USB, cloud drive)' },
        { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', text: 'Open the file and tap "Install"' },
        { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Allow "Install from unknown sources" if asked' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-2 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
          <svg className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
          <span className="text-xs text-[var(--color-text-secondary)]">{item.text}</span>
        </div>
      ))}
    </div>
  </div>
);

// Slide 8: Done!
const DoneVisual = () => (
  <div className="py-6 flex flex-col items-center">
    <div className="relative mb-4">
      <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-40 animate-pulse" />
      <div className="relative w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <h3 className="text-xl font-bold text-[var(--color-text)] mb-1">App Built!</h3>
    <p className="text-[var(--color-text-muted)] text-sm mb-4">Your language learning app is ready</p>

    <div className="space-y-2 w-full max-w-xs">
      <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">To update the app</p>
          <p className="text-xs text-[var(--color-text-muted)]">Add more content with langdatacreator, then run the build workflow again</p>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function DeployGuideSlideshow({ isOpen, onClose }: DeployGuideSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(0);
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

  const goToSlide = (index: number) => {
    if (isAnimatingRef.current || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }, 150);
  };

  const goNext = () => goToSlide(currentSlide + 1);
  const goPrev = () => goToSlide(currentSlide - 1);

  const slides = [
    {
      title: 'Build Your App',
      subtitle: 'Create an Android app from your content',
      visual: <OverviewVisual />,
      content: (
        <div className="bg-violet-500/10 rounded-lg p-3 border border-violet-500/20">
          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            This guide walks you through building an Android app from your language content. No coding or developer tools required!
          </p>
        </div>
      ),
    },
    {
      title: 'Step 1 of 7',
      subtitle: 'Fork the repository',
      visual: <ForkRepoVisual />,
      content: (
        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
          Forking creates your own copy of the app code on GitHub.
        </p>
      ),
    },
    {
      title: 'Step 2 of 7',
      subtitle: 'Set your app name',
      visual: <SetAppNameVisual />,
      content: (
        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
          This is the only file you need to edit. It sets the name that appears on your phone.
        </p>
      ),
    },
    {
      title: 'Step 3 of 7',
      subtitle: 'Add your language content',
      visual: <AddContentVisual />,
      content: (
        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
          Use langdatacreator to create and push dictionary, flashcards, conversations, and culture content to your GitHub repository.
        </p>
      ),
    },
    {
      title: 'Step 4 of 7',
      subtitle: 'Enable GitHub Actions',
      visual: <EnableActionsVisual />,
      content: (
        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
          GitHub disables automated builds on forked repositories by default. You need to enable them once.
        </p>
      ),
    },
    {
      title: 'Step 5 of 7',
      subtitle: 'Run the build',
      visual: <RunBuildVisual />,
      content: (
        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
          The build runs in the cloud and takes about 10-15 minutes. You&apos;ll see a green checkmark when it&apos;s done.
        </p>
      ),
    },
    {
      title: 'Step 6 of 7',
      subtitle: 'Download the APK',
      visual: <DownloadApkVisual />,
      content: (
        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
          The APK file is your Android app. Download it to your computer.
        </p>
      ),
    },
    {
      title: 'Step 7 of 7',
      subtitle: 'Install on your phone',
      visual: <InstallOnPhoneVisual />,
      content: null,
    },
    {
      title: "You're Done!",
      subtitle: 'Your app is ready',
      visual: <DoneVisual />,
      content: null,
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) goNext();
      if (e.key === 'ArrowLeft' && currentSlide > 0) goPrev();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, currentSlide]);

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
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300 rounded-full"
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
            {/* Dots */}
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer hover:bg-[var(--color-text-muted)] ${
                    i === currentSlide ? 'w-4 bg-violet-500' : 'w-1.5 bg-[var(--color-border)]'
                  }`}
                />
              ))}
            </div>

            {/* Nav */}
            <div className="flex gap-2">
              {currentSlide > 0 && (
                <button onClick={goPrev} className="px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-overlay)]">
                  Back
                </button>
              )}
              {currentSlide === slides.length - 1 ? (
                <button onClick={onClose} className="px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-medium">
                  Done
                </button>
              ) : (
                <button onClick={goNext}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white">
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
