const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.redirect('/login');
  }
};

router.get('/', (req, res) => res.render('index'));
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.get('/secrets', authMiddleware, async (req, res) => {
  const userSecrets = await Secret.find({ userEmail: req.user.email });
  res.render('secrets', {
    user: req.user,
    secrets: userSecrets 
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = new User({ name, email, password });
    await user.save();
    console.log("✅ User registered:", user);
    res.redirect('/login');
  } catch (err) {
    console.error("❌ Registration failed:", err.message);
    res.render('register', { error: 'Email already exists or validation failed.' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found for:", email);
      return res.render('login', { error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("❌ Invalid password for:", email);
      return res.render('login', { error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ name: user.name, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/secrets');
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.render('login', { error: 'Login failed due to server error.' });
  }
});


module.exports = router;
const Secret = require('../models/Secret');


router.get('/secrets', authMiddleware, async (req, res) => {
  const userSecrets = await Secret.find({ userEmail: req.user.email });
  res.render('secrets', { user: req.user, secrets: userSecrets });
});

router.post('/secrets', authMiddleware, async (req, res) => {
  const secret = new Secret({
    content: req.body.secret,
    userEmail: req.user.email
  });
  await secret.save();
  res.redirect('/secrets');
});
router.post('/secrets/update/:id', authMiddleware, async (req, res) => {
  await Secret.findOneAndUpdate({ _id: req.params.id, userEmail: req.user.email }, { content: req.body.content });
  res.redirect('/secrets');
});


router.get('/secrets/delete/:id', authMiddleware, async (req, res) => {
  await Secret.deleteOne({ _id: req.params.id, userEmail: req.user.email });
  res.redirect('/secrets');
});
