'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorManagement() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the doctor approval page which has more features
    router.push('/admin/doctor-approval');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      <p className="ml-2">Redirecting to Doctor Approval...</p>
    </div>
  );
}
