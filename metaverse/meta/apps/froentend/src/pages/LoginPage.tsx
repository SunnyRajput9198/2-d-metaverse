import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signin } = useAuth();
const navigate = useNavigate();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("handleSubmit");
        setError('');
        setIsLoading(true);

        try {
            const response = await signin(username, password);
            console.log("response", response);
            if (response.success) {
                console.log("Successfully signed in");
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-page-container">
            <div className="signup-card">
                <h2 className="signup-title">Login to Your Account</h2>
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
                        onClick={() => console.log("Button clicked")} // ✅ Add thi
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <p className="login-link-text">
                    Don’t have an account?{' '}
                    <Link to="/signup" className="login-link">Sign up here</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
