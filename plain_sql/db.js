const mysql = require('mysql2/promise');

// Use MYSQL_URL (e.g. from Render) or separate DB_* vars (e.g. .env locally)
let config;
if (process.env.MYSQL_URL) {
  const u = new URL(process.env.MYSQL_URL);
  config = {
    host: u.hostname,
    port: u.port || 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1).replace(/%2f/gi, '/'),
  };
} else {
  config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'notes_app',
  };
}

const pool = mysql.createPool(config);

async function initDb() {
  if (!process.env.MYSQL_URL) {
    const conn = await mysql.createConnection({ host: config.host, user: config.user, password: config.password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await conn.end();
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Database ready');
}

module.exports = { pool, initDb };
