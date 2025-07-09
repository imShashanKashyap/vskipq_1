// This script initializes the database schema
// Run with: node setup-db.js

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { exec } = require('child_process');

console.log('Starting database setup...');
console.log(`Using database URL: ${process.env.DATABASE_URL ? 'Successfully loaded (hidden for security)' : 'NOT FOUND! Check your .env.local file'}`);

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please set it in your .env.local file following the instructions in that file.');
  process.exit(1);
}

// Run drizzle-kit to push schema to database
console.log('\nPushing schema to database...');
exec('npx drizzle-kit push:pg', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing drizzle-kit: ${error.message}`);
    console.error('Make sure you have drizzle-kit installed: npm install -g drizzle-kit');
    return;
  }
  
  console.log(stdout);
  
  if (stderr) {
    console.error(`drizzle-kit stderr: ${stderr}`);
  }
  
  console.log('\nDatabase setup complete!');
  console.log('\nYou can now run the application with:');
  console.log('npm run dev');
});