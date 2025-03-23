# Medical Clinic Appointment System

A modern web application for medical clinics to manage appointments, patient information, and healthcare services.

## Features

- **Patient Portal**

  - Account creation and management
  - Appointment scheduling and management
  - Medical records access
  - Online payments

- **Staff Dashboard**
  - Doctor schedule management
  - Patient queue visualization
  - Appointment details updating
  - Patient record access

## Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **UI Components**: Shadcn UI with Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Payments**: PayMongo API integration
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- PayMongo account (for payment processing)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/med-appointment.git
   cd med-appointment
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   - Create a `.env.local` file in the root directory
   - Add the following variables:

   ```
   # Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # PayMongo credentials
   PAYMONGO_SECRET_KEY=your-paymongo-secret-key
   PAYMONGO_PUBLIC_KEY=your-paymongo-public-key

   # Next Auth
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Set up Supabase database:

   - Create a new Supabase project
   - Execute the SQL commands found in `supabase/schema.sql` in the Supabase SQL editor
   - Configure Storage buckets for avatars and medical documents

5. Run the development server:

   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
├── app/                     # Next.js App Router pages
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Staff dashboard
│   ├── patient/             # Patient-specific pages
│   └── profile/             # User profile page
├── components/              # React components
│   ├── dashboard/           # Dashboard components
│   ├── forms/               # Form components
│   └── ui/                  # UI components (Shadcn)
├── lib/                     # Utility functions
│   ├── context/             # React Context providers
│   └── supabase/            # Supabase clients
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
├── types/                   # TypeScript types
└── supabase/                # Supabase configuration
```

## Database Schema

The application uses the following tables:

- `profiles`: Extended user information
- `doctors`: Doctor information and specialties
- `doctor_schedules`: Doctor availability
- `appointments`: Scheduling information
- `medical_records`: Patient medical history
- `prescriptions`: Medication information
- `diagnostic_results`: Test results
- `payments`: Payment records

## Deployment

The application can be deployed to Vercel:

1. Push your code to a GitHub repository
2. Import the repository to Vercel
3. Configure the environment variables
4. Deploy

## License

[MIT](LICENSE)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PayMongo](https://paymongo.com/)
