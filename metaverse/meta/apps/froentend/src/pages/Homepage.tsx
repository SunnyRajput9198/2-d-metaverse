import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, Shield, Heart, Map, Mic } from 'lucide-react';
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
          🧑‍🤝‍🧑 Join Room   →   🚶 Move Around   →   🎥 Talk Nearby

        </p>
      </section>



      {/* Features */}
      {/* Features Section */}
<section className="px-6 sm:px-10 py-24 bg-gradient-to-b from-[#0f0f14] to-[#18181c] text-white">
 

  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
    {[
      {
        icon: <Zap className="w-7 h-7" />,
        title: "Real-Time Movement",
        desc: "Navigate your avatar with smooth animations across custom maps in real time.",
        gradient: "from-yellow-400 to-orange-500",
      },
      {
        icon: <MessageSquare className="w-7 h-7" />,
        title: "Chat & Emojis",
        desc: "Message others publicly or privately, complete with rich emoji reactions.",
        gradient: "from-blue-400 to-cyan-500",
      },
      {
        icon: <Mic className="w-7 h-7" />,
        title: "Spatial Video Chat",
        desc: "Auto-connect with nearby users via video or audio in proximity zones.",
        gradient: "from-green-400 to-emerald-500",
      },
      {
        icon: <Map className="w-7 h-7" />,
        title: "Custom Spaces",
        desc: "Design your own rooms with interactive layouts and visuals.",
        gradient: "from-purple-400 to-violet-500",
      },
      {
        icon: <Shield className="w-7 h-7" />,
        title: "Secure & Private",
        desc: "Encrypted auth and communication to protect your sessions.",
        gradient: "from-red-400 to-pink-500",
      },
      {
        icon: <Heart className="w-7 h-7" />,
        title: "Open Source & Free",
        desc: "100% free and open source — built for developers, communities, and the future.",
        gradient: "from-pink-400 to-rose-500",
      },
    ].map((feature) => (
      <div
        key={feature.title}
        className="group relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-[#1d1d26] hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-xl"
      >
        {/* Glow ring */}
        <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition duration-500`} />

        {/* Icon circle */}
        <div className={`relative z-10 w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md group-hover:scale-105 transition-transform`}>
          {feature.icon}
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-semibold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
          {feature.title}
        </h3>
        <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
          {feature.desc}
        </p>
      </div>
    ))}
  </div>

  {/* CTA */}
  <div className="text-center mt-20">
    <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 font-semibold text-lg shadow-lg hover:shadow-xl">
      Explore All Features
    </button>
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
