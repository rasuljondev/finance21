# Finance21

Modern accounting platform for Uzbekistan businesses built with Next.js, Supabase, and Prisma.

## Features

- **Dual Authentication**: Login with password or ERI (E-IMZO digital signature)
- **DIDOX Integration**: Integration with DIDOX API for document management
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Multi-tenant**: Support for multiple companies per user

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- E-IMZO application (for ERI login)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your configuration:
   - Supabase database URL
   - DIDOX API credentials
   - Partner token

4. Set up Prisma:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_DIDOX_API_URL`: DIDOX API endpoint
- `NEXT_PUBLIC_DIDOX_PARTNER_TOKEN`: DIDOX partner token (for client-side)
- `DIDOX_PARTNER_TOKEN`: DIDOX partner token (for server-side)

## Project Structure

```
finance21/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── login/        # Login page
│   │   └── mainpage/     # Main application pages
│   ├── components/       # React components
│   │   ├── layout/       # Layout components (Sidebar, TopBar)
│   │   └── ui/           # UI components
│   ├── contexts/         # React contexts (Auth)
│   ├── lib/              # Utility libraries
│   │   ├── didox.ts      # DIDOX API client
│   │   ├── eimzo.ts      # E-IMZO WebSocket client
│   │   └── prisma.ts     # Prisma client
│   └── types/            # TypeScript type definitions
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

## Authentication

### Password Login

Users can login with their ИНН (Tax ID) and password.

### ERI (E-IMZO) Login

1. Ensure E-IMZO application is installed and running
2. Click "ERI orqali kirish" on login page
3. Select certificate
4. System will sign and authenticate via DIDOX API

## License

Private

