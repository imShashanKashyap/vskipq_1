# Database Setup Guide for Scan2Order

This guide provides detailed instructions for setting up and configuring the PostgreSQL database for the Scan2Order application.

## Prerequisites

- PostgreSQL 12+ installed on your machine or server
- psql command-line tool or any PostgreSQL administration tool (pgAdmin, DBeaver, etc.)
- Basic knowledge of SQL commands

## Installation

### For Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### For macOS (using Homebrew):

```bash
brew install postgresql
```

### For Windows:

1. Download the installer from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Keep track of the password you set for the 'postgres' user

## Setup the Database

Once PostgreSQL is installed, you need to:

1. Create a database for the application
2. Create a user with appropriate permissions
3. Set up environment variables

### Step 1: Create Database and User

Connect to PostgreSQL as the postgres user:

```bash
# For Linux/macOS:
sudo -u postgres psql

# For Windows (in Command Prompt):
psql -U postgres
```

Create a database and user:

```sql
CREATE DATABASE scan2order;
CREATE USER scan2order_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE scan2order TO scan2order_user;
```

### Step 2: Configure Connection

The application uses the DATABASE_URL environment variable to connect to PostgreSQL. 
Set it in your environment or .env file with the following format:

```
DATABASE_URL=postgresql://scan2order_user:your_secure_password@localhost:5432/scan2order
PGUSER=scan2order_user
PGPASSWORD=your_secure_password
PGDATABASE=scan2order
PGHOST=localhost
PGPORT=5432
```

### Step 3: Initialize Schema

The Scan2Order application uses Drizzle ORM for database management. 
The schema is defined in `shared/schema.ts` and can be automatically 
pushed to the database using the following command:

```bash
npm run db:push
```

This command will create all necessary tables, indexes, and relationships based on the schema definition.

## Database Schema

Scan2Order uses the following main tables:

- **restaurants**: Stores information about restaurants
- **tables**: Represents physical tables in restaurants
- **menuItems**: Contains menu items for each restaurant
- **orders**: Tracks customer orders
- **orderItems**: Contains individual items within an order
- **users**: Stores chef and admin user accounts

Each table has appropriate indexes for high-performance queries, especially:

- Restaurant-specific indexes for efficient filtering of orders by restaurant
- Timestamp-based indexes for recent orders
- Phone-based indexes for order tracking
- Category-based indexes for menu filtering

## Seed Data

The application automatically initializes with seed data for:

- 4 restaurants (Italian, Indian, Mexican, Japanese)
- Sample tables for each restaurant
- Sample menu items for each restaurant
- Chef accounts for each restaurant

## Backup and Restore

To back up your database:

```bash
pg_dump -U scan2order_user -d scan2order > scan2order_backup.sql
```

To restore from a backup:

```bash
psql -U scan2order_user -d scan2order < scan2order_backup.sql
```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify your PostgreSQL service is running:
   ```bash
   # For Linux
   sudo systemctl status postgresql
   
   # For macOS
   brew services list
   ```

2. Check that your DATABASE_URL environment variable is correctly formatted

3. Ensure the database user has appropriate permissions:
   ```sql
   GRANT ALL PRIVILEGES ON SCHEMA public TO scan2order_user;
   ```

### Schema Migration Issues

If you encounter issues with schema migrations:

1. For a fresh start, you can drop all tables and re-run the migration:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. Then run the migration command again:
   ```bash
   npm run db:push
   ```

## Advanced Configuration

### Connection Pooling

For production environments, consider setting up connection pooling for better performance. 
The application already uses connection pooling via the PostgreSQL client library, 
but external connection poolers like PgBouncer can further improve performance.

### Indexes

The database schema already includes optimized indexes for high-performance queries.
These indexes cover:

1. Restaurant-specific queries
2. Order lookup by status
3. Menu filtering by category
4. Phone number-based tracking

If your specific usage pattern requires additional indexes, you can add them 
to the schema definitions in `shared/schema.ts`.