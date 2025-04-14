'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Doctor } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';

type DoctorWithProfile = Doctor & {
  profile: Profile;
};

export default function FixDoctorApprovals() {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // Get doctors that might have inconsistent approval data
      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          *,
          profile:profiles(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load doctors: ' + error.message);
      } else if (data) {
        // Format data and find inconsistencies
        const doctorsWithProfiles = data.map((doc) => ({
          ...doc,
          profile: doc.profile as Profile,
        })) as DoctorWithProfile[];

        setDoctors(doctorsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fixDoctorApprovals = async () => {
    setFixing(true);
    const supabase = createClient();

    try {
      // 1. Make sure all approval flags are properly set
      await supabase.rpc('fix_doctor_approvals');

      // 2. Refresh the list to show fixed results
      await fetchDoctors();

      toast.success('Doctor approvals have been fixed successfully');

      // 3. Redirect back to the approval page
      router.push('/admin/doctor-approval');
    } catch (error) {
      console.error('Error fixing doctor approvals:', error);
      toast.error('Failed to fix doctor approvals');
    } finally {
      setFixing(false);
    }
  };

  const hasInconsistentData = (doctor: DoctorWithProfile) => {
    const { is_approved, is_rejected } = doctor.profile;

    // Check for inconsistent status
    return (
      (is_approved === true && is_rejected === true) ||
      is_approved === null ||
      is_rejected === null
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const inconsistentDoctors = doctors.filter(hasInconsistentData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Fix Doctor Approvals
          </h1>
          <p className="text-muted-foreground">
            Repair inconsistent doctor approval status in the database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDoctors}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={fixDoctorApprovals}
            disabled={fixing || inconsistentDoctors.length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Fix All Issues
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inconsistent Doctor Approvals</CardTitle>
          <CardDescription>
            These doctors have inconsistent approval settings that need to be
            fixed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inconsistentDoctors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inconsistentDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      Dr. {doctor.profile.first_name} {doctor.profile.last_name}
                    </TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.license_number}</TableCell>
                    <TableCell>
                      {doctor.profile.is_approved === true ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          Yes
                        </Badge>
                      ) : doctor.profile.is_approved === false ? (
                        <Badge variant="outline" className="bg-slate-50">
                          No
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700"
                        >
                          NULL
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {doctor.profile.is_rejected === true ? (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700"
                        >
                          Yes
                        </Badge>
                      ) : doctor.profile.is_rejected === false ? (
                        <Badge variant="outline" className="bg-slate-50">
                          No
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700"
                        >
                          NULL
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inconsistent
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">
                No inconsistent doctor approvals found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                All doctor approval statuses appear to be properly set
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Doctors</CardTitle>
          <CardDescription>
            Complete list of doctors in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Rejected</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">
                    Dr. {doctor.profile.first_name} {doctor.profile.last_name}
                  </TableCell>
                  <TableCell>{doctor.specialty}</TableCell>
                  <TableCell>
                    {doctor.profile.is_approved === true ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {doctor.profile.is_rejected === true ? (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasInconsistentData(doctor) ? (
                      <Badge className="bg-amber-100 text-amber-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inconsistent
                      </Badge>
                    ) : doctor.profile.is_approved ? (
                      <Badge className="bg-green-100 text-green-800">
                        Approved
                      </Badge>
                    ) : doctor.profile.is_rejected ? (
                      <Badge className="bg-red-100 text-red-800">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
