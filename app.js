const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const client = require("./util/database");
const { initializeSchema } = require("./util/schema");
const cors = require("cors");
const helmet = require("helmet");
const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const purchaseRoutes = require("./routes/purchase");
const premiumRoutes = require("./routes/premium");
const passwordRoutes = require("./routes/password");
const morgan = require("morgan");

const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("combined", { stream: accessLogStream }));
app.use(bodyParser.json());

// NOTE: ClickHouse has no foreign keys or associations.
// Referential integrity (e.g., CASCADE deletes) must be handled in application code.

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.use(userRoutes);
app.use(expenseRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/premium", premiumRoutes);
app.use("/password", passwordRoutes);

// Initialize ClickHouse schema (creates tables if they don't exist), then start server
initializeSchema()
  .then(() => {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize ClickHouse schema:", err);
    process.exit(1);
  });
