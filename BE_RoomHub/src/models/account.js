import mongoose from 'mongoose';
const { Schema } = mongoose;

// Base Account Schema - Schema cơ sở cho tất cả các loại tài khoản
const accountOptions = {
  discriminatorKey: 'role', // Dùng trường role để phân biệt các loại tài khoản
  collection: 'accounts', // Tất cả tài khoản đều lưu trong collection này
  timestamps: true // Tự động tạo createdAt và updatedAt
};

// Schema cơ sở cho tất cả người dùng
const AccountSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  role: {
    type: String,
    enum: ['user', 'staff', 'owner', 'admin'],
    required: true
  },
  avatarImage: {
    publicId: String,
    url: {
      type: String,
      default: 'https://res.cloudinary.com/dcknewpzx/image/upload/v1716733369/default-avatar.png'
    }
  },
  deleted: {
    type: Boolean,
    default: false
  },
}, accountOptions);

// Tạo model Account gốc
const Account = mongoose.model('Account', AccountSchema);

// Schema cho User (người dùng thông thường)
const UserSchema = new Schema({
  socialID: {
    type: String,
    sparse: true // Cho phép null nhưng nếu có giá trị thì phải unique
  },
  phoneNumber: {
    type: String,
    trim: true
  }
});

// Schema cho Owner (chủ nhà trọ)
const OwnerSchema = new Schema({
  businessType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  businessName: {
    type: String,
    trim: true
  }
});

// Schema cho Staff (nhân viên)
const StaffSchema = new Schema({
  hireDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },
});

// Schema cho Admin
const AdminSchema = new Schema({
  // Admin có thể không cần thêm trường nào đặc biệt
  // Nhưng vẫn cần tạo discriminator để phân biệt
});

// Đăng ký các discriminator
const User = Account.discriminator('user', UserSchema);
const Owner = Account.discriminator('owner', OwnerSchema);
const Staff = Account.discriminator('staff', StaffSchema);
const Admin = Account.discriminator('admin', AdminSchema);

// Export tất cả các model
export { Account, User, Owner, Staff, Admin };