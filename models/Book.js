const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['math', 'science', 'programming', 'literature', 'history', 'arts'],
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  author: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  images: {
    thumbnail: String,
    cover: String,
    gallery: [String]
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Text search index
BookSchema.index({
  title: 'text',
  description: 'text',
  author: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Book', BookSchema);