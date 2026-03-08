### Hosted Link: https://expense-tracker-fs.netlify.app

### Project: Expense Tracker API - NestJS with Fastify

This is a complete rewrite of the backend from Express.js to **NestJS** with **Fastify** as the HTTP adapter and **TypeORM** as the ORM.

### Technical Stack Used:

**Frontend**: ReactJS, HTML, CSS, JavaScript, React-Router-Dom, Razorpay Payment Gateway  
**Backend**: NodeJS, **NestJS**, **Fastify**, PostgreSQL, **TypeORM**, JWT Authentication, nodemailer, AWS S3 bucket

**Additional Libraries**: Class-validator, Class-transformer, Passport.js, Bcrypt

### Key Improvements in This Migration:

✅ **Better Architecture**: NestJS provides modular, scalable structure  
✅ **Type Safety**: Full TypeScript support with strict typing  
✅ **Performance**: Fastify is significantly faster than Express  
✅ **Dependency Injection**: Built-in IoC container for better testability  
✅ **Guards & Decorators**: Cleaner middleware/authentication logic  
✅ **TypeORM**: Better ORM than Sequelize with type safety

### Features:

• User signup, login, reset password and logout with JWT authentication  
• Add, Delete Expense with pagination support  
• User can see Full Expense Report  
• Premium users can download Full Expense Report (CSV to S3)  
• Premium users can see daily/weekly/monthly/yearly Expense Reports  
• Premium users can see previously downloaded files  
• Premium users can see Expense Leaderboard  
• Razorpay payment integration for premium membership  
• Email-based password reset functionality

### Getting Started:

1. Install dependencies: `npm install`
2. Configure `.env` with your database and service credentials
3. Run development server: `npm run start:dev`
4. Run production build: `npm run build && npm run start:prod`

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration documentation and API endpoints.
