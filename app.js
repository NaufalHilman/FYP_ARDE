const express = require('express');
const app = express();
const path = require('path');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images) from the 'public' folder
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

app.get('/careers', (req, res) => {
    res.render('careers', { active: 'careers' });
});

app.get('/membership', (req, res) => {
    res.render('membership', { active: 'membership' });
});

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});