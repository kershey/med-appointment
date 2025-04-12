# Email Validation Troubleshooting with Supabase

This document provides guidance on resolving email validation issues with Supabase authentication.

## Common Issues

### 1. "Email address X is invalid" errors

When Supabase rejects an email that appears to be valid, there are several possible causes:

- **Email Format Validation**: Supabase has its own email validation rules which may be more strict than standard RFC email format
- **Email Provider Blacklists**: Some email domains may be blocklisted in your Supabase configuration
- **Special Characters**: Certain characters in emails may cause validation failures
- **Known Problematic Emails**: Some specific email patterns may trigger false positives in Supabase's validation

### 2. Our Current Solution

We've implemented a robust workaround that:

1. Normalizes and sanitizes email addresses
2. If still rejected, tries a modified version using plus addressing (e.g., `user+signup@domain.com`)
3. Stores the original email for user communication while using the modified version for authentication

## Admin Solutions

### 1. Adjust Supabase Project Settings

To fix at the source:

1. Log into your Supabase dashboard at https://app.supabase.com/
2. Navigate to your project
3. Go to Authentication → Settings
4. Check for:
   - Domain restrictions (remove any that are too restrictive)
   - Email provider configuration
   - Custom blocked email domains (remove legitimate domains)

### 2. Custom Email Validation

Our improved implementation:

- Sanitizes emails by removing potentially problematic characters
- Tries alternative email formats automatically
- Preserves the user's original email for communication

### 3. Email Provider Configuration

Ensure your Supabase email provider (e.g., SMTP) is correctly configured:

1. Go to Authentication → Email Templates
2. Verify the sender email domain is properly set up with SPF, DKIM, and DMARC records
3. Check that the templates are properly formatted

## Technical Implementation Details

Our current implementation:

1. Takes the user's email input
2. Performs basic normalization (trim whitespace, lowercase)
3. Removes potentially problematic characters while preserving the email structure
4. If still rejected, automatically tries a plus-addressing variant
5. Stores metadata to preserve the original email for user communication

## Future Improvements

1. **Server-side validation**: Consider implementing a server-side API endpoint that pre-validates emails before sending to Supabase
2. **Support alternate authentication methods**: Add social login or phone authentication as alternatives
3. **Custom email validation service**: For complete control, consider a custom email validation service

---

If you continue experiencing issues with specific email addresses, please contact Supabase support with detailed examples of the rejected emails.
