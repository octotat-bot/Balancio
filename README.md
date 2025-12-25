# Split - Fair Expense Sharing Web App

A production-ready, full-stack expense splitting application built to solve real-world post-trip settlement chaos. Features accurate calculations, minimized settlements, and a calming, conflict-reducing UI.

## 🎯 Core Features

- **Fair Expense Tracking**: Track group expenses with precise decimal calculations
- **Smart Balance Calculation**: Server-side aggregation using MongoDB pipelines
- **Optimized Settlements**: Greedy algorithm minimizes transaction count
- **Beautiful Animations**: Purposeful Framer Motion animations that enhance UX
- **Transparent Calculations**: Every calculation is visible and verifiable
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Decimal.js for precise calculations
- Bcrypt for password hashing

**Frontend:**
- React 18
- React Router v6
- Framer Motion (animations)
- Recharts (future: visual summaries)
- Modern CSS (no Tailwind)
- Axios for API calls

### Data Models

```
User
├── _id
├── name
├── email (unique)
├── passwordHash
└── createdAt

Group
├── _id
├── name
├── createdBy (User ref)
└── createdAt

GroupMember
├── _id
├── groupId (Group ref)
├── userId (User ref)
└── joinedAt

Expense
├── _id
├── groupId (Group ref)
├── amount (Decimal128)
├── description
├── paidBy (User ref)
└── createdAt

ExpenseSplit
├── _id
├── expenseId (Expense ref)
├── userId (User ref)
└── shareAmount (Decimal128)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd split
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/split-expense
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
```

5. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

6. **Start the backend server**
```bash
cd backend
npm run dev
```

7. **Start the frontend dev server**
```bash
cd frontend
npm run dev
```

8. **Open your browser**
```
http://localhost:5173
```

## 📊 Core Business Logic

### Balance Calculation

```javascript
balance = totalPaidByUser - totalShareOfUser

// Interpretation:
// balance > 0  → user should RECEIVE money
// balance < 0  → user should PAY money
// balance = 0  → user is settled
```

### Settlement Algorithm

**Input:** User balances
```
A: +1000
B: -400
C: -600
```

**Output:** Minimized transactions
```
B → A: 400
C → A: 600
```

**Algorithm:**
1. Separate creditors (positive balance) and debtors (negative balance)
2. Sort both by absolute amount (descending)
3. Greedily match largest creditor with largest debtor
4. Settle as much as possible
5. Remove settled parties and repeat

### Uneven Split Handling

Example: ₹100 split among 3 people

```javascript
Base share: ₹33.33
Remainder: ₹0.01

Distribution:
Person 1: ₹33.34
Person 2: ₹33.33
Person 3: ₹33.33
Total: ₹100.00 ✓
```

## 🎨 UI/UX Philosophy

### Design Principles

1. **Emotionally Calming**: Soft gradients, warm tones, trust-building blues
2. **Conflict-Reducing**: Clear visualizations prevent disputes
3. **Premium Feel**: Modern typography, smooth animations, glassmorphism
4. **Accessibility**: Respects `prefers-reduced-motion`

### Key Animations

- **Balance Avatars**: Creditors glow green, debtors pulse orange, neutral stays calm
- **Settlement Arrows**: Animated SVG paths showing money flow
- **Expense Entry**: Amount field expands on focus
- **Celebration**: "All Settled" animation when balances hit zero

## 🔒 Security

- JWT tokens with 7-day expiration
- Bcrypt password hashing (10 rounds)
- Server-side validation for all inputs
- User authorization checks on all protected routes
- No trust in frontend data

## 📱 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user (protected)
```

### Groups
```
POST   /api/groups                    - Create group
GET    /api/groups                    - Get user's groups
GET    /api/groups/:groupId           - Get group details
POST   /api/groups/:groupId/members   - Add member
GET    /api/groups/:groupId/balances  - Get balances
GET    /api/groups/:groupId/settlement - Get settlement plan
```

### Expenses
```
POST   /api/expenses                  - Create expense
GET    /api/groups/:groupId/expenses  - Get group expenses
DELETE /api/expenses/:expenseId       - Delete expense
```

## 🧪 Edge Cases Handled

### Financial
- ✅ Uneven splits (₹100 / 3)
- ✅ Decimal precision errors
- ✅ Rounding safety using Decimal128
- ✅ Tiny residual balances (≤ ₹0.01)
- ✅ Large group sizes

### Logical
- ✅ User pays but is not included in split
- ✅ Expense deletion → recalculates balances
- ✅ Same user pays multiple expenses
- ✅ Group with single member
- ✅ Partial group splits
- ✅ New user added after expenses exist
- ✅ Duplicate expense submission
- ✅ Negative or zero expenses blocked

### Security
- ✅ JWT required on all protected routes
- ✅ User cannot access other groups
- ✅ All validations server-side
- ✅ No trust in frontend data

## 📈 Performance Optimizations

- MongoDB indexes on frequently queried fields
- Aggregation pipelines for balance calculations
- Pagination for expense lists
- No floating-point math (Decimal128 everywhere)
- Optimized re-renders with React

## 🎯 Portfolio Highlights

This project demonstrates:

1. **Real-world problem solving** - Addresses actual pain points
2. **Backend data modeling** - Normalized schema with proper relationships
3. **MongoDB aggregation mastery** - Complex queries with pipelines
4. **Financial correctness** - Decimal128 for precision
5. **Algorithmic reasoning** - Settlement optimization
6. **Advanced UI/UX** - Purposeful animations with accessibility
7. **Full-stack integration** - Seamless frontend-backend communication
8. **Security best practices** - JWT, bcrypt, validation

## 📝 Future Enhancements

- [ ] Receipt upload and OCR
- [ ] Multiple currencies with conversion
- [ ] Recurring expenses
- [ ] Email notifications
- [ ] Export to CSV/PDF
- [ ] Mobile app (React Native)
- [ ] Split by percentage or custom amounts
- [ ] Group chat integration

## 🤝 Contributing

This is a portfolio project, but suggestions are welcome!

## 📄 License

MIT License - feel free to use this for learning or your own projects.

## 👨‍💻 Author

Built with ❤️ as a demonstration of full-stack development skills.

---

**Note**: This application is designed to be production-ready with proper error handling, security, and user experience. It's built as if real friends will use it on their next trip.
