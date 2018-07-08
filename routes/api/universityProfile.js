const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Validation
const validateUniversityProfileInput = require('../../validation/universityProfile');
const validateCouresInput = require('../../validation/courses');

// Load UniversityProfile Model
const UniversityProfile = require('../../models/UniversityProfile');
// Load University Model
const University = require('../../models/University');

// @route   GET api/university/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'University Profile Works' }));

// @route   GET api/university/profile
// @desc    Get current university profile
// @access  Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};

    UniversityProfile.findOne({ university: req.university.id })
      .populate('university', ['name', 'avatar'])
      .then(universityProfile => {
        if (!universityProfile) {
          errors.noprofile = 'There is no profile for this university';
          return res.status(404).json(errors);
        }
        res.json(universityProfile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   GET api/universitiy/profile/all
// @desc    Get all university profiles
// @access  Public
router.get('/all', (req, res) => {
  const errors = {};

  UniversityProfile.find()
    .populate('university', ['name', 'avatar'])
    .then(universityProfiles => {
      if (!universityProfiles) {
        errors.noprofile = 'There are no university profiles';
        return res.status(404).json(errors);
      }

      res.json(universityProfiles);
    })
    .catch(err => res.status(404).json({ universityProfile: 'There are no university profiles' }));
});

// @route   GET api/university/profile/handle/:handle
// @desc    Get university profile by handle
// @access  Public

router.get('/handle/:handle', (req, res) => {
  const errors = {};

  UniversityProfile.findOne({ handle: req.params.handle })
    .populate('university', ['name', 'avatar'])
    .then(universityProfile => {
      if (!universityProfile) {
        errors.noprofile = 'There is no profile for this university';
        res.status(404).json(errors);
      }

      res.json(universityProfile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/university/profile/university/:university_id
// @desc    Get profile by university ID
// @access  Public

router.get('/university/:university_id', (req, res) => {
  const errors = {};

  UniversityProfile.findOne({ university: req.params.university_id })
    .populate('university', ['name', 'avatar'])
    .then(universityProfile => {
      if (!universityProfile) {
        errors.noprofile = 'There is no profile for this university';
        res.status(404).json(errors);
      }

      res.json(universityProfile);
    })
    .catch(err =>
      res.status(404).json({ universityProfile: 'There is no profile for this uuniversity' })
    );
});

// @route   POST api/university/profile
// @desc    Create or edit university profile
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateUniversityProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.university = req.university.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.status) profileFields.status = req.body.status;
    // schools - Spilt into array
    if (typeof req.body.schools !== 'undefined') {
      profileFields.schools = req.body.schools.split(',');
    }

    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;

    UniversityProfile.findOne({ university: req.university.id }).then(universityProfile => {
      if (universityProfile) {
        // Update
        UniversityProfile.findOneAndUpdate(
          { university: req.university.id },
          { $set: profileFields },
          { new: true }
        ).then(universityProfile => res.json(universityProfile));
      } else {
        // Create

        // Check if handle exists
        UniversityProfile.findOne({ handle: profileFields.handle }).then(universityProfile => {
          if (universityProfile) {
            errors.handle = 'That handle already exists';
            res.status(400).json(errors);
          }

          // Save Profile
          new UniversityProfile(profileFields).save().then(universityProfile => res.json(universityProfile));
        });
      }
    });
  }
);

// @route   POST api/university/profile/courses
// @desc    Add courses to university profile
// @access  Private
router.post(
  '/courses',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateCoursesInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    UniversityProfile.findOne({ university: req.university.id }).then(universityProfile => {
      const newCourse = {
        degree: req.body.degree,
        stream: req.body.stream,
        description: req.body.description
      };

      // Add to exp array
      universityProfile.courses.unshift(newCourse);

      universityProfile.save().then(universityProfile => res.json(universityProfile));
    });
  }
);

// @route   DELETE api/university/profile/courses/:course_id
// @desc    Delete course from university profile
// @access  Private
router.delete(
  '/courses/:course_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    UniversityProfile.findOne({ university: req.university.id })
      .then(universityProfile => {
        // Get remove index
        const removeIndex = universityProfile.courses
          .map(item => item.id)
          .indexOf(req.params.course_id);

        // Splice out of array
        universityProfile.courses.splice(removeIndex, 1);

        // Save
        universityProfile.save().then(universityProfile => res.json(universityProfile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/university/profile
// @desc    Delete university and profile
// @access  Private
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    universityProfile.findOneAndRemove({ university: req.university.id }).then(() => {
      University.findOneAndRemove({ _id: req.university.id }).then(() =>
        res.json({ success: true })
      );
    });
  }
);

module.exports = router;
