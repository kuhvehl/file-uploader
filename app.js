const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const upload = require("./multerSetup");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    // We'll add the Prisma session store here later
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes will be added here
app.post("/upload", upload.single("file"), (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // File uploaded successfully, you can access it via req.file
  res.send(`File uploaded successfully: ${req.file.filename}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
