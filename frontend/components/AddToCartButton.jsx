import axios from 'axios';
import { useState } from 'react';

const AddToCartButton = ({ productId }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddToCart = async () => {
        setLoading(true);
        try {
            await axios.post('/api/cart', { product_id: productId, quantity });
            setError('');
            alert('Item added to cart!');
        } catch (err) {
            setError('Failed to add item to cart');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                type="number"
                className="input input-bordered w-20"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={loading}
            >
                {loading ? 'Adding...' : 'Add to Cart'}
            </button>
            {error && <p className="text-error">{error}</p>}
        </div>
    );
};

export default AddToCartButton;