const express = require('express');
const session = require('express-session');
const passport = require('./passportConfig');
const { PrismaClient } = require('@prisma/client');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const flash = require('connect-flash');
const upload = require('./multerConfig');
const folderRoutes = require('./routes/folders');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Adjust path as needed
});

// Authentication routes
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
      },
    });
    console.log('success!');
    res.redirect('/');
  } catch {
    res.redirect('/register');
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Protected route example
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    include: {
      files: {
        select: {
          id: true,
          name: true,
          url: true,
          size: true,
          uploadedAt: true, // Ensure this field is selected
          folderId: true,
        },
      },
    },
  });

  const filesWithoutFolder = await prisma.file.findMany({
    where: { userId: req.user.id, folderId: null },
    select: {
      id: true,
      name: true,
      url: true,
      size: true,
      uploadedAt: true, // Ensure this field is selected
      folderId: true,
    },
  });

  const selectedFolderId = req.query.folderId || 'all'; // Get the folderId from the query string if it exists

  res.render('dashboard', {
    user: { username: req.user.username },
    folders,
    filesWithoutFolder,
    selectedFolderId,
  });
});

app.put('/files/:id', async (req, res) => {
  const { folderId } = req.body;
  try {
    // Find the file and check if it belongs to the logged-in user
    const file = await prisma.file.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (file && file.userId === req.user.id) {
      await prisma.file.update({
        where: { id: file.id },
        data: { folderId: folderId ? parseInt(folderId) : null },
      });
      res.status(204).send();
    } else {
      res
        .status(403)
        .json({ error: 'You do not have permission to update this file' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating file' });
  }
});

// File upload route
app.post(
  '/upload',
  ensureAuthenticated,
  upload.single('file'),
  async (req, res) => {
    try {
      const file = await prisma.file.create({
        data: {
          name: req.file.filename,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`,
          userId: req.user.id,
          folderId: Number(req.body.folderId) || null, // Optional folder assignment
        },
      });
      res.redirect('/dashboard');
    } catch (error) {
      res.status(500).json({ error: 'File upload failed' });
    }
  }
);

// Delete file route
app.delete('/files/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch the file from the database
    const file = await prisma.file.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    // Check if the file belongs to the logged-in user
    if (file && file.userId === req.user.id) {
      // Delete the file record from the database only
      await prisma.file.delete({
        where: { id: file.id },
      });

      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res
        .status(403)
        .json({ error: 'You do not have permission to delete this file' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting file' });
  }
});

app.use('/folders', folderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
