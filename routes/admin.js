const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Book = require('../models/Book');
const { verifyAdmin } = require('./auth');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'smartminds/books',
        public_id: `book_${Date.now()}_${originalname.split('.')[0]}`,
        transformation: [
          { width: 400, height: 600, crop: 'fill', quality: 'auto' },
          { format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

// Create new book
router.post('/books', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      author,
      isbn,
      stock,
      inStock,
      featured,
      tags,
      preview
    } = req.body;

    let imageUrl = '';
    
    // Upload image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      imageUrl = result.secure_url;
    }

    const book = new Book({
      title,
      description,
      category,
      price: parseInt(price),
      author,
      isbn: isbn || undefined,
      stock: parseInt(stock) || 0,
      inStock: inStock === 'true',
      featured: featured === 'true',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      preview: preview && preview.trim() !== '' ? preview.trim() : undefined,
      images: {
        cover: imageUrl,
        thumbnail: imageUrl
      },
      createdBy: req.user.username
    });

    await book.save();
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating book',
      error: error.message
    });
  }
});

// Get all books for admin
router.get('/books', verifyAdmin, async (req, res) => {
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update book
router.put('/books/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const bookId = req.params.id;
    const updateData = { ...req.body };
    
    // Handle boolean conversions
    if (updateData.inStock) updateData.inStock = updateData.inStock === 'true';
    if (updateData.featured) updateData.featured = updateData.featured === 'true';
    if (updateData.price) updateData.price = parseInt(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.tags) updateData.tags = updateData.tags.split(',').map(tag => tag.trim());

    // Upload new image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      updateData.images = {
        cover: result.secure_url,
        thumbnail: result.secure_url
      };
    }

    const book = await Book.findByIdAndUpdate(bookId, updateData, { new: true });
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      book
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating book',
      error: error.message
    });
  }
});

// Delete book
router.delete('/books/:id', verifyAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Optionally delete image from Cloudinary
    if (book.images.cover) {
      const publicId = book.images.cover.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`smartminds/books/${publicId}`);
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting book',
      error: error.message
    });
  }
});

// Toggle stock status
router.patch('/books/:id/toggle-stock', verifyAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    book.inStock = !book.inStock;
    await book.save();

    res.json({
      success: true,
      message: `Book marked as ${book.inStock ? 'in stock' : 'sold out'}`,
      book
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock status',
      error: error.message
    });
  }
});

module.exports = router;