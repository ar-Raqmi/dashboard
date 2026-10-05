// Prints the SQL that creates a login. Pipe it into D1:
//   node scripts/seed-admin.mjs <username> <password> > /tmp/seed.sql
//   npx wrangler d1 execute dashboard-db --remote --file=/tmp/seed.sql
// Settings, widgets and the rest are created on first sign-in.
import bcrypt from 'bcryptjs';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: node scripts/seed-admin.mjs <username> <password>');
  process.exit(1);
}

const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const salt = await bcrypt.genSalt(12);
const passwordHash = await bcrypt.hash(password, salt);

console.log(
  `INSERT INTO "User" ("id", "username", "passwordHash", "salt", "createdAt") ` +
    `VALUES (${quote(crypto.randomUUID())}, ${quote(username)}, ${quote(passwordHash)}, ${quote(salt)}, ${quote(new Date().toISOString())});`,
);
