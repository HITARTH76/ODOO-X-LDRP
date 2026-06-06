import React, { useState } from 'react';
import { api } from '../utils/api';

const InventoryManager = ({ setActiveView }) => {
  const [productName, setProductName] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName || files.length === 0) {
      setMessage('Product name and at least one image are required.');
      return;
    }
    const formData = new FormData();
    formData.append('name', productName);
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    try {
      await api.post('/products', formData, true);
      setMessage('Product uploaded successfully!');
      setProductName('');
      setFiles([]);
    } catch (err) {
      console.error(err);
      setMessage('Upload failed.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Inventory Manager - Add New Product</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Product Name:</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label>Product Images:</label>
          <input type="file" multiple onChange={handleFileChange} accept="image/*" required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Upload</button>
        <button type="button" onClick={() => setActiveView('catalog')} style={{ marginLeft: '12px', padding: '8px 16px' }}>
          View Catalog
        </button>
      </form>
    </div>
  );
};

export default InventoryManager;
