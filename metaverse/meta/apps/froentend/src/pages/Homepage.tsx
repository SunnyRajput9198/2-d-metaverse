import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, Shield, Heart, Map, Mic } from 'lucide-react';
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <img
            src="./homepage/a1.png"
            alt="Logo"
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">2-D Metaverse</h1>
        </div>
        <div className="space-x-4">
          <Button onClick={() => navigate("/login")} className="bg-purple-600 hover:bg-purple-700">
            Login
          </Button>
          <Button variant="outline" onClick={() => navigate("/signup")}>
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-6">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Metaverse</span>?
          </h3>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of virtual collaboration with cutting-edge features designed for seamless teamwork
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xl px-6 py-3 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          Get Started
        </Button>

      </section>

      {/* Features */}
      <section className="px-8 py-20 bg-gradient-to-b from-[#0f0f14] to-[#18181c]">
        <div className="max-w-7xl mx-auto">


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Real-Time Movement",
                desc: "Navigate your avatar across custom maps with smooth, real-time updates and fluid animations.",
                gradient: "from-yellow-400 to-orange-500"
              },
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Text Chat & Emojis",
                desc: "Instantly message others with global and private chat, plus rich emoji reactions.",
                gradient: "from-blue-400 to-cyan-500"
              },
              {
                icon: <Mic className="w-8 h-8" />,
                title: "Video & Audio Calls",
                desc: "Join spatial video chats that start automatically when you're nearby teammates.",
                gradient: "from-green-400 to-emerald-500"
              },
              {
                icon: <Map className="w-8 h-8" />,
                title: "Custom Spaces",
                desc: "Create and personalize your own rooms with custom backgrounds and interactive layouts.",
                gradient: "from-purple-400 to-violet-500"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Secure & Private",
                desc: "End-to-end authentication and encryption ensures your conversations stay completely private.",
                gradient: "from-red-400 to-pink-500"
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Free & Open Source",
                desc: "MetaSpace is 100% free forever and completely open source for developers.",
                gradient: "from-pink-400 to-rose-500"
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-gradient-to-br from-[#1a1a24] to-[#2a2a35] p-8 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl p-[1px]">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-20`}></div>
                </div>

                {/* Icon with gradient background */}
                <div className={`relative w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 text-base leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.desc}
                  </p>
                </div>

                {/* Subtle glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
              </div>
            ))}
          </div>

          {/* Additional CTA */}
          <div className="text-center mt-16">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 font-semibold text-lg shadow-lg hover:shadow-xl">
              Explore All Features
            </button>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6 border-t border-gray-700">
        © {new Date().getFullYear()} MetaSpace · Built by Sunny Rajput
      </footer>
    </div>
  );
};

export default HomePage;
