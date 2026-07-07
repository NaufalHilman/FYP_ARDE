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

app.get('/events', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events ORDER BY event_date ASC');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        res.render('events', {
            active: 'events',
            featured: events.find(e => e.is_featured),
            upcoming: events.filter(e => new Date(e.event_date) >= today),
            past:     events.filter(e => new Date(e.event_date) <  today).reverse(),
            notice: req.query.notice || null,
            error:  req.query.error  || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/* =====================================================
   AWARDS (upcoming / past / featured winners)
===================================================== */
app.get('/awards', async (req, res) => {
    try {
        const [awards] = await db.query('SELECT * FROM awards ORDER BY deadline ASC');
        const [allWinners] = await db.query(
            `SELECT aw.*, m.image_path AS member_image, m.title AS member_title
             FROM award_winners aw
             LEFT JOIN members m ON aw.member_id = m.member_id
             ORDER BY aw.award_id ASC, aw.role ASC, aw.id ASC`
        );

        // Build a map: award_id -> { winners: [], runnerUps: [] }
        const winnersMap = {};
        allWinners.forEach(w => {
            if (!winnersMap[w.award_id]) winnersMap[w.award_id] = { winners: [], runnerUps: [] };
            if (w.role === 'winner') winnersMap[w.award_id].winners.push(w);
            else                     winnersMap[w.award_id].runnerUps.push(w);
        });

        res.render('awards', {
            active: 'about',
            subActive: 'awards',
            awards,
            winnersMap,
            notice: req.query.notice || null,
            error:  req.query.error  || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/events/:id', async (req, res) => {
    try {
        const [[event]] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (!event) return res.status(404).send('Event not found');
        res.render('event-detail', { event });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/events/:id/register', async (req, res) => {
    const { member_id, full_name, email, phone, message } = req.body;
    const event_id = req.params.id;

    // Normalise to 5 digits so "472" still matches a stored "00472"
    const memberId = (member_id || '').trim().padStart(5, '0');

    try {
        // The ID must belong to an accepted member
        const [members] = await db.query(
            "SELECT member_id FROM membership_applications WHERE member_id = ? AND status = 'accepted'",
            [memberId]
        );

        if (members.length === 0) {
            const [[event]] = await db.query('SELECT * FROM events WHERE id = ?', [event_id]);
            return res.status(400).render('event-detail', {
                event,
                error: 'That member ID was not found or is not an active member. Please check and try again.',
                form: { member_id, full_name, email, phone, message }
            });
        }

        await db.query(
            'INSERT INTO event_registrations (event_id, member_id, full_name, email, phone, message) VALUES (?, ?, ?, ?, ?, ?)',
            [event_id, memberId, full_name, email, phone, message]
        );
        res.render('event-register-success', { event_id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting registration');
    }
});

app.post('/awards/:id/register', async (req, res) => {
    const award_id = req.params.id;
    const { member_id, full_name } = req.body;
    const memberId = (member_id || '').trim().padStart(5, '0');

    try {
        // Award must exist and deadline must not have passed
        const [[award]] = await db.query('SELECT * FROM awards WHERE id = ?', [award_id]);
        if (!award) return res.redirect('/awards');

        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (new Date(award.deadline) < today) {
            return res.redirect('/awards?error=' + encodeURIComponent('The deadline for this award has passed.'));
        }

        // Member ID must exist in members table OR accepted membership application
        const [[inMembers]] = await db.query(
            'SELECT id FROM members WHERE member_id = ?', [memberId]
        );
        if (!inMembers) {
            const [[inApps]] = await db.query(
                "SELECT id FROM membership_applications WHERE member_id = ? AND status = 'accepted'",
                [memberId]
            );
            if (!inApps) {
                return res.redirect('/awards?error=' + encodeURIComponent('Member ID not found. Please check and try again.'));
            }
        }

        // No duplicate registrations
        const [[existing]] = await db.query(
            'SELECT id FROM award_registrations WHERE award_id = ? AND member_id = ?',
            [award_id, memberId]
        );
        if (existing) {
            return res.redirect('/awards?error=' + encodeURIComponent('You have already registered for this award.'));
        }

        await db.query(
            'INSERT INTO award_registrations (award_id, member_id, full_name) VALUES (?, ?, ?)',
            [award_id, memberId, full_name]
        );

        res.redirect('/awards?notice=' + encodeURIComponent(`Successfully registered for "${award.title}"!`));
    } catch (err) {
        console.error(err);
        res.redirect('/awards?error=' + encodeURIComponent('Something went wrong. Please try again.'));
    }
});

app.get('/about', (req, res) => {
    res.render('about', { active: 'about', subActive: 'about-us' });
});

app.get('/community', (req, res) => {
    res.render('community', { active: 'about', subActive: 'community' });
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

// membership application submit
app.post('/membership/apply', async (req, res) => {
    const {
        membership_type, title, full_name, nationality, nationality_other,
        date_of_birth, residential_address, personal_email, mobile_number,
        hotel_name, business_address, business_email, telephone_number,
        current_position, years_in_position, existing_member_id,
        opt_email_updates, opt_event_sms, opt_admin_responsibility, consent
    } = req.body;

    // If "Others" was picked, store the typed-in country instead
    const finalNationality = nationality === 'Others' ? nationality_other : nationality;
    // Only keep an existing ID for Renew applications
    const existingId = membership_type === 'Renew' ? (existing_member_id || null) : null;

    try {
        await db.query(
            `INSERT INTO membership_applications
              (membership_type, title, full_name, nationality, date_of_birth,
               residential_address, personal_email, mobile_number,
               hotel_name, business_address, business_email, telephone_number,
               current_position, years_in_position, existing_member_id,
               opt_email_updates, opt_event_sms, opt_admin_responsibility, consent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                membership_type, title, full_name, finalNationality, date_of_birth || null,
                residential_address, personal_email, mobile_number,
                hotel_name, business_address, business_email, telephone_number,
                current_position, years_in_position, existingId,
                opt_email_updates ? 1 : 0, opt_event_sms ? 1 : 0,
                opt_admin_responsibility ? 1 : 0, consent ? 1 : 0
            ]
        );
        res.render('membership-success', { active: 'membership' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting application');
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

/* =====================================================
   ARDE MEMBERS (regular members list)
===================================================== */
app.get('/members', async (req, res) => {
    try {
        const [members] = await db.query('SELECT * FROM members ORDER BY full_name ASC');
        res.render('members', { members, active: 'about', subActive: 'members' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/* =====================================================
   EXECUTIVE COMMITTEE
===================================================== */
app.get('/executive', async (req, res) => {
    try {
        const [groups] = await db.query('SELECT * FROM executive_groups ORDER BY display_order ASC');
        const [executives] = await db.query('SELECT * FROM executive_members ORDER BY display_order ASC');

        const groupedExecutives = groups.map(group => ({
            ...group,
            members: executives.filter(e => e.group_id === group.id)
        })).filter(group => group.members.length > 0);

        const president = executives.find(e => e.is_president);

        res.render('executive', { groupedExecutives, president, active: 'about', subActive: 'executive' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/* =====================================================
   HONORARY MEMBERS
===================================================== */
app.get('/honorary', async (req, res) => {
    try {
        const [honorary] = await db.query('SELECT * FROM honorary_members ORDER BY display_order ASC');
        res.render('honorary', { honorary, active: 'about', subActive: 'honorary' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/* =====================================================
   SPONSORS & PARTNERS
===================================================== */
app.get('/sponsors', (req, res) => {
    res.render('sponsors', { active: 'about', subActive: 'sponsors' });
});

app.get('/enquiry', (req, res) => {
    res.render('enquiry', {
        active: 'about',
        subActive: 'contact',
        notice: req.query.notice || null,
        error: req.query.error || null,
        form: {}
    });
});

app.post('/enquiry', (req, res) => {
    const { full_name, organization, email, phone, subject, message } = req.body;
    const form = { full_name, organization, email, phone, subject, message };

    if (!full_name?.trim() || !email?.trim() || !message?.trim()) {
        return res.render('enquiry', {
            active: 'about',
            subActive: 'contact',
            error: 'Please provide your name, email address, and a message.',
            notice: null,
            form
        });
    }

    const notice = 'Thanks! Your sponsorship enquiry has been received. We will respond shortly.';
    res.redirect('/enquiry?notice=' + encodeURIComponent(notice));
});

app.get('/contact', (req, res) => {
    res.render('contactinfo', {
        active: 'about',
        subActive: 'contact'
    });
});

app.get('/support', (req, res) => {
    res.render('contact', {
        active: 'about',
        subActive: 'support',
        notice: req.query.notice || null,
        error: req.query.error || null,
        form: {}
    });
});

app.post('/support', (req, res) => {
    const { full_name, email, phone, subject, message } = req.body;
    const form = { full_name, email, phone, subject, message };

    if (!full_name?.trim() || !email?.trim() || !message?.trim()) {
        return res.render('contact', {
            active: 'about',
            subActive: 'support',
            error: 'Please provide your name, email address, and a message.',
            notice: null,
            form
        });
    }

    const notice = 'Thanks! Your message has been received. We will respond shortly.';
    res.redirect('/support?notice=' + encodeURIComponent(notice));
});

module.exports = app;