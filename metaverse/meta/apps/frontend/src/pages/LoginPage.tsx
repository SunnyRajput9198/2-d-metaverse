import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await signin(username, password);
            if (response.success) {
                const redirectPath = localStorage.getItem("redirectAfterLogin");
                navigate(redirectPath || '/dashboard');
                localStorage.removeItem("redirectAfterLogin");
            } else {
                setError(response.error || 'Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthCard
            title="Login to Your Account"
            error={error}
            footerText="Don’t have an account?"
            footerLinkText="Sign up here"
            footerLinkTo="/signup"
        >
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="form-input"
                        placeholder="Enter your username"
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input"
                        placeholder="Enter your password"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="signup-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </AuthCard>
    );
};

export default LoginPage;
