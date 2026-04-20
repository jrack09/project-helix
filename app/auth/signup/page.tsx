'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setMessage('Check your email to confirm your account.');
  }

  return (
    <main className="container stack" style={{ paddingTop: 64 }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} className="card stack" style={{ maxWidth: 480 }}>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {message ? <p style={{ color: 'green' }}>{message}</p> : null}
        <button className="button" type="submit">Create account</button>
      </form>
      <p className="muted">Already have an account? <Link href="/auth/login">Login</Link></p>
    </main>
  );
}
