import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { CookieOptions } from '@supabase/ssr';

export async function updateSession(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Get cookie settings from environment variables with fallbacks
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const cookieSameSite = process.env.COOKIE_SAME_SITE || 'lax';
  const cookieSecure = process.env.COOKIE_SECURE === 'true';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Configure cookie options specifically for localhost
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: cookieSameSite as 'lax' | 'strict' | 'none',
            secure: cookieSecure,
          };

          // Only set domain if explicitly provided in env vars
          if (cookieDomain) {
            Object.assign(cookieOptions, { domain: cookieDomain });
          }

          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Use the same cookie options when removing
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: cookieSameSite as 'lax' | 'strict' | 'none',
            secure: cookieSecure,
          };

          if (cookieDomain) {
            Object.assign(cookieOptions, { domain: cookieDomain });
          }

          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          });
        },
      },
    }
  );

  // This triggers the auth cookies to be updated
  await supabase.auth.getUser();

  return response;
}
