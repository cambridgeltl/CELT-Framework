'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/Button';

interface AudioRecorderProps {
  wordDisplay: string;
  targetFilename: string;
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded';

// Format seconds to mm:ss
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Convert Float32Array audio data to WAV Blob
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels (mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function AudioRecorder({
  wordDisplay,
  targetFilename,
  onRecordingComplete,
  onCancel,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context for WAV recording
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState('recording');
      setDuration(0);

      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTime) / 1000);
      }, 100);

    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop the processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Get sample rate before closing context
    const sampleRate = audioContextRef.current?.sampleRate || 44100;

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Combine all audio chunks into a single Float32Array
    const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedSamples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunksRef.current) {
      combinedSamples.set(chunk, offset);
      offset += chunk.length;
    }

    // Encode as WAV
    const wavBlob = encodeWAV(combinedSamples, sampleRate);
    recordedBlobRef.current = wavBlob;

    // Create preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(wavBlob));

    setState('recorded');
  }, [previewUrl]);

  const handleReRecord = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    recordedBlobRef.current = null;
    audioChunksRef.current = [];
    setDuration(0);
    setState('idle');
  }, [previewUrl]);

  const handleConfirm = useCallback(() => {
    if (recordedBlobRef.current) {
      onRecordingComplete(recordedBlobRef.current);
    }
  }, [onRecordingComplete]);

  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      {/* Word Display */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-[var(--color-text)] mb-1">
          {wordDisplay}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Recording: <span className="font-mono">{targetFilename}</span>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full p-3 bg-[var(--danger-light)] text-[var(--danger)] rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* Recording UI */}
      {state === 'idle' && (
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-light)]"
            aria-label="Start recording"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <p className="text-sm text-[var(--color-text-muted)]">
            Tap to start recording
          </p>
        </div>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center space-y-4">
          {/* Animated recording indicator */}
          <div className="relative">
            {/* Pulsing ring - pointer-events-none so clicks pass through */}
            <div className="absolute inset-0 rounded-full bg-[var(--color-danger)] animate-ping opacity-30 pointer-events-none" />
            <button
              onClick={stopRecording}
              className="relative w-20 h-20 rounded-full bg-[var(--color-danger)] text-[var(--color-danger-text)] flex items-center justify-center focus:outline-none z-10"
              aria-label="Stop recording"
            >
              <div className="w-6 h-6 bg-white rounded-sm" />
            </button>
          </div>

          {/* Timer */}
          <div className="text-3xl font-mono font-semibold text-[var(--color-text)] tabular-nums">
            {formatTime(duration)}
          </div>

          <p className="text-sm text-[var(--color-text-muted)]">
            Tap to stop
          </p>
        </div>
      )}

      {state === 'recorded' && previewUrl && (
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Audio Preview */}
          <div className="w-full max-w-xs">
            <audio
              src={previewUrl}
              controls
              className="w-full"
            />
          </div>

          <p className="text-sm text-[var(--color-text-muted)]">
            Duration: {formatTime(duration)}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              variant="secondary"
              onClick={handleReRecord}
              fullWidth
            >
              Re-record
            </Button>
            <Button
              onClick={handleConfirm}
              fullWidth
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Button - always visible */}
      <button
        onClick={onCancel}
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
