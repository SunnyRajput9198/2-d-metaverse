// src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Space } from '../types'; // Import Space type

const DashboardPage: React.FC = () => {
    const { token, isAuthenticated, signout, BACKEND_URL } = useAuth();
    const navigate = useNavigate();
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [newSpaceName, setNewSpaceName] = useState<string>('');
    const [newSpaceDimensions, setNewSpaceDimensions] = useState<string>('100x200');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchSpaces();
    }, [isAuthenticated, navigate, token]);

    const fetchSpaces = async () => {
        if (!token) return; // Ensure token exists before fetching

        try {
            const response = await axios.get<{ spaces: Space[] }>(`${BACKEND_URL}/api/v1/space/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSpaces(response.data.spaces);
        } catch (error: any) {
            console.error('Error fetching spaces:', error.response?.data || error.message);
            if (error.response?.status === 403) {
                signout(); // Token expired or invalid
            }
        }
    };

    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            const response = await axios.post<{ spaceId: string }>(`${BACKEND_URL}/api/v1/space`, {
                name: newSpaceName,
                dimensions: newSpaceDimensions,
                // mapId: "..." // You might add a dropdown to select a map later
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                fetchSpaces(); // Refresh the list
                setNewSpaceName('');
                setNewSpaceDimensions('100x200');
            }
        } catch (error: any) {
            console.error('Error creating space:', error.response?.data || error.message);
            alert(`Failed to create space: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteSpace = async (spaceId: string) => {
        if (!token) return;

        try {
            await axios.delete(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSpaces(); // Refresh the list
        } catch (error: any) {
            console.error('Error deleting space:', error.response?.data || error.message);
            alert(`Could not delete space: ${error.response?.data?.message || error.message}. You might not have permission or it does not exist.`);
        }
    };

    return (
        <div>
            <h1>Your Spaces</h1>
            <button onClick={signout}>Sign Out</button>

            <h2>Create New Space</h2>
            <form onSubmit={handleCreateSpace}>
                <input
                    type="text"
                    placeholder="Space Name"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Dimensions (e.g., 100x200)"
                    value={newSpaceDimensions}
                    onChange={(e) => setNewSpaceDimensions(e.target.value)}
                    required
                />
                <button type="submit">Create Space</button>
            </form>

            <h2>Available Spaces</h2>
            {spaces.length === 0 ? (
                <p>No spaces created yet. Create one above!</p>
            ) : (
                <ul>
                    {spaces.map(space => (
                        <li key={space.id}>
                            {space.name} ({space.dimensions}) - <button onClick={() => navigate(`/space/${space.id}`)}>Join</button>
                            <button onClick={() => handleDeleteSpace(space.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DashboardPage;