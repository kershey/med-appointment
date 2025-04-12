'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import Link from 'next/link';

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'canceled' | 'completed' | 'no_show';
}

interface AppointmentsByDate {
  [date: string]: Appointment[];
}

interface AppointmentCalendarProps {
  appointments?: AppointmentsByDate;
  isDoctor?: boolean;
}

export function AppointmentCalendar({
  appointments = {},
  isDoctor = true,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const formattedSelectedDate = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : '';

  const selectedDateAppointments = appointments[formattedSelectedDate] || [];

  // Get count of appointments for each day
  const getAppointmentCount = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    return appointments[formattedDay]?.length || 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">Appointments</h2>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 lg:flex">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {isDoctor && (
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard/availability">Manage Availability</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-md font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-sm font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-1">
            {daysInMonth.map((day) => {
              const appointmentCount = getAppointmentCount(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    h-10 w-full flex flex-col items-center justify-center rounded
                    text-sm p-0 relative
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                    ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                    ${
                      selectedDate &&
                      isSameDay(day, selectedDate) &&
                      !isToday(day)
                        ? 'bg-muted'
                        : ''
                    }
                    ${
                      isCurrentMonth &&
                      !isToday(day) &&
                      !(selectedDate && isSameDay(day, selectedDate))
                        ? 'hover:bg-muted'
                        : ''
                    }
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  {appointmentCount > 0 && (
                    <span
                      className={`absolute bottom-1 text-[0.65rem] font-medium ${
                        isToday(day)
                          ? 'text-primary-foreground'
                          : 'text-primary'
                      }`}
                    >
                      {appointmentCount} appt{appointmentCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-md font-medium">
              Appointments for {format(selectedDate, 'PPP')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {selectedDateAppointments.length > 0 ? (
              <div className="space-y-2">
                {selectedDateAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {appointment.patientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.time}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : appointment.status === 'completed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No appointments scheduled for this date
              </div>
            )}

            {isDoctor && (
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href={`/dashboard/appointments/create?date=${formattedSelectedDate}`}
                  >
                    Add Appointment
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
