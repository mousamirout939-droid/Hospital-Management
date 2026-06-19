const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const sampleDoctors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hms.com',
    phone: '9876543210',
    specialization: 'Cardiologist',
    department: 'Cardiology',
    qualification: 'MD, DM Cardiology',
    experienceYears: 12,
    consultationFee: 800,
    bio: 'Specializes in interventional cardiology and heart disease prevention.',
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '13:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
      { day: 'Friday', startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@hms.com',
    phone: '9876543211',
    specialization: 'Neurologist',
    department: 'Neurology',
    qualification: 'MD, DM Neurology',
    experienceYears: 9,
    consultationFee: 900,
    bio: 'Expert in treating neurological disorders including epilepsy and stroke.',
    availability: [
      { day: 'Tuesday', startTime: '10:00', endTime: '14:00' },
      { day: 'Thursday', startTime: '10:00', endTime: '14:00' },
    ],
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@hms.com',
    phone: '9876543212',
    specialization: 'Pediatrician',
    department: 'Pediatrics',
    qualification: 'MD Pediatrics',
    experienceYears: 7,
    consultationFee: 600,
    bio: 'Dedicated to providing comprehensive care for infants, children, and adolescents.',
    availability: [
      { day: 'Monday', startTime: '14:00', endTime: '18:00' },
      { day: 'Tuesday', startTime: '14:00', endTime: '18:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '13:00' },
    ],
  },
  {
    name: 'Dr. James Patel',
    email: 'james.patel@hms.com',
    phone: '9876543213',
    specialization: 'Orthopedic Surgeon',
    department: 'Orthopedics',
    qualification: 'MS Orthopedics',
    experienceYears: 15,
    consultationFee: 1000,
    bio: 'Specializes in joint replacement surgery and sports injuries.',
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '12:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '12:00' },
    ],
  },
  {
    name: 'Dr. Anita Desai',
    email: 'anita.desai@hms.com',
    phone: '9876543214',
    specialization: 'Dermatologist',
    department: 'Dermatology',
    qualification: 'MD Dermatology',
    experienceYears: 6,
    consultationFee: 700,
    bio: 'Focused on medical and cosmetic dermatology treatments.',
    availability: [
      { day: 'Wednesday', startTime: '11:00', endTime: '15:00' },
      { day: 'Friday', startTime: '11:00', endTime: '15:00' },
    ],
  },
  {
    name: 'Dr. Robert Kim',
    email: 'robert.kim@hms.com',
    phone: '9876543215',
    specialization: 'General Physician',
    department: 'General Medicine',
    qualification: 'MBBS, MD',
    experienceYears: 10,
    consultationFee: 500,
    bio: 'Provides comprehensive primary care for adults of all ages.',
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '17:00' },
    ],
  },
];

const seedData = async () => {
  try {
    await connectDB();

    // ---- Seed Admin ----
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hms.com').toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account already exists (${adminEmail}). Skipping admin creation.`);
    } else {
      await User.create({
        name: process.env.ADMIN_NAME || 'Super Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@12345',
        role: 'admin',
      });
      console.log(`Admin account created: ${adminEmail}`);
    }

    // ---- Seed Doctors ----
    const existingDoctorCount = await Doctor.countDocuments();
    if (existingDoctorCount > 0) {
      console.log(`Doctors collection already has ${existingDoctorCount} records. Skipping doctor seed.`);
    } else {
      await Doctor.insertMany(sampleDoctors);
      console.log(`Seeded ${sampleDoctors.length} sample doctors.`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();
