'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Doctor } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  Card,
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
import {
  Search,
  CheckCircle,
  AlertCircle,
  User,
  UserCheck,
  UserX,
  Mail,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type DoctorWithProfile = Doctor & {
  profile: Profile;
};

export default function DoctorApproval() {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithProfile[]>(
    []
  );
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorWithProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // Join doctors with profiles to get all the information
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
        // Convert to our expected type format
        const doctorsWithProfiles = data.map((doc) => ({
          ...doc,
          profile: doc.profile as Profile,
        })) as DoctorWithProfile[];

        setDoctors(doctorsWithProfiles);
        applyFilters(doctorsWithProfiles, searchTerm, activeTab);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters(doctors, searchTerm, activeTab);
  }, [searchTerm, activeTab, doctors]);

  const applyFilters = (
    doctorsList: DoctorWithProfile[],
    search: string,
    tab: string
  ) => {
    let filtered = doctorsList;

    // Filter by tab
    if (tab === 'pending') {
      filtered = filtered.filter((doc) => doc.profile.is_approved === false);
    } else if (tab === 'approved') {
      filtered = filtered.filter((doc) => doc.profile.is_approved === true);
    }

    // Filter by search term
    if (search) {
      filtered = filtered.filter(
        (doc) =>
          doc.profile.first_name.toLowerCase().includes(search.toLowerCase()) ||
          doc.profile.last_name.toLowerCase().includes(search.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
          doc.license_number.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const openDoctorDetail = (doctor: DoctorWithProfile) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleApproval = async (doctorId: string, approved: boolean) => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Update the is_approved status in the profile
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approved })
        .eq('id', doctorId);

      if (error) {
        throw error;
      }

      // Show success message
      toast.success(
        approved
          ? 'Doctor account has been approved successfully'
          : 'Doctor account has been rejected'
      );

      // Close the dialog
      setDialogOpen(false);

      // Refresh the doctor list
      fetchDoctors();
    } catch (error) {
      console.error('Error updating doctor approval:', error);
      toast.error('Failed to update doctor approval status');
    } finally {
      setLoading(false);
    }
  };

  const emailDoctor = async (email: string) => {
    // In a real application, this would open an email client or send an email
    // For now, we'll just copy the email to the clipboard
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Email address copied to clipboard');
    } catch (error) {
      console.error('Failed to copy email:', error);
      toast.error('Failed to copy email address');
    }
  };

  if (loading && doctors.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight">Doctor Approval</h1>
          <p className="text-muted-foreground">
            Review and approve doctor registration requests
          </p>
        </div>
        <Button variant="outline" onClick={fetchDoctors}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Registration Requests</CardTitle>
          <CardDescription>
            Review and approve doctor accounts before they can access the system
          </CardDescription>

          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs
            defaultValue="pending"
            className="mt-6"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Pending
                </div>
              </TabsTrigger>
              <TabsTrigger value="approved">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approved
                </div>
              </TabsTrigger>
              <TabsTrigger value="all">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  All
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <DoctorTable
                doctors={filteredDoctors}
                openDoctorDetail={openDoctorDetail}
                emptyMessage="No pending doctor registrations"
              />
            </TabsContent>

            <TabsContent value="approved">
              <DoctorTable
                doctors={filteredDoctors}
                openDoctorDetail={openDoctorDetail}
                emptyMessage="No approved doctors"
              />
            </TabsContent>

            <TabsContent value="all">
              <DoctorTable
                doctors={filteredDoctors}
                openDoctorDetail={openDoctorDetail}
                emptyMessage="No doctors found"
              />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Doctor Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <DialogTitle>Doctor Registration Details</DialogTitle>
                <DialogDescription>
                  Review the doctor's information before approving or rejecting
                  their registration
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Personal Information
                    </h3>
                    <p className="text-lg font-medium">
                      {selectedDoctor.profile.first_name}{' '}
                      {selectedDoctor.profile.last_name}
                    </p>
                    {selectedDoctor.profile.phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {selectedDoctor.profile.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedDoctor.profile.is_approved ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Professional Information
                    </h3>
                    <p className="text-base">
                      <span className="font-medium">Specialty:</span>{' '}
                      {selectedDoctor.specialty}
                    </p>
                    <p className="text-base">
                      <span className="font-medium">License Number:</span>{' '}
                      {selectedDoctor.license_number}
                    </p>
                    {selectedDoctor.years_of_experience && (
                      <p className="text-base">
                        <span className="font-medium">Experience:</span>{' '}
                        {selectedDoctor.years_of_experience} years
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Registration Date
                    </h3>
                    <p className="text-base">
                      {new Date(selectedDoctor.created_at).toLocaleDateString()}{' '}
                      (
                      {new Date(selectedDoctor.created_at).toLocaleTimeString()}
                      )
                    </p>
                  </div>
                </div>

                {selectedDoctor.bio && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Doctor Bio
                    </h3>
                    <p className="mt-1 text-base">{selectedDoctor.bio}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => emailDoctor(selectedDoctor.id)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Doctor
                </Button>

                <div className="flex-1"></div>

                {!selectedDoctor.profile.is_approved ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center"
                      onClick={() =>
                        handleApproval(selectedDoctor.profile.id, false)
                      }
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center"
                      onClick={() =>
                        handleApproval(selectedDoctor.profile.id, true)
                      }
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center"
                    onClick={() =>
                      handleApproval(selectedDoctor.profile.id, false)
                    }
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Revoke Approval
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for doctor table
function DoctorTable({
  doctors,
  openDoctorDetail,
  emptyMessage,
}: {
  doctors: DoctorWithProfile[];
  openDoctorDetail: (doctor: DoctorWithProfile) => void;
  emptyMessage: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Specialty</TableHead>
          <TableHead>License</TableHead>
          <TableHead>Registered On</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.length > 0 ? (
          doctors.map((doctor) => (
            <TableRow key={doctor.id}>
              <TableCell className="font-medium">
                {doctor.profile.first_name} {doctor.profile.last_name}
              </TableCell>
              <TableCell>{doctor.specialty}</TableCell>
              <TableCell>{doctor.license_number}</TableCell>
              <TableCell>
                {new Date(doctor.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {doctor.profile.is_approved ? (
                  <Badge className="bg-green-100 text-green-800">
                    Approved
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDoctorDetail(doctor)}
                >
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
