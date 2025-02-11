import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await axios.get('/api/cart');
            setCart(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch cart');
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId, quantity) => {
        try {
            await axios.put(`/api/cart/${itemId}`, { quantity });
            fetchCart(); // Refresh cart after update
        } catch (err) {
            setError('Failed to update quantity');
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await axios.delete(`/api/cart/${itemId}`);
            fetchCart(); // Refresh cart after removal
        } catch (err) {
            setError('Failed to remove item');
        }
    };

    if (loading) return <div className="text-center">Loading...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="card bg-base-100 shadow-md p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold">{item.product_name}</h2>
                                    <p>Quantity: {item.quantity}</p>
                                    <p>Price: ${item.price}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        className="input input-bordered w-20"
                                        defaultValue={item.quantity}
                                        min="1"
                                        onChange={(e) =>
                                            handleUpdateQuantity(item.id, e.target.value)
                                        }
                                    />
                                    <button
                                        className="btn btn-error"
                                        onClick={() => handleRemoveItem(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CartPage;