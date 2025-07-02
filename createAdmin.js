require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/Users'); // Sesuaikan path

async function createAdmin() {
  try {
    // 1. Connect ke DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke database');

    // 2. Buat admin baru
    const admin = await User.create({
      username: 'admin2', // Ganti dengan username yang diinginkan
      password: 'passwordkuat123', // Ganti dengan password kuat
      role: 'admin'
    });

    console.log('\n=======================');
    console.log('✅ ADMIN BARU BERHASIL DIBUAT');
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🔑 Password: passwordkuat123`); // Tampilkan password plain hanya sekali
    console.log(`🆔 Role: ${admin.role}`);
    console.log('=======================\n');

  } catch (error) {
    console.error('\n❌ Gagal membuat admin:', error.message);
    console.log('Penyebab:');
    if (error.code === 11000) {
      console.log('- Username sudah terdaftar');
    }
    console.log('\n');
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();