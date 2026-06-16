require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const db = require('./config/db');
const {uploadResume} = require('./config/cloudinary');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
app.post('/careers/:id/apply', uploadResume.single('resume'), async (req, res) => {
    const { full_name, email, phone, cover_letter } = req.body;
    const career_id = req.params.id;
    const resume_path = req.file ? req.file.path: null;
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

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;