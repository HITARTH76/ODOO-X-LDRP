const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Create a new product with image upload
exports.createProduct = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user.id;
    // Insert product without image_url first (temporary placeholder)
    const [result] = await db.query(
      'INSERT INTO products (name, description, image_url, created_by) VALUES (?, ?, ?, ?)',
      [name, description, '', createdBy]
    );
    const productId = result.insertId;
    // Determine final image path
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products', String(productId));
    fs.mkdirSync(uploadsDir, { recursive: true });
    // Expect multiple files; use first file for primary image
    const file = req.files && req.files[0];
    if (file) {
      const ext = path.extname(file.originalname);
      const newFileName = `${productId}${ext}`;
      const finalPath = path.join(uploadsDir, newFileName);
      fs.renameSync(file.path, finalPath);
      const imageUrl = `/uploads/products/${productId}/${newFileName}`;
      // Update product with actual image URL
      await db.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, productId]);
      res.status(201).json({ id: productId, name, description, image_url: imageUrl, created_by: createdBy });
    } else {
      // No image uploaded
      res.status(201).json({ id: productId, name, description, image_url: null, created_by: createdBy });
    }
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

// List all products (read‑only for any authenticated user)
exports.listProducts = async (req, res) => {
  try {
    const [products] = await db.query('SELECT id, name, description, image_url FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};
