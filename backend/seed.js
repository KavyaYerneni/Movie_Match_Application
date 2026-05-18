/**
 * Seed script: loads 105+ movies into SQLite.
 * Run: npm run seed
 * Image credits: placehold.co placeholder posters (see README).
 */
const fs = require('fs');
const path = require('path');
const db = require('./db');

const moviesPath = path.join(__dirname, 'movies.json');

if (!fs.existsSync(moviesPath)) {
  console.error('movies.json missing. Run: node generate-movies.js');
  process.exit(1);
}

const movies = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));

if (movies.length < 100) {
  console.error(`Need at least 100 movies, found ${movies.length}`);
  process.exit(1);
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO items (id, label, description, image_url, year, genre)
  VALUES (@id, @label, @description, @image_url, @year, @genre)
`);

const seed = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(row);
  }
});

seed(movies);
console.log(`Seeded ${movies.length} movies into ${path.join(__dirname, 'movie-match.db')}`);
