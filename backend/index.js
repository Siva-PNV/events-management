import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Disable caching for events API to ensure list refresh after modifications
app.use('/api/events', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Disable caching for admin API endpoints to avoid 304 Not Modified responses
app.use('/api/admin', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // change as needed
  password: '', // change as needed
  database: 'university_events',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create events table if not exists (use DATETIME for event_date)
const createTableQuery = `CREATE TABLE IF NOT EXISTS events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  event_title VARCHAR(255) NOT NULL,
  event_date DATETIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  details TEXT
)`;
db.query(createTableQuery, (err) => {
  if (err) console.error('Error creating table:', err);
  else {
    // If table existed previously with DATE column, upgrade to DATETIME
    const checkTypeSql = `SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'event_date'`;
    db.query(checkTypeSql, (e, rows) => {
      if (e) return console.error('Error checking event_date type:', e);
      const currentType = rows && rows[0] && rows[0].DATA_TYPE;
      if (currentType && currentType.toLowerCase() === 'date') {
        db.query('ALTER TABLE events MODIFY COLUMN event_date DATETIME NOT NULL', (e2) => {
          if (e2) console.error('Error altering event_date to DATETIME:', e2);
          else console.log('Upgraded events.event_date column to DATETIME');
        });
      }
    });
  }
});

// Create admin_users table if not exists (include created_by and created_at)
const createAdminTable = `CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_by VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT NULL
)`;
db.query(createAdminTable, (err) => {
  if (err) console.error('Error creating admin_users table:', err);
  else {
    // Ensure columns exist (handle older DBs where table existed without these columns)
    const ensureColumn = (colSql, checkSql) => {
      db.query(checkSql, (e, results) => {
        if (e) return console.error('Error checking admin_users columns:', e);
        const exists = results && results.length > 0 && results[0].cnt > 0;
        if (!exists) {
          db.query(colSql, (err2) => {
            if (err2) console.error('Error adding column to admin_users:', err2);
            else console.log('Added missing column to admin_users');
          });
        }
      });
    };

    // Check created_by
    ensureColumn(
      'ALTER TABLE admin_users ADD COLUMN created_by VARCHAR(100) DEFAULT NULL',
      "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'created_by'",
    );

    // Check created_at
    ensureColumn(
      'ALTER TABLE admin_users ADD COLUMN created_at DATETIME DEFAULT NULL',
      "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'created_at'",
    );
  }
});

// Seed default admin if none exists
const seedAdmin = async () => {
  db.query('SELECT COUNT(*) AS cnt FROM admin_users', (err, results) => {
    if (err) return console.error('Error checking admin_users:', err);
    const cnt = results[0].cnt;
    if (cnt === 0) {
      // default username: admin, password: admin123 (bcrypt hashed)
      import('bcryptjs')
        .then((mod) => {
          const bcrypt = mod && mod.default ? mod.default : mod;
          const hash = bcrypt.hashSync('admin123', 10);
          db.query(
            'INSERT INTO admin_users (username, password) VALUES (?, ?)',
            ['admin', hash],
            (e) => {
              if (e) console.error('Error seeding admin user:', e);
              else console.log('Seeded default admin user (username: admin, password: admin123)');
            },
          );
        })
        .catch((e) => console.error('Error importing bcryptjs for seeding:', e));
    }
  });
};
seedAdmin();

// Insert new event (expects event_date as full DATETIME string 'YYYY-MM-DD HH:MM:SS')
app.post('/api/events', (req, res) => {
  const { event_title, event_date, location, details } = req.body;
  if (!event_title || !event_date || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const query = 'INSERT INTO events (event_title, event_date, location, details) VALUES (?, ?, ?, ?)';
  db.query(query, [event_title, event_date, location, details], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ event_id: result.insertId });
  });
});

// Update existing event (event_date as DATETIME)
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { event_title, event_date, location, details } = req.body;
  if (!event_title || !event_date || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const query = 'UPDATE events SET event_title = ?, event_date = ?, location = ?, details = ? WHERE event_id = ?';
  db.query(query, [event_title, event_date, location, details, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ affectedRows: result.affectedRows });
  });
});

// Delete event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM events WHERE event_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ affectedRows: result.affectedRows });
  });
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  db.query(
    'SELECT id, username, password FROM admin_users WHERE username = ?',
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results || results.length === 0)
        return res.status(401).json({ error: 'Invalid credentials' });
      const user = results[0];
      import('bcryptjs')
        .then((mod) => {
          const bcrypt = mod && mod.default ? mod.default : mod;
          const ok = bcrypt.compareSync(password, user.password);
          if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
          // In a real app you'd create a session or JWT; here we return basic user info
          res.json({ id: user.id, username: user.username });
        })
        .catch((e) => res.status(500).json({ error: e.message }));
    },
  );
});

// Log that admin route was registered
console.log('Registered POST /api/admin/login');

// Get upcoming events (compare with NOW for DATETIME)
app.get('/api/events', (req, res) => {
  console.log('GET /api/events requested at', new Date().toISOString());
  const query = 'SELECT * FROM events WHERE event_date >= NOW() ORDER BY event_date ASC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log('GET /api/events response rows:', results?.length ?? 0);
    res.json(results);
  });
});

// Get past events (DATETIME comparison)
app.get('/api/events/past', (req, res) => {
  const query = 'SELECT * FROM events WHERE event_date < NOW() ORDER BY event_date DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Admin users: list
app.get('/api/admin/users', (req, res) => {
  db.query(
    'SELECT id, username, created_at, created_by FROM admin_users ORDER BY created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

// Admin users: add
app.post('/api/admin/users', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  // Check exists
  db.query('SELECT id FROM admin_users WHERE username = ?', [username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows && rows.length > 0) return res.status(400).json({ error: 'Username already exists' });
    import('bcryptjs')
      .then((mod) => {
        const bcrypt = mod && mod.default ? mod.default : mod;
        const hash = bcrypt.hashSync(password, 10);
        const created_by = req.body.created_by || 'admin';
        db.query(
          'INSERT INTO admin_users (username, password, created_by, created_at) VALUES (?, ?, ?, NOW())',
          [username, hash, created_by],
          (e, result) => {
            if (e) return res.status(500).json({ error: e.message });
            res.json({ id: result.insertId });
          },
        );
      })
      .catch((e) => res.status(500).json({ error: e.message }));
  });
});

// Admin users: delete (expects { id })
app.delete('/api/admin/users', (req, res) => {
  const id = req.body?.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  db.query('DELETE FROM admin_users WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ affectedRows: result.affectedRows });
  });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
