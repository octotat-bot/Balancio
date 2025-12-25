require('dotenv').config();

console.log('=== Environment Check ===');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI?.substring(0, 20) || 'undefined');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('========================');
