# BuildLedger

Professional invoicing and quoting software designed specifically for tradespeople and general contractors.

## 🚀 Features

- **Client Management** - Organize customer information and contact details
- **Project Tracking** - Monitor jobs from quote to completion
- **Quote Generation** - Create professional estimates with line items
- **Invoice Creation** - Convert quotes to invoices seamlessly
- **PDF Export** - Generate professional PDF documents
- **Payment Tracking** - Monitor payments and outstanding balances
- **Dashboard Analytics** - Business insights and performance metrics

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/juud-8/buildledger02.git
cd buildledger02
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your keys
3. Copy `.env.example` to `.env.local` and add your Supabase credentials
4. Run the database schema from `docs/database-schema.sql` in your Supabase SQL editor

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```text
buildledger02/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── clients/           # Client management
│   │   ├── projects/          # Project management
│   │   ├── quotes/            # Quote generation
│   │   ├── invoices/          # Invoice management
│   │   └── settings/          # User settings
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Basic UI elements
│   │   ├── layout/           # Layout components
│   │   ├── forms/            # Form components
│   │   └── tables/           # Data display components
│   ├── lib/                  # Utilities and configurations
│   │   ├── supabase/         # Supabase client setup
│   │   ├── utils/            # Helper functions
│   │   └── hooks/            # Custom React hooks
│   └── types/                # TypeScript type definitions
├── docs/                     # Documentation
├── public/                   # Static assets
└── ...config files
```

## 🗄️ Database Schema

The application uses the following main tables:

- `profiles` - User profile information
- `clients` - Customer data
- `projects` - Job/project information
- `quotes` - Quote generation and tracking
- `invoices` - Invoice management
- `line_items` - Quote/invoice line items
- `payments` - Payment tracking

See `docs/database-schema.sql` for the complete schema.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

Built with ❤️ for tradespeople and contractors who deserve better tools.

