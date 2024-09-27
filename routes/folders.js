const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Create folder
router.post("/", async (req, res) => {
  try {
    const folder = await prisma.folder.create({
      data: {
        name: req.body.name,
        userId: req.user.id,
      },
    });
    res.redirect("/dashboard");
  } catch (error) {
    res.status(500).json({ error: "Error creating folder" });
  }
});

// Get all folders for the user
router.get("/", async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id },
    });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: "Error fetching folders" });
  }
});

// Update folder
router.put("/:id", async (req, res) => {
  try {
    const folder = await prisma.folder.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name },
    });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: "Error updating folder" });
  }
});

// Delete folder
router.delete("/:id", async (req, res) => {
  try {
    await prisma.folder.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error deleting folder" });
  }
});

module.exports = router;
