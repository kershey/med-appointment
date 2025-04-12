'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    clinicName: 'Medical Clinic',
    contactEmail: 'contact@medical-clinic.com',
    contactPhone: '+1234567890',
    address: '123 Medical St, Health City, HC 12345',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    appointmentReminders: true,
    sendCancellationNotices: true,
  });

  const [workingHours, setWorkingHours] = useState({
    mondayStart: '09:00',
    mondayEnd: '17:00',
    tuesdayStart: '09:00',
    tuesdayEnd: '17:00',
    wednesdayStart: '09:00',
    wednesdayEnd: '17:00',
    thursdayStart: '09:00',
    thursdayEnd: '17:00',
    fridayStart: '09:00',
    fridayEnd: '17:00',
    saturdayStart: '09:00',
    saturdayEnd: '13:00',
    sundayStart: '',
    sundayEnd: '',
  });

  const handleGeneralSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('General settings saved successfully');
    }, 1000);
  };

  const handleNotificationSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Notification settings saved successfully');
    }, 1000);
  };

  const handleWorkingHoursSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Working hours saved successfully');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings for the medical clinic
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="hours">Working Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic information about your clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={generalSettings.clinicName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      clinicName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={generalSettings.contactEmail}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      contactEmail: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={generalSettings.contactPhone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      contactPhone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Clinic Address</Label>
                <Input
                  id="address"
                  value={generalSettings.address}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      address: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGeneralSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when notifications are sent to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send appointment notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      enableEmailNotifications: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send appointment notifications via SMS
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={notificationSettings.enableSmsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      enableSmsNotifications: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointmentReminders">
                    Appointment Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders 24 hours before appointments
                  </p>
                </div>
                <Switch
                  id="appointmentReminders"
                  checked={notificationSettings.appointmentReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      appointmentReminders: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cancellationNotices">
                    Cancellation Notices
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send notices when appointments are cancelled
                  </p>
                </div>
                <Switch
                  id="cancellationNotices"
                  checked={notificationSettings.sendCancellationNotices}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      sendCancellationNotices: checked,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNotificationSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Working Hours</CardTitle>
              <CardDescription>
                Set the default working hours for your clinic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Monday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Monday</Label>
                  <Input
                    type="time"
                    value={workingHours.mondayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        mondayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.mondayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        mondayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <Switch
                    checked={!!workingHours.mondayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        mondayStart: checked ? '09:00' : '',
                        mondayEnd: checked ? '17:00' : '',
                      })
                    }
                  />
                </div>

                {/* Tuesday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Tuesday</Label>
                  <Input
                    type="time"
                    value={workingHours.tuesdayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        tuesdayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.tuesdayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        tuesdayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <Switch
                    checked={!!workingHours.tuesdayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        tuesdayStart: checked ? '09:00' : '',
                        tuesdayEnd: checked ? '17:00' : '',
                      })
                    }
                  />
                </div>

                {/* Wednesday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Wednesday</Label>
                  <Input
                    type="time"
                    value={workingHours.wednesdayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        wednesdayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.wednesdayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        wednesdayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <Switch
                    checked={!!workingHours.wednesdayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        wednesdayStart: checked ? '09:00' : '',
                        wednesdayEnd: checked ? '17:00' : '',
                      })
                    }
                  />
                </div>

                {/* Thursday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Thursday</Label>
                  <Input
                    type="time"
                    value={workingHours.thursdayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        thursdayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.thursdayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        thursdayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <Switch
                    checked={!!workingHours.thursdayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        thursdayStart: checked ? '09:00' : '',
                        thursdayEnd: checked ? '17:00' : '',
                      })
                    }
                  />
                </div>

                {/* Friday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Friday</Label>
                  <Input
                    type="time"
                    value={workingHours.fridayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        fridayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.fridayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        fridayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <Switch
                    checked={!!workingHours.fridayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        fridayStart: checked ? '09:00' : '',
                        fridayEnd: checked ? '17:00' : '',
                      })
                    }
                  />
                </div>

                {/* Saturday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Saturday</Label>
                  <Input
                    type="time"
                    value={workingHours.saturdayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        saturdayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.saturdayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        saturdayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                  />
                  <Switch
                    checked={!!workingHours.saturdayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        saturdayStart: checked ? '09:00' : '',
                        saturdayEnd: checked ? '13:00' : '',
                      })
                    }
                  />
                </div>

                {/* Sunday */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label className="text-right">Sunday</Label>
                  <Input
                    type="time"
                    value={workingHours.sundayStart}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        sundayStart: e.target.value,
                      })
                    }
                    className="col-span-1"
                    disabled={!workingHours.sundayStart}
                  />
                  <span className="text-center">to</span>
                  <Input
                    type="time"
                    value={workingHours.sundayEnd}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        sundayEnd: e.target.value,
                      })
                    }
                    className="col-span-1"
                    disabled={!workingHours.sundayStart}
                  />
                  <Switch
                    checked={!!workingHours.sundayStart}
                    onCheckedChange={(checked) =>
                      setWorkingHours({
                        ...workingHours,
                        sundayStart: checked ? '09:00' : '',
                        sundayEnd: checked ? '13:00' : '',
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleWorkingHoursSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
