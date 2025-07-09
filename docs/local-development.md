# Local Development Guide for Scan2Order

This guide provides comprehensive instructions for setting up and running the Scan2Order application in a local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18+ (20.x recommended)
- **npm** or **yarn**: For package management
- **PostgreSQL**: Version 12+ (follow our [Database Setup Guide](database-setup.md))
- **Git**: For version control

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/scan2order.git
cd scan2order
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/scan2order
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=scan2order
PGHOST=localhost
PGPORT=5432

# Session Secret
SESSION_SECRET=your_session_secret_here

# Optional WhatsApp Integration
WHATSAPP_API_KEY=your_whatsapp_api_key
```

### 4. Database Setup

Follow our [Database Setup Guide](database-setup.md) to create and configure your PostgreSQL database.

Then, run the database migration to create the schema:

```bash
npm run db:push
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This command starts the development server with hot-reloading enabled. The application will be available at http://localhost:5000.

### Production Build

```bash
npm run build
npm start
```

## Architecture Overview

### Directory Structure

```
/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Application entry point
│   └── index.html          # HTML template
├── server/                 # Backend code
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   ├── index.ts            # Server entry point
│   ├── qrcode.ts           # QR code generation
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   ├── vite.ts             # Vite configuration
│   └── whatsapp.ts         # WhatsApp integration
├── shared/                 # Shared code
│   └── schema.ts           # Database schema
└── docs/                   # Documentation
```

### Key Components

1. **Frontend**:
   - React with TypeScript
   - TailwindCSS with shadcn/ui components
   - TanStack Query for data fetching
   - Context API for state management
   - WebSocket for real-time updates

2. **Backend**:
   - Express.js server
   - Passport.js for authentication
   - WebSocket server for real-time communication
   - Rate limiting for API protection

3. **Database**:
   - PostgreSQL with Drizzle ORM
   - Optimized indexes for high-volume queries
   - Transaction support for data integrity

## Development Workflow

### Adding New Features

1. **Database Changes**:
   - Update the schema in `shared/schema.ts`
   - Run `npm run db:push` to update the database

2. **Backend Endpoints**:
   - Add new routes in `server/routes.ts`
   - Implement storage functions in `server/storage.ts`

3. **Frontend Components**:
   - Add new components in `client/src/components/`
   - Create or update pages in `client/src/pages/`
   - Define API queries/mutations in the appropriate files

### WebSocket Real-time Updates

The application uses WebSockets for real-time updates. The key files are:
- `server/routes.ts`: Server-side WebSocket implementation
- `client/src/context/WebSocketContext.tsx`: Client-side WebSocket handling
- `client/src/context/OrderContext.tsx`: Order state management with WebSocket integration

## Testing the Application

### Chef Dashboard

1. Access `/chef/login` in your browser
2. Log in with chef credentials (see below)
3. View and manage orders for your restaurant

### Customer Ordering

1. Access the root path `/` in your browser
2. Select a restaurant
3. Choose a table
4. Browse the menu and add items to your cart
5. Checkout with your phone number to receive updates

### Demo Credentials

For testing, use these chef credentials:

- Italian Chef: `italian_chef` / `pizza123` (Restaurant: Italian Delight)
- Indian Chef: `indian_chef` / `curry123` (Restaurant: Spice Garden)
- Mexican Chef: `mexican_chef` / `taco123` (Restaurant: Taco Fiesta)
- Japanese Chef: `japanese_chef` / `sushi123` (Restaurant: Sushi Master)

## Performance Considerations

Scan2Order is optimized for high-volume usage. Key optimizations include:

1. **Database Indexes**: Strategic indexes for common query patterns
2. **WebSocket Optimization**: Efficient connection management with batched messaging
3. **Rate Limiting**: Tiered rate limiting for different API endpoints
4. **Memory Management**: Optimized object reuse and cleanup

## Troubleshooting

### Frontend Issues

If you encounter issues with the frontend:

1. Check browser console for errors
2. Verify your environment variables are set correctly
3. Ensure API endpoints return proper responses
4. Check WebSocket connections in browser developer tools

### Backend Issues

For backend issues:

1. Check server logs for errors
2. Verify database connection is working
3. Test API endpoints using tools like Postman
4. Check database queries using pgAdmin or similar tools

### Common Problems

1. **Database Connection**: Ensure PostgreSQL is running and your connection string is correct
2. **Missing Modules**: Try `npm install` to ensure all dependencies are installed
3. **Port Conflicts**: Make sure port 5000 is available for the server
4. **Authentication Issues**: Check that session storage is properly configured

## Contributing Guidelines

We welcome contributions to Scan2Order! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Express.js Documentation](https://expressjs.com/)