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
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, Loader2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Extend the Profile type to include the is_rejected field
interface ExtendedProfile extends Profile {
  is_rejected?: boolean;
}

type DoctorWithProfile = Doctor & {
  profile: ExtendedProfile;
};

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithProfile[]>(
    []
  );
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(
    null
  );
  const [debugInfo, setDebugInfo] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setDebugInfo('Fetching doctors...');
    const supabase = createClient();

    try {
      // First, let's check if there are any doctor profiles in the database
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, is_approved')
        .eq('role', 'doctor');

      if (profilesError) {
        setDebugInfo(`Error checking profiles: ${profilesError.message}`);
        toast.error('Failed to check doctor profiles');
        return;
      }

      setDebugInfo(
        `Found ${profilesData?.length || 0} doctor profiles: ${JSON.stringify(profilesData)}`
      );

      // Now fetch the doctors data with profiles
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
        setDebugInfo(`Error fetching doctors: ${error.message}`);
        toast.error('Failed to load doctors: ' + error.message);
      } else {
        setDebugInfo(`Received doctor data: ${JSON.stringify(data)}`);

        if (data && data.length > 0) {
          const formattedDoctors = data.map((doc) => ({
            ...doc,
            profile: doc.profile as ExtendedProfile,
          })) as DoctorWithProfile[];

          setDoctors(formattedDoctors);
          setFilteredDoctors(formattedDoctors);
          setDebugInfo(`Processed ${formattedDoctors.length} doctors`);
        } else {
          setDebugInfo('No doctors found in the database');
          setDoctors([]);
          setFilteredDoctors([]);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`Exception fetching doctors: ${errorMessage}`);
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctor accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = doctors.filter(
      (doctor) =>
        doctor.profile.first_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        doctor.profile.last_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [searchTerm, doctors]);

  const handleApproveDoctor = async (doctorId: string, profileId: string) => {
    setProcessingDoctorId(doctorId);
    const supabase = createClient();

    try {
      // Update the profile to mark as approved
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', profileId);

      if (error) {
        toast.error('Failed to approve doctor: ' + error.message);
        return;
      }

      // Refresh the doctors list
      await fetchDoctors();
      toast.success('Doctor account approved successfully');
    } catch (error) {
      console.error('Error approving doctor:', error);
      toast.error('Failed to approve doctor account');
    } finally {
      setProcessingDoctorId(null);
    }
  };

  const handleRejectDoctor = async (doctorId: string, profileId: string) => {
    setProcessingDoctorId(doctorId);
    const supabase = createClient();

    try {
      // You could either delete the doctor entry or mark it as rejected
      // Here we'll set a "rejected" flag in the profile
      const { error } = await supabase
        .from('profiles')
        .update({ is_rejected: true })
        .eq('id', profileId);

      if (error) {
        toast.error('Failed to reject doctor: ' + error.message);
        return;
      }

      // Refresh the doctors list
      await fetchDoctors();
      toast.success('Doctor account rejected');
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      toast.error('Failed to reject doctor account');
    } finally {
      setProcessingDoctorId(null);
    }
  };

  const navigateToDetailView = (doctorId: string) => {
    router.push(`/admin/doctor-approval?id=${doctorId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctor Accounts</h1>
          <p className="text-muted-foreground">
            Review and approve doctor accounts
          </p>
        </div>
        <Button onClick={fetchDoctors} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Debug information */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40">
            {debugInfo}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Accounts</CardTitle>
          <CardDescription>
            Review doctor credentials and approve their accounts
          </CardDescription>

          <div className="flex items-center relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, specialty, or license..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      Dr. {doctor.profile.first_name} {doctor.profile.last_name}
                    </TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.license_number}</TableCell>
                    <TableCell>
                      {doctor.profile.is_approved ? (
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
                    <TableCell>
                      {new Date(doctor.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToDetailView(doctor.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>

                        {!doctor.profile.is_approved &&
                          !doctor.profile.is_rejected && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  handleApproveDoctor(
                                    doctor.id,
                                    doctor.profile.id
                                  )
                                }
                                disabled={processingDoctorId === doctor.id}
                              >
                                {processingDoctorId === doctor.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleRejectDoctor(
                                    doctor.id,
                                    doctor.profile.id
                                  )
                                }
                                disabled={processingDoctorId === doctor.id}
                              >
                                {processingDoctorId === doctor.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                            </>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm
                      ? 'No doctors match your search'
                      : 'No doctor accounts found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
