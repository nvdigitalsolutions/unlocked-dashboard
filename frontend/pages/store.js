import { useEffect, useState } from 'react';

export default function Store() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.BACKEND_URL}/api/products`);
        const data = await res.json();
        setProducts(data.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1>Store</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.attributes.name} - ${p.attributes.price}</li>
        ))}
      </ul>
    </div>
  );
}
