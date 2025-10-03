import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Space } from '../types';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { Input } from "@/components/ui/input"

const DashboardPage: React.FC = () => {
    const { token, isAuthenticated, signout, BACKEND_URL } = useAuth();
    const navigate = useNavigate();
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [newSpaceName, setNewSpaceName] = useState<string>('');
    const [newSpaceImageUrl, setNewSpaceImageUrl] = useState<string>('https://withjulio.com/wp-content/uploads/2022/04/Gather-Town-with-Julio-Evanston-1-1024x610.png');
    const [newSpaceDimensions, setNewSpaceDimensions] = useState<string>('20x20');
    const [showForm, setShowForm] = useState(false);

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState<string | null>(null)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, _spaceId: string) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMousePosition({ x, y })
    }

    const handleMouseEnter = (spaceId: string) => {
        setIsHovered(spaceId)
    }

    const handleMouseLeave = () => {
        setIsHovered(null)
    }

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchSpaces();
    }, [isAuthenticated, navigate, token]);
    const defaultImageUrl = "https://withjulio.com/wp-content/uploads/2022/04/Gather-Town-with-Julio-Evanston-1-1024x610.png";
    const fetchSpaces = async () => {
        if (!token) return;
        try {
            const response = await axios.get<{ spaces: Space[] }>(`${BACKEND_URL}/api/v1/space/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSpaces(response.data.spaces);
        } catch (error: any) {
            console.error('Error fetching spaces:', error.response?.data || error.message);
            if (error.response?.status === 403) signout();
        }
    };

    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            const response = await axios.post<{ spaceId: string }>(`${BACKEND_URL}/api/v1/space`, {
                name: newSpaceName,
                dimensions: newSpaceDimensions,
                imageUrl: newSpaceImageUrl || defaultImageUrl

            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                fetchSpaces();
                setNewSpaceName('');
                setNewSpaceDimensions('20x20');
                setNewSpaceImageUrl('https://withjulio.com/wp-content/uploads/2022/04/Gather-Town-with-Julio-Evanston-1-1024x610.png'); // Clear the image URL input after creation
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
            fetchSpaces();
        } catch (error: any) {
            console.error('Error deleting space:', error.response?.data || error.message);
            alert(`Could not delete space: ${error.response?.data?.message || error.message}`);
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0b0b10] via-[#121212] to-[#1a1a1f] font-sans text-gray-900">
            {/* New Single Header - combines all top elements */}
            <header className="fixed bg-gradient-to-b from-[#0b0b10] via-[#121212] to-[#1a1a1f] top-0 left-0 right-0 h-20 shadow-md z-50 flex items-center justify-between px-6">
                {/* Left Side: Logo and Title */}
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <img
                            className="h-10 w-10"
                            src="https://app.gather.town/images/spinner.png"
                            alt="Logo"
                        />
                    </div>
                    <div className=' class:layout display:flex margin:4px'></div>
                    <Button className="bg-[#4c5381] text-white font-semibold hover:bg-[#3d436b] transition-colors">
                        My Spaces
                    </Button>

                </div>

                {/* Right Side: Create Form and Sign Out Button */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        {/* Toggle Button */}
                        <Button
                            type="button"
                            onClick={() => setShowForm((prev) => !prev)}
                            className="bg-purple-600 text-white px-4 py-1.5 rounded-md hover:bg-purple-700 transition font-semibold flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Space
                        </Button>

                        {/* Conditionally Rendered Form */}
                        {showForm && (
                            <form onSubmit={handleCreateSpace} className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="New Space Name"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    className="bg-[#1e1e2f] text-white placeholder:text-gray-400 px-4 py-2 w-52 rounded-md border-2 border-purple-600 focus:ring-2 focus:ring-pink-500 shadow hover:shadow-md transition"
                                    required
                                />
                                <Input
                                    type="text"
                                    placeholder="20x20"
                                    value={newSpaceDimensions}
                                    onChange={(e) => setNewSpaceDimensions(e.target.value)}
                                    className="bg-[#1e1e2f] text-white placeholder:text-gray-400 px-4 py-2 w-32 rounded-md border-2 border-purple-600 focus:ring-2 focus:ring-pink-500 shadow hover:shadow-md transition"
                                    required
                                />
                                <Input
                                    type="url"
                                    placeholder="Image URL (optional)"
                                    value={newSpaceImageUrl}
                                    onChange={(e) => setNewSpaceImageUrl(e.target.value)}
                                    className="bg-[#1e1e2f] text-white placeholder:text-gray-400 px-4 py-2 w-60 rounded-md border-2 border-purple-600 focus:ring-2 focus:ring-pink-500 shadow hover:shadow-md transition"
                                />
                                <Button
                                    type="submit"
                                    className="bg-green-600 text-white px-5 py-1.5 rounded-md hover:bg-green-700 transition font-semibold"
                                >
                                    Create
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Sign Out Button */}
                    <Button
                        onClick={signout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md transition font-semibold text-sm"
                    >
                        Sign Out
                    </Button>
                </div>
            </header>

            <main className="pt-24 px-8">
                <section className="rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-6 text-white">Available Spaces</h2>
                    {spaces.length === 0 ? (
                        <p className="text-gray-400">No spaces created yet. Create one above!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-16">
                            {spaces.map((space) => (
                                <div
                                    key={space.id}
                                    className="relative"
                                    onMouseMove={(e) => handleMouseMove(e, space.id)}
                                    onMouseEnter={() => handleMouseEnter(space.id)}
                                    onMouseLeave={handleMouseLeave}
                                    style={{
                                        transform: isHovered === space.id ? "none" : "none",
                                        transition: "transform 0.1s ease-out",
                                    }}
                                >
                                    <Card
                                        className="bg-gradient-to-b from-[#0b0b10] via-[#121212] to-[#1a1a1f] border-2 border-[#24cfa6] shadow-indigo-900/70 text-white/95 shadow-md rounded-xl transition-all duration-200 hover:shadow-xl relative overflow-hidden"
                                        style={{
                                            transform:
                                                isHovered === space.id
                                                    ? `perspective(1000px) rotateX(${((mousePosition.y - 150) / 150) * -8}deg) rotateY(${((mousePosition.x - 150) / 150) * 8}deg) scale3d(1.02, 1.02, 1.02)`
                                                    : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
                                            transition: isHovered === space.id ? "transform 0.1s ease-out" : "transform 0.3s ease-out",
                                        }}
                                    >
                                        {isHovered === space.id && (
                                            <div
                                                className="absolute pointer-events-none z-10"
                                                style={{
                                                    left: mousePosition.x - 15,
                                                    top: mousePosition.y - 15,
                                                    width: "220px",
                                                    height: "180px",
                                                    background:
                                                        "radial-gradient(rgba(35, 196, 92, 0.6) 0%, rgba(36, 207, 166, 0.3), transparent ,transparent)",
                                                    borderRadius: "50%",
                                                    transition: "all 0.1s ease-out",
                                                }}
                                            />
                                        )}
                                        <CardContent className="p-4 flex flex-col gap-5 relative z-20">
                                            <img
                                                src={"/maps/space.png"}
                                                alt={space.name}
                                                className="w-full h-full object-cover rounded-md"
                                                onError={(e) => {
                                                    e.currentTarget.src = "https://placehold.co/400x200/cccccc/FFFFFF?text=No+Image"
                                                }}
                                            />
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-lg font-semibold text-white truncate">{space.name}</h3>
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <Button
                                                    onClick={() => navigate(`/space/${space.id}`)}
                                                    className="bg-[#24cfa6] hover:bg-emerald-700 text-gray-900 text-sm font-semibold px-5 py-2 shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2"
                                                >
                                                    Join
                                                </Button>

                                                <Button
                                                    onClick={() => handleDeleteSpace(space.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );

};

export default DashboardPage;
