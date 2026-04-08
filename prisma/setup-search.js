/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  await client.connect();
  console.log('Connected to database.\n');

  const sql = fs.readFileSync(
    path.join(__dirname, 'setup-search.sql'),
    'utf-8',
  );

  // Split SQL respecting $$ ... $$ PL/pgSQL blocks.
  const statements = [];
  let current = '';
  let inDollarBlock = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();

    // Skip pure comment lines outside blocks
    if (!inDollarBlock && (trimmed.startsWith('--') || trimmed === '')) {
      continue;
    }

    current += line + '\n';

    // Toggle $$ block state
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      for (const _ of dollarMatches) {
        inDollarBlock = !inDollarBlock;
      }
    }

    // Statement ends at ; outside $$ blocks
    if (!inDollarBlock && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  console.log(`Found ${statements.length} SQL statements to execute.\n`);

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 80);
    try {
      await client.query(stmt);
      console.log(`  OK  ${preview}...`);
      success++;
    } catch (error) {
      console.error(`  FAIL  ${preview}...`);
      console.error(`        ${error.message}\n`);
      failed++;
    }
  }

  console.log(
    `\nFull-text search setup complete! ${success} succeeded, ${failed} failed.`,
  );
  await client.end();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
