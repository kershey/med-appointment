'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { testDatabaseConnection, checkSupabaseEnvVars } from '@/lib/utils';

type TestResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

interface EnvCheckVars {
  url: string;
  anonKey: string;
}

export default function AuthDebugPage() {
  const { user, signIn, signOut } = useAuth();
  const [dbTestResult, setDbTestResult] = useState<TestResult | null>(null);
  const [apiTestResult, setApiTestResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [rlsTestResult, setRlsTestResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [envCheckResult, setEnvCheckResult] = useState<{
    isValid: boolean;
    issues?: string[];
    vars: EnvCheckVars;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isRlsLoading, setIsRlsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  // Test direct database connection
  const testDirectConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testDatabaseConnection(supabase);
      setDbTestResult(result);
    } catch (error) {
      setDbTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test API endpoint
  const testApiConnection = async () => {
    setIsApiLoading(true);
    try {
      const response = await fetch('/api/database-test');
      const data = await response.json();
      setApiTestResult(data);
    } catch (error) {
      setApiTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsApiLoading(false);
    }
  };

  // Test RLS policies
  const testRlsPolicies = async () => {
    setIsRlsLoading(true);
    try {
      const response = await fetch('/api/rls-test');
      const data = await response.json();
      setRlsTestResult(data);
    } catch (error) {
      setRlsTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRlsLoading(false);
    }
  };

  // Check environment variables
  const checkEnvVars = () => {
    const result = checkSupabaseEnvVars();
    // Casting the result to match the expected type
    setEnvCheckResult(
      result as {
        isValid: boolean;
        issues?: string[];
        vars: EnvCheckVars;
      }
    );
  };

  // Test login
  const handleLogin = async () => {
    try {
      const result = await signIn(email, password);
      if (result?.error) {
        alert(`Login error: ${result.error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(
        `Login error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Database &amp; Auth Debug</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Current Authentication Status
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current user session information</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div>
                <p className="mb-2">
                  <strong>Logged in as:</strong> {user.email}
                </p>
                <p className="mb-2">
                  <strong>User ID:</strong> {user.id}
                </p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto mt-4">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            ) : (
              <p>Not logged in</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {user ? (
              <Button onClick={() => signOut()}>Sign Out</Button>
            ) : (
              <div className="space-y-4 w-full">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                  />
                </div>
                <Button onClick={handleLogin}>Sign In</Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="direct">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="direct">Direct Connection</TabsTrigger>
          <TabsTrigger value="api">API Connection</TabsTrigger>
          <TabsTrigger value="rls">RLS Test</TabsTrigger>
          <TabsTrigger value="env">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Direct Database Connection Test</CardTitle>
              <CardDescription>
                Tests the connection directly from the client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbTestResult && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Test Result:</h3>
                  <div
                    className={`p-4 rounded ${
                      dbTestResult.success
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    <p className="font-semibold">
                      {dbTestResult.success
                        ? '✅ Connection Successful'
                        : '❌ Connection Failed'}
                    </p>
                    {!dbTestResult.success && (
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        {dbTestResult.error}
                      </p>
                    )}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto mt-4">
                    {JSON.stringify(dbTestResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testDirectConnection} disabled={isLoading}>
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Database Connection Test</CardTitle>
              <CardDescription>
                Tests the connection through a server API route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiTestResult && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Test Result:</h3>
                  <div
                    className={`p-4 rounded ${
                      apiTestResult.success
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    <p className="font-semibold">
                      {apiTestResult.success
                        ? '✅ Connection Successful'
                        : '❌ Connection Failed'}
                    </p>
                    {!apiTestResult.success && apiTestResult.error && (
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        {typeof apiTestResult.error === 'string'
                          ? apiTestResult.error
                          : JSON.stringify(apiTestResult.error)}
                      </p>
                    )}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto mt-4">
                    {JSON.stringify(apiTestResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testApiConnection} disabled={isApiLoading}>
                {isApiLoading ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="rls">
          <Card>
            <CardHeader>
              <CardTitle>Row Level Security Test</CardTitle>
              <CardDescription>
                Tests access to tables with RLS policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rlsTestResult && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Test Result:</h3>
                  <div
                    className={`p-4 rounded ${
                      rlsTestResult.success
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    <p className="font-semibold">
                      {rlsTestResult.success
                        ? '✅ RLS Test Completed'
                        : '❌ RLS Test Failed'}
                    </p>
                    {!rlsTestResult.success && rlsTestResult.error && (
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        {typeof rlsTestResult.error === 'string'
                          ? rlsTestResult.error
                          : JSON.stringify(rlsTestResult.error)}
                      </p>
                    )}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto mt-4">
                    {JSON.stringify(rlsTestResult, null, 2)}
                  </pre>
                </div>
              )}
              <div className="mt-4">
                <p className="mb-2">
                  <strong>Note:</strong> RLS tests check your ability to access
                  various tables based on your current authentication status and
                  role. If you&apos;re seeing permission errors, this might
                  indicate that your RLS policies are working correctly to
                  prevent unauthorized access.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={testRlsPolicies} disabled={isRlsLoading}>
                {isRlsLoading ? 'Testing RLS...' : 'Test RLS Policies'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Check</CardTitle>
              <CardDescription>
                Checks if Supabase environment variables are configured
                correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              {envCheckResult && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Check Result:</h3>
                  <div
                    className={`p-4 rounded ${
                      envCheckResult.isValid
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    <p className="font-semibold">
                      {envCheckResult.isValid
                        ? '✅ Environment Variables Valid'
                        : '❌ Environment Issues Found'}
                    </p>
                    {!envCheckResult.isValid && envCheckResult.issues && (
                      <div className="text-red-600 dark:text-red-400 mt-2">
                        <p className="font-semibold">Issues:</p>
                        <ul className="list-disc ml-6">
                          {envCheckResult.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Environment Variables:</h4>
                    <ul className="list-disc ml-6">
                      <li>
                        <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
                        {envCheckResult.vars.url}
                      </li>
                      <li>
                        <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
                        {envCheckResult.vars.anonKey}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <p>
                  This check verifies that your Supabase environment variables
                  are set and appear to be in the correct format. For security
                  reasons, only the first few characters of each value are
                  shown.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={checkEnvVars}>
                Check Environment Variables
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
