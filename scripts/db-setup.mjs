import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing — run this through: npm run db:setup");
  process.exit(1);
}

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaSql = readFileSync(path.join(rootDir, "db", "schema.sql"), "utf8");

const sql = neon(process.env.DATABASE_URL);

console.log("Resetting tables...");
await sql`DROP TABLE IF EXISTS reviews`;
await sql`DROP TABLE IF EXISTS restaurants`;

console.log("Applying schema...");
const statements = schemaSql
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);
for (const statement of statements) {
  await sql.query(statement);
}

console.log("Seeding Ludhiana Burrito...");
const [restaurant] = await sql`
  INSERT INTO restaurants (name, cuisine, area)
  VALUES ('Ludhiana Burrito', 'Indian', 'Sector 32')
  RETURNING id
`;

const DAY_MS = 24 * 60 * 60 * 1000;
const seedReviews = [
  { rating: 5, comment: "Paneer burrito is unreal", daysAgo: 8 },
  { rating: 4, comment: "Good, but slow service", daysAgo: 6 },
  { rating: 4, comment: "Solid. Would repeat.", daysAgo: 2 },
];

for (const review of seedReviews) {
  const createdAt = new Date(Date.now() - review.daysAgo * DAY_MS).toISOString();
  await sql`
    INSERT INTO reviews (restaurant_id, rating, comment, created_at)
    VALUES (${restaurant.id}, ${review.rating}, ${review.comment}, ${createdAt})
  `;
}

const restaurantRows = await sql`SELECT * FROM restaurants ORDER BY id`;
const reviewRows = await sql`SELECT * FROM reviews ORDER BY id`;

console.log("\n=== restaurants ===");
console.table(restaurantRows);
console.log("\n=== reviews ===");
console.table(
  reviewRows.map((row) => ({
    ...row,
    created_at: String(row.created_at).slice(0, 16).replace("T", " "),
  }))
);
console.log(`\nDone. ${restaurantRows.length} restaurant, ${reviewRows.length} reviews.`);
