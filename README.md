# Security Role Request Application

A comprehensive web application for managing security role requests for SWIFT Statewide Systems access.

## Features

- **Multi-step Form Process**: Guided workflow for submitting security role requests
- **Role-specific Pages**: Specialized forms for different security areas (ELM, EPM Data Warehouse, HR/Payroll)
- **Digital Signatures**: Built-in signature capture for approvals
- **Request Management**: View, edit, and track request status
- **User Session Management**: POC testing with user identification
- **Database Integration**: Full CRUD operations with Supabase

## Security Areas Supported

- **Accounting/Procurement**: Financial management system access
- **HR/Payroll**: Human resources and payroll system access  
- **EPM Data Warehouse**: Enterprise performance management data access
- **ELM (Enterprise Learning Management)**: Learning management system administration

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with validation
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd security-role-request-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Main navigation header
│   ├── UserSession.tsx # User identification for testing
│   ├── AgencySelect.tsx # Agency selection dropdown
│   └── ...
├── lib/                # Utility libraries and data
│   ├── supabase.ts     # Supabase client configuration
│   ├── agencyData.ts   # Agency and organization data
│   └── businessUnitData.ts # Business unit mappings
├── pages/              # Main application pages
│   ├── App.tsx         # Main form page
│   ├── RequestListPage.tsx # Request management
│   ├── ElmRoleSelectionPage.tsx # ELM-specific roles
│   └── ...
└── types.ts           # TypeScript type definitions
```

## Database Schema

The application uses Supabase with the following main tables:

- `security_role_requests` - Main request records
- `security_role_selections` - Role-specific selections
- `request_approvals` - Approval workflow tracking
- `security_areas` - Security area configurations
- `copy_user_details` - User copying functionality

## Features in Detail

### Request Workflow

1. **Initial Form**: Employee details, agency information, security area selection
2. **Role Selection**: Area-specific role configuration
3. **Approval Process**: Multi-step approval with digital signatures
4. **Completion**: Final processing and access provisioning

### Test Mode

The application includes a test mode for development and demonstration:
- User session management for isolated testing
- Auto-approval functionality for testing workflows
- Request completion simulation

### Security Areas

Each security area has specialized role selection:

- **ELM**: Learning administration roles with detailed permissions
- **EPM Data Warehouse**: Reporting and data access roles
- **HR/Payroll**: Sensitive HR data access with restrictions
- **Accounting/Procurement**: Financial system access roles

## Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

The project includes a Dockerfile for containerized deployment:

```bash
docker build -t security-role-app .
docker run -p 80:80 security-role-app
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.