import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get('/products');
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load product catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading catalog...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {products.map((product) => (
        <div key={product.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
          <div style={{ padding: '12px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{product.name}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{product.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductCatalog;
