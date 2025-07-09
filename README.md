# Scan2Order - QR Code-Based Restaurant Self-Ordering System

Scan2Order is a cutting-edge QR code-based restaurant self-ordering platform that empowers chefs and streamlines dining experiences. The system allows customers to scan QR codes at their tables, view menus, place orders, and receive WhatsApp notifications when their food is ready.

## Features

- **QR Code Table Identification**: Each table has a unique QR code that allows customers to order
- **Multi-Restaurant Support**: System handles multiple restaurants with individual menus and chef accounts
- **Real-time Order Management**: Chefs receive orders instantly through WebSockets
- **WhatsApp Notifications**: Customers receive order status updates via WhatsApp
- **No-Account Ordering**: Guests can place orders without creating accounts
- **Order History**: Customers can track orders across all partner restaurants
- **High-Performance Architecture**: Optimized to handle up to 1M concurrent users

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Real-time Communication**: WebSockets
- **Authentication**: Passport.js with session-based auth
- **State Management**: React Context API + TanStack Query
- **Messaging**: WhatsApp API integration

## System Architecture

Scan2Order uses a scalable architecture with:

- **WebSocket optimization**: Connection pooling with efficient cleanup
- **Database indexes**: Strategic indexes for high-performance queries
- **Tiered rate limiting**: Different limits for different API endpoints
- **Message batching**: Efficient broadcasting with high-load detection
- **Memory management**: Optimized object reuse and cleanup

## Requirements

- Node.js 18+ (20.x recommended)
- PostgreSQL 12+
- npm or yarn for package management

## Local Development Setup

See our [Local Development Guide](./docs/local-development.md) for detailed instructions.

## Database Setup

See our [Database Setup Guide](./docs/database-setup.md) for instructions on setting up PostgreSQL.

## Environment Variables

The following environment variables are required to run the application:

```
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/scan2order
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=scan2order
PGHOST=localhost
PGPORT=5432

# Session
SESSION_SECRET=your_session_secret

# Optional WhatsApp Integration
WHATSAPP_API_KEY=your_whatsapp_api_key
```

## Chef Demo Credentials

For testing purposes, you can use these chef credentials:

- Italian Chef: `italian_chef` / `pizza123` (Restaurant: Italian Delight)
- Indian Chef: `indian_chef` / `curry123` (Restaurant: Spice Garden)
- Mexican Chef: `mexican_chef` / `taco123` (Restaurant: Taco Fiesta)
- Japanese Chef: `japanese_chef` / `sushi123` (Restaurant: Sushi Master)

## License

[MIT License](LICENSE)











// Use these things to setup the app

npm install    

npm install drizzle-orm pg dotenv


// for windows

npm install cross-env


// Add your neon database URL in ".env.local" file

npm run db:push

npm run build


npm run dev

//or

npm run start