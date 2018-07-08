const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load University model
const University = require('../../models/University');

// @route   GET api/university/test
// @desc    Tests university route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'University Works' }));

// @route   POST api/university/register
// @desc    Register university
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  University.findOne({ email: req.body.email }).then(university => {
    if (university) {
      errors.email = 'Email already exists';
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: '200', // Size
        r: 'pg', // Rating
        d: 'mm' // Default
      });

      const newUniversity = new University({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUniversity.password, salt, (err, hash) => {
          if (err) throw err;
          newUniversity.password = hash;
          newUniversity
            .save()
            .then(university => res.json(university))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route   GET api/university/ogin
// @desc    Login University / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find university by email
  University.findOne({ email }).then(university => {
    // Check for university
    if (!university) {
      errors.email = 'University not found';
      return res.status(404).json(errors);
    }

    // Check Password
    bcrypt.compare(password, university.password).then(isMatch => {
      if (isMatch) {
        // University Matched
        const payload = { id: university.id, name: university.name, avatar: university.avatar }; // Create JWT Payload

        // Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token
            });
          }
        );
      } else {
        errors.password = 'Password incorrect';
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/university/current
// @desc    Return current university
// @access  Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.university.id,
      name: req.university.name,
      email: req.university.email
    });
  }
);

module.exports = router;
