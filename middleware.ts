import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from './lib/supabase/middleware';

// Define protected routes that require authentication and role checking
const doctorRoutes = [
  '/dashboard/doctor',
  '/dashboard/doctor/patients',
  '/dashboard/doctor/appointments',
  '/dashboard/doctor/medical-records',
  '/dashboard/doctor/finances',
];

// Dashboard routes that should be accessible only by doctors
const dashboardRoutes = [
  '/dashboard',
  '/dashboard/patients',
  '/dashboard/appointments',
  '/dashboard/medical-records',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get URL info
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Check if the path is a doctor-specific route
  const isDoctorRoute = doctorRoutes.some((route) => path.startsWith(route));
  const isDashboardRoute = dashboardRoutes.some((route) =>
    path.startsWith(route)
  );
  const isDoctorLoginPage = path === '/auth/doctor/login';
  const isPatientLoginPage = path === '/auth/login';
  const isDoctorRegisterPage = path === '/auth/doctor/register';

  // Handle authentication for registration success page
  if (path === '/auth/doctor/registration-success') {
    return res; // Allow access to this page without redirection
  }

  // Prevent logged-in users from accessing login/register pages
  if (session) {
    // Get the user profile to determine their role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If user is already logged in and tries to access a login page or register page
    if (isDoctorLoginPage || isPatientLoginPage || isDoctorRegisterPage) {
      if (profile?.role === 'doctor') {
        url.pathname = '/dashboard/doctor';
        return NextResponse.redirect(url);
      } else {
        // For non-doctor users, redirect to their appropriate area
        // This would need to be updated when patient dashboard is created
        url.pathname = '/'; // Temporarily redirect to home
        return NextResponse.redirect(url);
      }
    }
  }

  // Handle authentication check for doctor routes and dashboard routes
  if (!session && (isDoctorRoute || isDashboardRoute)) {
    // Redirect to doctor login page
    url.pathname = '/auth/doctor/login';
    return NextResponse.redirect(url);
  }

  // If logged in, get user role
  if (session) {
    // Get user profile from database to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Handle non-doctors trying to access doctor routes or dashboard routes
    if ((isDoctorRoute || isDashboardRoute) && profile?.role !== 'doctor') {
      url.pathname = '/access-denied';
      return NextResponse.redirect(url);
    }

    // Handle doctors accessing regular dashboard routes - redirect them to doctor dashboard
    if (isDashboardRoute && profile?.role === 'doctor') {
      if (path === '/dashboard') {
        url.pathname = '/dashboard/doctor';
        return NextResponse.redirect(url);
      } else {
        // For other dashboard routes, redirect to the doctor-specific version
        url.pathname = path.replace('/dashboard', '/dashboard/doctor');
        return NextResponse.redirect(url);
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboard/doctor/:path*',
    '/auth/doctor/login',
    '/auth/doctor/register',
    '/auth/doctor/registration-success',
    '/auth/login',
  ],
};
