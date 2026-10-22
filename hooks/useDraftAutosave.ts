"use client";

/**
 * Invoice draft autosave hook (#448)
 *
 * Autosaves form state to backend every 30 seconds and on blur.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useCallback as useCallbackReact } from "react";

export interface DraftAutosaveOptions<T> {
  draftId: string;
  formData: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  autoSaveIntervalMs?: number;
}

export interface DraftAutosaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: Error | null;
}

export function useDraftAutosave<T>({
  draftId,
  formData,
  onSave,
  debounceMs = 2000,
  autoSaveIntervalMs = 30000,
}: DraftAutosaveOptions<T>) {
  const [state, setState] = useState<DraftAutosaveState>({
    isSaving: false,
    lastSavedAt: null,
    error: null,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedDataRef = useRef<T>(formData);

  const performSave = useCallbackReact(async () => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await onSave(formData);
      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSavedAt: new Date(),
      }));
      lastSavedDataRef.current = formData;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [formData, onSave]);

  // Debounced save on form data change
  useEffect(() => {
    if (JSON.stringify(lastSavedDataRef.current) === JSON.stringify(formData)) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, debounceMs, performSave]);

  // Interval-based autosave
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (JSON.stringify(lastSavedDataRef.current) !== JSON.stringify(formData)) {
        performSave();
      }
    }, autoSaveIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [formData, autoSaveIntervalMs, performSave]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (JSON.stringify(lastSavedDataRef.current) !== JSON.stringify(formData)) {
        performSave();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, performSave]);

  return state;
}
