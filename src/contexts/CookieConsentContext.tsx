'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE_DAYS = 365;

export type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readStored(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

function writeStored(state: ConsentState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; path=/; max-age=${COOKIE_MAX_AGE_DAYS * 24 * 3600}; SameSite=Lax`;
}

type ContextValue = {
  consent: ConsentState | null;
  setConsent: (state: ConsentState) => void;
  openBanner: () => void;
  showBanner: boolean;
  setShowBanner: (v: boolean) => void;
};

const CookieConsentContext = createContext<ContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setConsentState(stored);
    if (!stored) setShowBanner(true);
  }, []);

  const setConsent = useCallback((state: ConsentState) => {
    const next = { ...state, necessary: true };
    writeStored(next);
    setConsentState(next);
    setShowBanner(false);
  }, []);

  const openBanner = useCallback(() => setShowBanner(true), []);

  return (
    <CookieConsentContext.Provider
      value={{ consent, setConsent, openBanner, showBanner, setShowBanner }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
