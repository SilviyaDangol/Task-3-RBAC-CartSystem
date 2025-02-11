import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../components/utils.jsx';
import { RegisterForm, LoginForm, ForgotPasswordForm, ResetPasswordForm } from '../components/auth.jsx';
import CartPage from '../components/CartPage.jsx'; // Import the CartPage component

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
                    <Route path="/cart" element={<CartPage />} /> {/* Add Cart Route */}
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;