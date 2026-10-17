### Hosted Link: https://expense-tracker-fs.netlify.app

### Technical Stack Used:
ReactJS, HTML, CSS, JavaScript, React-Router-Dom, Razorpay Payment Gateway, NodeJS, ExpressJS, ClickHouse (Columnar OLAP), JWT Authentication, nodemailer, AWS S3 bucket.

### Features:
• User signup, login, reset password and logout.
• Add, Delete Expense. User can see Full Expense Report.
• Premium users can download Full Expense Report, see daily/weekly/monthly/yearly Expense Report, see previously downloaded files, see Expense Leaderboard.

### Database Architecture & Optimizations:
For detailed technical documentation on ClickHouse table engines (`MergeTree`, `ReplacingMergeTree`, `SummingMergeTree`), data-skipping bloom filter & set indexes, and incremental Materialized Views, see [OPTIMIZATIONS.md](./OPTIMIZATIONS.md).
