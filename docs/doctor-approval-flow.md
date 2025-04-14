# Doctor Approval Flow

This document explains the doctor approval process in the MedClinic application.

## Overview

When a new doctor registers, their account is created but set as "unapproved" by default. An admin must review and approve doctor accounts before they can access the system and start accepting appointments.

## Database Schema

The doctor approval system relies on two key fields in the `profiles` table:

- `is_approved` (boolean): Set to `true` when an admin approves a doctor
- `is_rejected` (boolean): Set to `true` when an admin rejects a doctor

A doctor can never be both approved and rejected simultaneously.

## Approval Flow

1. **Registration**:

   - Doctor registers and creates an account
   - `profiles.role` is set to "doctor"
   - `is_approved` defaults to `false`
   - Doctor entry is created in the `doctors` table

2. **Admin Review**:

   - Admin navigates to `/admin/doctor-approval`
   - Admin reviews doctor credentials and information
   - Admin can either approve or reject the doctor

3. **Approval Decision**:

   - **Approve**: Sets `is_approved = true` and `is_rejected = false`
   - **Reject**: Sets `is_approved = false` and `is_rejected = true`

4. **Access Control**:
   - Approved doctors can log in and access doctor features
   - Rejected doctors will be shown a rejection message
   - Pending doctors see a "waiting for approval" message

## Common Issues and Fixes

If you encounter issues with the doctor approval process:

1. **Inconsistent Status**:

   - A doctor showing both approved and rejected status
   - Solution: Navigate to `/admin/fix-doctor-approvals` and use the "Fix All Issues" button

2. **Approved Doctor Still Showing in Pending Tab**:

   - This typically occurs when the database has inconsistent data
   - Solution: Run the `fix_doctor_approvals()` database function through the fix tool

3. **Missing Approval Fields**:
   - If your database was created before the approval fields were added
   - Solution: Run the `add_approval_fields.sql` migration script

## Fixing the Database

If you need to manually fix the database:

1. Add missing columns:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT false;
```

2. Fix inconsistent data:

```sql
-- Fix NULL values
UPDATE profiles
SET is_approved = COALESCE(is_approved, false),
    is_rejected = COALESCE(is_rejected, false)
WHERE role = 'doctor';

-- Fix contradictions (approved and rejected)
UPDATE profiles
SET is_rejected = false
WHERE role = 'doctor'
AND is_approved = true
AND is_rejected = true;
```

## Components Involved

1. `/admin/doctor-approval/page.tsx` - Main doctor approval interface
2. `/admin/fix-doctor-approvals/page.tsx` - Utility to fix approval inconsistencies
3. `lib/context/AuthContext.tsx` - Handles user authentication based on approval status

## Best Practices

1. Always use the built-in approval/rejection functions to maintain data consistency
2. Periodically check for data inconsistencies using the Fix Approvals tool
3. When approving/rejecting a doctor, wait for the confirmation message before navigating away
