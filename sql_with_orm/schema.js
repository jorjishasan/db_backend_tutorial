const { mysqlTable, int, varchar, text, timestamp } = require('drizzle-orm/mysql-core');

// Drizzle table definition that matches the existing `notes` table
const notes = mysqlTable('notes', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

module.exports = { notes };

