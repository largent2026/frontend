'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contactApi } from '@/lib/api';

export function ContactForm() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDone('idle');
    try {
      await contactApi.submit({ firstName, lastName, email, message, website });
      setDone('success');
      setFirstName('');
      setLastName('');
      setEmail('');
      setMessage('');
    } catch {
      setDone('error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'mb-1 block text-sm font-medium text-foreground';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-firstName" className={labelClass}>
            {t('contact.firstName')} *
          </label>
          <input
            id="contact-firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="contact-lastName" className={labelClass}>
            {t('contact.lastName')}
          </label>
          <input
            id="contact-lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
            autoComplete="family-name"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-email" className={labelClass}>
          {t('contact.email')} *
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          {t('contact.message')} *
        </label>
        <textarea
          id="contact-message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {done === 'success' && (
        <p className="text-sm text-green-600 dark:text-green-400">{t('contact.success')}</p>
      )}
      {done === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400">{t('contact.error')}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t('contact.sending') : t('contact.send')}
      </button>
    </form>
  );
}
