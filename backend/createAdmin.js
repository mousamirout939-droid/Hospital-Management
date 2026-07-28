require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await connectDB();

    await User.deleteOne({ email: 'admin@hms.com' });

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@hms.com',
      password: 'Admin@12345',
      role: 'admin',
      isActive: true,
    });

    console.log('===================================');
    console.log('Admin Created Successfully');
    console.log('Email    : admin@hms.com');
    console.log('Password : Admin@12345');
    console.log('===================================');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();