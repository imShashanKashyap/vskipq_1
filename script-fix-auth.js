// This script will remove the duplicate auth routes in routes.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix 1: Remove duplicate login routes from routes.ts
console.log('Looking for login routes in routes.ts...');
const routesPath = path.join(__dirname, 'server', 'routes.ts');
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Check if there are duplicate auth routes
const hasDuplicateLoginRoute = routesContent.includes('app.post(\'/api/login\'');
const hasDuplicateUserRoute = routesContent.includes('app.get(\'/api/user\'');
const hasDuplicateLogoutRoute = routesContent.includes('app.post(\'/api/logout\'');
const hasDuplicateRegisterRoute = routesContent.includes('app.post(\'/api/register\'');

if (hasDuplicateLoginRoute || hasDuplicateUserRoute || hasDuplicateLogoutRoute || hasDuplicateRegisterRoute) {
  console.log('Found duplicate auth routes in routes.ts, removing them...');
  
  // Replace auth routes section with a comment
  routesContent = routesContent.replace(
    /\/\/ Auth endpoints[\s\S]+?app\.get\('\/api\/user'[\s\S]+?}\);/g,
    '// Auth endpoints are now handled in auth.ts'
  );
  
  fs.writeFileSync(routesPath, routesContent);
  console.log('Duplicate auth routes removed from routes.ts');
} else {
  console.log('No duplicate auth routes found in routes.ts');
}

// Fix 2: Print out current chef usernames and passwords for testing
console.log('\nChef credentials for testing:');
console.log('Italian chef: username "italian_chef", password "pizza123"');
console.log('Indian chef: username "indian_chef", password "curry123"');
console.log('Mexican chef: username "mexican_chef", password "taco123"');
console.log('Japanese chef: username "japanese_chef", password "sushi123"');

console.log('\nAuth system fixes applied. Please restart the server to apply changes.');