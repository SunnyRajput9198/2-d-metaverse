import type React from "react"
import { MessageSquare, Zap, Shield, Map, Mic, Users, SmilePlus, Sparkles } from "lucide-react"
import { InteractiveFeatureCard } from "../components/InteractiveFeatureCard"

const features = [
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Real-Time Movement",
    desc: "Navigate fluidly through virtual rooms using your personalized avatar with smooth animations.",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: <MessageSquare className="w-7 h-7" />,
    title: "Text Chat & Emojis",
    desc: "Chat instantly in public or private channels with emoji reactions and markdown support.",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: <Mic className="w-7 h-7" />,
    title: "Proximity Video & Audio",
    desc: "Auto-starting calls when avatars get close — just like IRL. Spatial, smooth, simple.",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: <Map className="w-7 h-7" />,
    title: "Customizable Spaces",
    desc: "Design your own rooms — from maps to layouts — with unique interactive zones.",
    gradient: "from-purple-400 to-violet-500",
  },
  {
    icon: <SmilePlus className="w-7 h-7" />,
    title: "Emoji Avatar Reactions",
    desc: "Show emotion with floating emoji bursts above avatars, in real-time.",
    gradient: "from-pink-400 to-rose-500",
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: "Live Minimap",
    desc: "See all users across the space on a compact minimap for orientation and movement.",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "Secure & Encrypted",
    desc: "User authentication, encrypted data flow, and secure sockets by default.",
    gradient: "from-red-400 to-pink-500",
  },
  {
    icon: <Sparkles className="w-7 h-7" />,
    title: "Free & Open Source",
    desc: "MetaSpace is community-driven, developer-friendly, and forever open.",
    gradient: "from-fuchsia-400 to-purple-500",
  },
]

const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b10] via-[#121212] to-[#1a1a1f] text-white px-6 md:px-10 py-24 font-sans">
      {/* Title */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4">
          Everything MetaSpace Offers
        </h1>
        <p className="text-lg text-gray-400">
          All the immersive, interactive, and intuitive features you need in a social metaverse — powered by real-time
          tech and slick UI.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {features.map((feature) => (
          <InteractiveFeatureCard key={feature.title} feature={feature} />
        ))}
      </div>

      {/* CTA Button */}
      <div className="text-center mt-24">
        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 font-semibold text-lg shadow-lg hover:shadow-xl">
          🚀 Try MetaSpace Now
        </button>
      </div>
    </div>
  )
}

export default FeaturesPage
