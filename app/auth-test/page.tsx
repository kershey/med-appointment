'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';

export default function AuthTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const testAuthDirectly = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing direct authentication with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Direct auth error:', error);
        setResult({ error: error.message, status: error.status });
      } else {
        console.log('Direct auth success:', data);
        setResult({
          success: true,
          user: data.user,
          session: {
            accessToken: data.session?.access_token
              ? `${data.session.access_token.substring(0, 10)}...`
              : null,
            expiresAt: data.session?.expires_at,
          },
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testAuthAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing authentication via API with:', email);
      const response = await fetch('/api/auth-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API response:', data);
      setResult(data);
    } catch (error) {
      console.error('API error:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={testAuthDirectly} disabled={loading}>
                {loading ? 'Testing...' : 'Test Direct Authentication'}
              </Button>

              <Button
                onClick={testAuthAPI}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Testing...' : 'Test via API'}
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
