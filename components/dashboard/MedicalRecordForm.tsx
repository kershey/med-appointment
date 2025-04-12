'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Schema for prescription item
const prescriptionSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  notes: z.string().optional(),
});

// Schema for the entire form
const medicalRecordSchema = z.object({
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  prescriptions: z.array(prescriptionSchema).optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;
type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;

const defaultPrescription: PrescriptionFormValues = {
  medicationName: '',
  dosage: '',
  frequency: '',
  duration: '',
  notes: '',
};

interface MedicalRecordFormProps {
  patientId: string;
  appointmentId?: string;
  initialData?: MedicalRecordFormValues;
  onSubmit: (data: MedicalRecordFormValues) => Promise<void>;
}

export function MedicalRecordForm({
  patientId,
  appointmentId,
  initialData,
  onSubmit,
}: MedicalRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionFormValues[]>(
    initialData?.prescriptions || []
  );

  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: initialData || {
      diagnosis: '',
      treatment: '',
      notes: '',
      prescriptions: [],
    },
  });

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { ...defaultPrescription }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (
    index: number,
    field: keyof PrescriptionFormValues,
    value: string
  ) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value,
    };
    setPrescriptions(updatedPrescriptions);
  };

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    try {
      setIsSubmitting(true);

      // Include the prescriptions from our state and the IDs
      const completeData = {
        ...data,
        prescriptions,
        patientId,
        appointmentId,
      };

      await onSubmit(completeData);
      toast.success('Medical record saved successfully');
    } catch (error) {
      console.error('Error submitting medical record:', error);
      toast.error('Failed to save medical record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Record</CardTitle>
        <CardDescription>
          Record diagnosis, treatment plan, and prescriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter patient diagnosis"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Plan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter treatment plan details"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Prescriptions</FormLabel>
                <Button
                  type="button"
                  onClick={addPrescription}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Prescription
                </Button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  No prescriptions added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((prescription, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-md space-y-4 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrescription(index)}
                        className="absolute top-2 right-2 h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel className="text-sm">
                            Medication *
                          </FormLabel>
                          <Input
                            value={prescription.medicationName}
                            onChange={(e) =>
                              updatePrescription(
                                index,
                                'medicationName',
                                e.target.value
                              )
                            }
                            placeholder="Medication name"
                          />
                        </div>
                        <div>
                          <FormLabel className="text-sm">Dosage *</FormLabel>
                          <Input
                            value={prescription.dosage}
                            onChange={(e) =>
                              updatePrescription(
                                index,
                                'dosage',
                                e.target.value
                              )
                            }
                            placeholder="e.g., 10mg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel className="text-sm">Frequency *</FormLabel>
                          <Input
                            value={prescription.frequency}
                            onChange={(e) =>
                              updatePrescription(
                                index,
                                'frequency',
                                e.target.value
                              )
                            }
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        <div>
                          <FormLabel className="text-sm">Duration *</FormLabel>
                          <Input
                            value={prescription.duration}
                            onChange={(e) =>
                              updatePrescription(
                                index,
                                'duration',
                                e.target.value
                              )
                            }
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>

                      <div>
                        <FormLabel className="text-sm">Notes</FormLabel>
                        <Textarea
                          value={prescription.notes}
                          onChange={(e) =>
                            updatePrescription(index, 'notes', e.target.value)
                          }
                          placeholder="Additional notes about this medication"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes or observations"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-4">
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
