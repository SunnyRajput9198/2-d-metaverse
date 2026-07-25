import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/signupcard.css';

interface AuthCardProps {
    title: string;
    children: React.ReactNode;
    error?: string;
    footerText: string;
    footerLinkText: string;
    footerLinkTo: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
    title,
    children,
    error,
    footerText,
    footerLinkText,
    footerLinkTo,
}) => {
    return (
        <div className="signup-page-container">
            <div className="signup-card">
                <h2 className="signup-title">{title}</h2>
                {children}
                {error && <p className="error-message">{error}</p>}
                <p className="login-link-text">
                    {footerText}{' '}
                    <Link to={footerLinkTo} className="login-link">
                        {footerLinkText}
                    </Link>
                </p>
            </div>
        </div>
    );
};
