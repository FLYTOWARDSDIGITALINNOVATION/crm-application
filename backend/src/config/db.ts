import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }

  try {
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (e) {}

  let conn;
  try {
    conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('ECONNREFUSED')) {
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      } catch (e) {}
      conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
    } else {
      throw err;
    }
  }

  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};
