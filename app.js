const express = require("express");
const session = require("express-session");
const passport = require("./passportConfig");
const { PrismaClient } = require("@prisma/client");
const upload = require("./multerConfig");
const folderRoutes = require("./routes/folders");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
const prisma = new PrismaClient();

app.set("view engine", "ejs");

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

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Adjust path as needed
});

// Authentication routes
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
      },
    });
    console.log("success!");
    res.redirect("/");
  } catch {
    res.redirect("/register");
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Protected route example
app.get("/dashboard", ensureAuthenticated, async (req, res) => {
  // Fetch folders and files for the user
  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    include: { files: true },
  });

  res.render("dashboard", { user: req.user, folders });
});

app.use("/user/folders", folderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
