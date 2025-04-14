'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut, isRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Automatically sign out doctors with pending approval
  // This provides an extra layer of protection
  useEffect(() => {
    // Only run this effect if we have user and profile data
    if (user && profile) {
      // If this is a doctor with pending approval
      if (profile.role === 'doctor' && profile.is_approved === false) {
        // Check if we're not already on the registration success page
        if (!pathname.includes('/auth/doctor/registration-success')) {
          console.log('Auto-signing out unapproved doctor from navbar');
          // Sign them out automatically
          signOut();
        }
      }
    }
  }, [user, profile, pathname, signOut]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Define navigation links for each role
  const commonLinks = [
    { href: '/', label: 'Home', public: true },
    { href: '/doctors', label: 'Our Doctors', public: true },
    { href: '/services', label: 'Services', public: true },
  ];

  const patientLinks = [
    { href: '/appointments', label: 'Book Appointment', public: false },
    { href: '/patient/dashboard', label: 'My Health', public: false },
  ];

  const doctorLinks = [
    { href: '/dashboard', label: 'Dashboard', public: false },
    { href: '/appointments/manage', label: 'My Schedule', public: false },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin Dashboard', public: false },
    {
      href: '/admin/doctor-approval',
      label: 'Doctor Approvals',
      public: false,
    },
  ];

  // Combine links based on user role
  let navLinks = [...commonLinks];

  if (user && profile) {
    if (isRole('patient')) {
      navLinks = [...navLinks, ...patientLinks];
    } else if (isRole('doctor')) {
      navLinks = [...navLinks, ...doctorLinks];
    } else if (isRole('admin')) {
      navLinks = [...navLinks, ...adminLinks];
    }

    // Don't add any role-specific links for unapproved doctors
    // This is already handled by isRole() which checks approval status
  }

  const filteredLinks = navLinks.filter((link) => {
    if (link.public) return true;
    if (!user) return false;
    return true;
  });

  // Get dropdown menu items based on role
  const getDropdownMenuItems = () => {
    // Check if user is a doctor with pending approval
    if (profile?.role === 'doctor' && profile?.is_approved === false) {
      return (
        <>
          <DropdownMenuLabel>Pending Approval</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-orange-600">
            Your doctor account is awaiting approval
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
        </>
      );
    }

    const commonItems = (
      <>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
      </>
    );

    if (isRole('patient')) {
      return (
        <>
          {commonItems}
          <DropdownMenuItem asChild>
            <Link href="/patient/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/patient/appointments">My Appointments</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/patient/medical-records">Medical Records</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
        </>
      );
    } else if (isRole('doctor')) {
      return (
        <>
          {commonItems}
          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/appointments/manage">My Schedule</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/patients">My Patients</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
        </>
      );
    } else if (isRole('admin')) {
      return (
        <>
          {commonItems}
          <DropdownMenuItem asChild>
            <Link href="/admin">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/doctor-approval">Doctor Approvals</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
        </>
      );
    } else {
      // Default items for staff or unknown roles
      return (
        <>
          {commonItems}
          <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
        </>
      );
    }
  };

  // Get mobile menu items based on role
  const getMobileMenuItems = () => {
    const commonItems = (
      <Link
        href="/profile"
        className="text-gray-600 hover:text-primary transition-colors"
        onClick={toggleMobileMenu}
      >
        Profile
      </Link>
    );

    // Check if user is a doctor with pending approval
    if (profile?.role === 'doctor' && profile?.is_approved === false) {
      return (
        <>
          <div className="text-orange-600 py-2 font-semibold">
            Your doctor account is awaiting approval
          </div>
          {commonItems}
        </>
      );
    }

    if (isRole('patient')) {
      return (
        <>
          {commonItems}
          <Link
            href="/patient/dashboard"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            Dashboard
          </Link>
          <Link
            href="/patient/appointments"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            My Appointments
          </Link>
          <Link
            href="/patient/medical-records"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            Medical Records
          </Link>
        </>
      );
    } else if (isRole('doctor')) {
      return (
        <>
          {commonItems}
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            Dashboard
          </Link>
          <Link
            href="/appointments/manage"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            My Schedule
          </Link>
          <Link
            href="/patients"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            My Patients
          </Link>
        </>
      );
    } else if (isRole('admin')) {
      return (
        <>
          {commonItems}
          <Link
            href="/admin"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/doctor-approval"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            Doctor Approvals
          </Link>
          <Link
            href="/admin/settings"
            className="text-gray-600 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
          >
            System Settings
          </Link>
        </>
      );
    } else {
      return commonItems;
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            MedClinic
          </Link>

          <div className="hidden md:flex ml-10 space-x-6">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href
                    ? 'text-primary font-medium'
                    : 'text-gray-600 hover:text-primary'
                } transition-colors`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            profile?.role === 'doctor' && profile?.is_approved === false ? (
              // For doctors with pending approval, only show the sign out button
              <>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign out
                </Button>
              </>
            ) : (
              // For approved users, show the profile dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={profile?.avatar_url || ''}
                        alt={profile?.first_name || ''}
                      />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {getDropdownMenuItems()}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign up</Link>
              </Button>
              <Link
                href="/auth/admin/login"
                className="text-xs text-muted-foreground hover:text-primary ml-2"
              >
                Admin
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 px-6">
          <div className="flex flex-col space-y-4">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href
                    ? 'text-primary font-medium'
                    : 'text-gray-600 hover:text-primary'
                } transition-colors`}
                onClick={toggleMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            {!user ? (
              <div className="pt-4 flex flex-col space-y-3">
                <Button variant="outline" asChild>
                  <Link href="/auth/login" onClick={toggleMobileMenu}>
                    Log in
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register" onClick={toggleMobileMenu}>
                    Sign up
                  </Link>
                </Button>
                <Link
                  href="/auth/admin/login"
                  className="text-xs text-center text-muted-foreground hover:text-primary pt-2"
                  onClick={toggleMobileMenu}
                >
                  Admin Login
                </Link>
              </div>
            ) : profile?.role === 'doctor' && profile?.is_approved === false ? (
              // For doctors with pending approval
              <div className="pt-4 flex flex-col space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    signOut();
                    toggleMobileMenu();
                  }}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              // For approved users
              <div className="pt-4 flex flex-col space-y-3">
                {getMobileMenuItems()}
                <Button
                  variant="destructive"
                  onClick={() => {
                    signOut();
                    toggleMobileMenu();
                  }}
                >
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
