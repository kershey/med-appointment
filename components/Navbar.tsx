'use client';

import Link from 'next/link';
import { useState } from 'react';
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const navLinks = [
    { href: '/', label: 'Home', public: true },
    { href: '/doctors', label: 'Our Doctors', public: true },
    { href: '/services', label: 'Services', public: true },
    { href: '/appointments', label: 'Book Appointment', public: false },
    {
      href: '/patient/dashboard',
      label: 'My Health',
      public: false,
      roles: ['patient'],
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      public: false,
      roles: ['doctor', 'staff', 'admin'],
    },
  ];

  const filteredLinks = navLinks.filter((link) => {
    if (link.public) return true;
    if (!user) return false;
    if (link.roles) {
      return link.roles.some((role) => isRole(role as any));
    }
    return true;
  });

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
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                {isRole('patient') && (
                  <DropdownMenuItem asChild>
                    <Link href="/patient/appointments">My Appointments</Link>
                  </DropdownMenuItem>
                )}
                {isRole('patient') && (
                  <DropdownMenuItem asChild>
                    <Link href="/patient/medical-records">Medical Records</Link>
                  </DropdownMenuItem>
                )}
                {(isRole('doctor') || isRole('staff') || isRole('admin')) && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign up</Link>
              </Button>
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
              </div>
            ) : (
              <div className="pt-4 flex flex-col space-y-3">
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-primary transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Profile
                </Link>
                {isRole('patient') && (
                  <>
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
                )}
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
