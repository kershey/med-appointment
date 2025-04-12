'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours, parse } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

const timeSlots = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];

const appointmentSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().min(1, 'Patient name is required'),
  patientEmail: z.string().email('Please enter a valid email').optional(),
  patientPhone: z.string().optional(),
  date: z.date({
    required_error: 'Please select a date',
  }),
  startTime: z.string({
    required_error: 'Please select a time',
  }),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
  status: z
    .enum(['scheduled', 'confirmed', 'canceled', 'completed', 'no_show'])
    .default('scheduled'),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormValues>;
  onSubmit: (data: AppointmentFormValues) => Promise<void>;
  doctorId: string;
}

export function AppointmentForm({
  initialData,
  onSubmit,
  doctorId,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      reason: '',
      notes: '',
      status: 'scheduled',
      ...initialData,
    },
  });

  const calculateEndTime = (startTimeStr: string) => {
    try {
      if (!startTimeStr) return '';

      // Parse the start time string to a Date object
      const startTime = parse(startTimeStr, 'HH:mm', new Date());

      // Add 30 minutes to get the end time
      const endTime = addHours(startTime, 0.5);

      // Format the end time back to a string
      return format(endTime, 'HH:mm');
    } catch (error) {
      console.error('Error calculating end time:', error);
      return '';
    }
  };

  const handleSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Calculate end time
      const endTime = calculateEndTime(data.startTime);

      // Create complete data object with doctorId and endTime
      const completeData = {
        ...data,
        doctorId,
        endTime,
      };

      await onSubmit(completeData);
      toast.success('Appointment saved successfully');
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast.error('Failed to save appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Appointment</CardTitle>
        <CardDescription>Book a new appointment with a patient</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="patient@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="patientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(123) 456-7890" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full flex justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Select a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Time *</FormLabel>
                    <Popover
                      open={timePopoverOpen}
                      onOpenChange={setTimePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full flex justify-start text-left font-normal"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            {field.value ? (
                              <>
                                {field.value} - {calculateEndTime(field.value)}
                              </>
                            ) : (
                              <span>Select a time</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-2">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              variant={
                                field.value === time ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                field.onChange(time);
                                setTimePopoverOpen(false);
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="E.g., Annual checkup, Follow-up, New patient consultation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any special instructions or information about the appointment"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="canceled">Canceled</option>
                      <option value="completed">Completed</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pb-0">
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? 'Saving...' : 'Save Appointment'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
