import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';

const SignupPage: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [type, setType] = useState<'user' | 'admin'>('user');
    const [error, setError] = useState<string>('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { success, error: signUpError } = await signup(username, password, type);
        if (success) {
            navigate('/dashboard');
        } else {
            setError(signUpError || 'Sign Up failed.');
        }
    };

    return (
        <AuthCard
            title="Create Your Account"
            error={error}
            footerText="Already have an account?"
            footerLinkText="Login here"
            footerLinkTo="/login"
        >
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                    <label htmlFor="username-input">Username</label>
                    <input
                        type="text"
                        id="username-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="form-input"
                        placeholder="Choose a username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password-input">Password</label>
                    <input
                        type="password"
                        id="password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input"
                        placeholder="Create a password"
                    />
                </div>
                <div className="form-group">
                    <label>Account Type</label>
                    <div className="role-selection">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="accountType"
                                value="user"
                                checked={type === 'user'}
                                onChange={() => setType('user')}
                            />
                            User
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="accountType"
                                value="admin"
                                checked={type === 'admin'}
                                onChange={() => setType('admin')}
                            />
                            Admin
                        </label>
                    </div>
                </div>
                <button type="submit" className="signup-button">Sign Up</button>
            </form>
        </AuthCard>
    );
};

export default SignupPage;