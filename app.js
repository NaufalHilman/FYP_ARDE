const express = require('express');
const app = express();
const path = require('path');
const db = require('./config/db');
const multer = require('multer');
const fs = require('fs');

app.use('/uploads', express.static(path.join(__dirname, '../FYP_Admin/public/uploads')));

// Test the database connection
db.query('SELECT 1')
  .then(() => console.log('Database connection successful!'))
  .catch((err) => console.error('Database connection failed:', err.message));


// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'components')
]);

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('home', { active: 'home' });
});

app.get('/events', (req, res) => {
    res.render('events', { active: 'events' });
});

app.get('/about', (req, res) => {
    res.render('about', { active: 'about' });
});

//careers routes
const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../FYP_Admin/public/uploads/resumes');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage: resumeStorage });

app.get('/careers', async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT * FROM careers ORDER BY posted_at DESC');
        res.render('careers', { jobs });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/careers/:id', async (req, res) => {
    try {
        const [[job]] = await db.query('SELECT * FROM careers WHERE id = ?', [req.params.id]);
        if (!job) return res.status(404).send('Job not found');
        res.render('career-detail', { job });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /careers/:id/apply
app.post('/careers/:id/apply', upload.single('resume'), async (req, res) => {
    const { full_name, email, phone, cover_letter } = req.body;
    const career_id = req.params.id;
    const resume_path = req.file ? '/uploads/resumes/' + req.file.filename : null;
    try {
        await db.query(
            'INSERT INTO applications (career_id, full_name, email, phone, cover_letter, resume_path) VALUES (?, ?, ?, ?, ?, ?)',
            [career_id, full_name, email, phone, cover_letter, resume_path]
        );
        res.render('apply-success', { job_id: career_id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting application');
    }
});

//membership route
app.get('/membership', (req, res) => {
    res.render('membership', { active: 'membership' });
});

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});