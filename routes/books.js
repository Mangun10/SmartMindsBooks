const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Get all books with filters and search
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      featured, 
      inStock,
      page = 1, 
      limit = 20 
    } = req.query;
    
    let query = {};
    
    // Build query based on filters
    if (category && category !== '') query.category = category;
    if (featured === 'true') query.featured = true;
    if (inStock === 'true') query.inStock = true;
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    // Text search
    if (search && search.trim() !== '') {
      query.$text = { $search: search };
    }
    
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Book.countDocuments(query);
    
    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error fetching books'
    });
  }
});

// Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured books
router.get('/featured/list', async (req, res) => {
  try {
    const books = await Book.find({ featured: true, inStock: true })
      .limit(6)
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;