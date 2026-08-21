import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'superadmin' | 'admin' | 'sales' | 'customer' | 'employee';
  phone?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  employeeId?: string;
  // Profile completion & approval workflow
  profileCompleted?: boolean;
  approvalStatus?: 'NotSubmitted' | 'Pending' | 'Approved' | 'Rejected';
  profile?: {
    mobile?: string;
    aadhaar?: string;
    dob?: string;
    gender?: string;
    photo?: string; // base64 or url
    submittedAt?: Date;
    address?: string;
    pan?: string;
    bank?: {
      accountNumber?: string;
      ifsc?: string;
      accountType?: 'Savings' | 'Current' | 'Salary';
    };
    emergencyContact?: {
      name?: string;
      relation?: string;
      phone?: string;
    };
    salary?: number;
    pfContribution?: number;
    uan?: string;
    pensionStatus?: string;
    generatedPassword?: string;
  };
  currentSessionId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  lastLogoutAt?: Date;
  isOnline?: boolean;
  pushSubscriptions?: any[];
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'sales', 'customer', 'employee'],
      default: 'sales',
    },
    phone: { type: String },
    designation: { type: String },
    department: { type: String },
    joiningDate: { type: String },
    employeeId: { type: String, unique: true, sparse: true },
    profileCompleted: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['NotSubmitted', 'Pending', 'Approved', 'Rejected'], default: 'NotSubmitted' },
    profile: {
      mobile: { type: String },
      aadhaar: { type: String },
      dob: { type: String },
      gender: { type: String },
      photo: { type: String },
      submittedAt: { type: Date },
      address: { type: String },
      pan: { type: String },
      bank: {
        accountNumber: { type: String },
        ifsc: { type: String },
        accountType: { type: String, enum: ['Savings', 'Current', 'Salary'] },
      },
      emergencyContact: {
        name: { type: String },
        relation: { type: String },
        phone: { type: String },
      },
      salary: { type: Number },
      pfContribution: { type: Number },
      uan: { type: String },
      pensionStatus: { type: String },
      generatedPassword: { type: String },
    },
    currentSessionId: { type: Schema.Types.ObjectId, ref: 'EmployeeSession' },
    lastLoginAt: { type: Date },
    lastLogoutAt: { type: Date },
    isOnline: { type: Boolean, default: false },
    pushSubscriptions: { type: Array, default: [] },
  },
  { timestamps: true }
);

// Encrypt password before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
