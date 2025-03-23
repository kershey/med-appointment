import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  Clock,
  Users,
  Stethoscope,
  CreditCard,
  ClipboardCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Your Health Journey,{' '}
                <span className="text-primary">Simplified</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Schedule appointments, access your medical records, and connect
                with healthcare professionals in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link href="/appointments">Book an Appointment</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/doctors">Our Doctors</Link>
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="w-full h-96 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg shadow-lg"></div>
              {/* Placeholder for hero image */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive healthcare services to meet your needs
              with convenience and care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Easy Scheduling</CardTitle>
                <CardDescription>
                  Book appointments online at your convenience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Choose your preferred doctor, date, and time slot. Receive
                  confirmation and reminders automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Stethoscope className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Expert Doctors</CardTitle>
                <CardDescription>
                  Consult with experienced healthcare professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our team of qualified doctors provide personalized care
                  tailored to your specific health needs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <ClipboardCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Access your health information securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View your medical history, prescriptions, and diagnostic
                  results all in one secure platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Queue Management</CardTitle>
                <CardDescription>
                  Save time with streamlined clinic visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get real-time updates on queue status and receive your queue
                  number upon confirmation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CreditCard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Online Payments</CardTitle>
                <CardDescription>
                  Secure and convenient payment options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Pay for your appointments online using secure payment gateways
                  and receive electronic receipts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Family Health</CardTitle>
                <CardDescription>
                  Manage healthcare for the entire family
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Create profiles for family members and manage appointments and
                  records all in one account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of patients who have simplified their healthcare
            journey with our platform.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/register">Create an Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MedClinic</h3>
              <p className="text-gray-400">
                Providing quality healthcare services with modern technology for
                a better patient experience.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/doctors"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Our Doctors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Patient Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/appointments"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Book Appointment
                  </Link>
                </li>
                <li>
                  <Link
                    href="/patient/dashboard"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Patient Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <address className="text-gray-400 not-italic">
                <p>123 Healthcare Ave.</p>
                <p>Medical District, City</p>
                <p>Phone: (123) 456-7890</p>
                <p>Email: info@medclinic.com</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} MedClinic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
