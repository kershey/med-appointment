'use client';

import { useState } from 'react';
import { Search, Plus, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  lastVisit?: string;
}

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      fullName.includes(query) ||
      (patient.email && patient.email.toLowerCase().includes(query)) ||
      (patient.phone && patient.phone.includes(query))
    );
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Patients</CardTitle>
            <CardDescription>
              Manage your patient records and medical history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/dashboard/patients/add">
                <Plus className="mr-2 h-4 w-4" /> New Patient
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPatients.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                          <UserRound className="h-4 w-4" />
                        </div>
                        {patient.firstName} {patient.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>{patient.dateOfBirth || '-'}</TableCell>
                    <TableCell>{patient.lastVisit || 'No visits'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserRound className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No patients found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? `No patients matching "${searchQuery}"`
                : "You haven't added any patients yet"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/dashboard/patients/add">
                  <Plus className="mr-2 h-4 w-4" /> Add Patient
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      </CardFooter>
    </Card>
  );
}
