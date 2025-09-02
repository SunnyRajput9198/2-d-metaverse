import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, Shield, Heart, Map, Mic } from 'lucide-react';
import { motion } from "framer-motion";
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen  bg-gradient-to-b from-[#0b0b10] via-[#121212] to-[#1a1a1f] text-white DM-Sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#121212]/70 border-b border-white/10 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-5 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="./homepage/a1.png"
              alt="Logo"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              MetaSpace
            </span>
          </div>

          {/* Nav Buttons */}
          <div className="space-x-4">
            <Button
              onClick={() => navigate("/login")}
              className="border border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white transition-all duration-200"
              variant="ghost"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
  {/* Left Tilted Image */}
  <img
    src="/homepage/vc.png"
    alt="Video Call"
    className="hidden lg:block absolute -left-14 top-68 w-64 rotate-[-10deg] rounded-xl shadow-lg opacity-90 animate-float"
  />

  {/* Right Tilted Image */}
  <img
    src="/homepage/vc2.png"
    alt="Avatars in Space"
    className="hidden lg:block absolute -right-14 top-68 w-64 rotate-[12deg] rounded-xl shadow-lg opacity-90 animate-float"
  />

  {/* Main Text Content */}
  <div className="z-10">
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-transparent bg-clip-text">
      Reimagine Collaboration in the Metaspace
    </h1>
    <p className="text-sm text-purple-300 uppercase tracking-widest mb-3">
      Built for teams, friends, and fun
    </p>
    <p className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
      A real-time 2D metaverse where you can move, meet, and collaborate — with spatial video chat, live chat, and personalized spaces.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        onClick={() => navigate("/dashboard")}
        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-lg px-6 py-3 rounded-xl shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
      >
        🚀 Launch the Metaspace
      </Button>
      <Button
        variant="outline"
        onClick={() => navigate("/features")}
        className="text-white border-white/20 hover:bg-white/10 transition-all duration-300"
      >
        Learn More
      </Button>
    </div>
  </div>
</section>


      {/* How It Works Section */}
 <section className="py-14 text-center text-white">
        <h2 className="text-3xl font-bold mb-6">How MetaSpace Works</h2>
        <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
          🧑‍🤝‍🧑 Join Room   →   🚶 Move Around   →   🎥 Talk Nearby
        </p>
      </section>

{/* Cards Grid */}
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
  {[
    {
      icon: <Zap className="w-8 h-8 text-yellow-400 transition-transform group-hover:scale-110" />,
      title: "Real-Time Movement",
      desc: "Navigate your avatar with smooth animations across custom maps in real time.",
      gradient: "from-yellow-400 to-orange-500",
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-400 transition-transform group-hover:scale-110" />,
      title: "Chat & Emojis",
      desc: "Message others publicly or privately, complete with rich emoji reactions.",
      gradient: "from-blue-400 to-cyan-500",
    },
    {
      icon: <Mic className="w-8 h-8 text-green-400 transition-transform group-hover:scale-110" />,
      title: "Spatial Video Chat",
      desc: "Auto-connect with nearby users via video or audio in proximity zones.",
      gradient: "from-green-400 to-emerald-500",
    },
    {
      icon: <Map className="w-8 h-8 text-purple-400 transition-transform group-hover:scale-110" />,
      title: "Custom Spaces",
      desc: "Design your own rooms with interactive layouts and visuals.",
      gradient: "from-purple-400 to-violet-500",
    },
    {
      icon: <Shield className="w-8 h-8 text-red-400 transition-transform group-hover:scale-110" />,
      title: "Secure & Private",
      desc: "Encrypted auth and communication to protect your sessions.",
      gradient: "from-red-400 to-pink-500",
    },
    {
      icon: <Heart className="w-8 h-8 text-pink-400 transition-transform group-hover:scale-110" />,
      title: "Open Source & Free",
      desc: "100% free and open source — built for developers, communities, and the future.",
      gradient: "from-pink-400 to-rose-500",
    },
  ].map((feature) => (
    <motion.div
      key={feature.title}
   whileHover={{ y: -10, scale: 1.05 }}
transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden p-10 rounded-4xl border border-white/20 bg-[#1f1f2d] hover:border-white/40 transition-all duration-500 shadow-lg hover:shadow-2xl cursor-pointer"
    >
      {/* Glow ring */}
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} opacity-25 blur-3xl rounded-4xl group-hover:opacity-40 transition duration-700`}
      />

      {/* Icon circle */}
      <div
        className={`relative z-10 w-16 h-16 mb-7 flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl group-hover:scale-110 transition-transform`}
      >
        {feature.icon}
      </div>

      {/* Title & Description */}
      <h3 className="relative z-10 text-2xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 group-hover:from-pink-400 group-hover:to-purple-600 transition-colors duration-500">
        {feature.title}
      </h3>
      <p className="relative z-10 text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-400 tracking-wide">
        {feature.desc}
      </p>
    </motion.div>
  ))}
</div>
      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6 border-t border-gray-700">
        © {new Date().getFullYear()} MetaSpace · Built by Sunny Rajput
      </footer>
    </div>
  );
};

export default HomePage;
