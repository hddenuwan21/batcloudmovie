import { motion } from "motion/react";
import { Smile, Tv, Baby, Flame } from "lucide-react";
import { Profile } from "../types";

interface ProfileSelectorProps {
  onSelectProfile: (profileName: string) => void;
}

export const PROFILES: Profile[] = [
  { name: "Denu", color: "from-red-600 to-rose-500", icon: "smile" },
  { name: "PRO Streamer", color: "from-violet-600 to-fuchsia-500", icon: "streamer" },
  { name: "Kids Zone", color: "from-emerald-500 to-teal-400", icon: "kids" },
  { name: "Guest", color: "from-zinc-600 to-stone-500", icon: "guest" },
];

export default function ProfileSelector({ onSelectProfile }: ProfileSelectorProps) {
  const renderIcon = (type: string) => {
    switch (type) {
      case "smile":
        return <Smile className="w-12 h-12 text-white" />;
      case "streamer":
        return <Tv className="w-12 h-12 text-white" />;
      case "kids":
        return <Baby className="w-12 h-12 text-white" />;
      default:
        return <Flame className="w-12 h-12 text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] z-50 flex flex-col items-center justify-center select-none p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-12 max-w-2xl"
      >
        <h1 className="font-display font-black text-3xl md:text-5xl text-white tracking-tight drop-shadow-md">
          Who's watching Batcloud Xlive?
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 pt-4">
          {PROFILES.map((profile, idx) => (
            <motion.div
              key={profile.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              onClick={() => onSelectProfile(profile.name)}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div
                className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${profile.color} flex items-center justify-center border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-xl transform group-hover:scale-105 active:scale-95`}
              >
                {renderIcon(profile.icon)}
              </div>
              <p className="text-sm md:text-base font-bold text-zinc-400 mt-3 group-hover:text-white transition-colors">
                {profile.name}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="pt-8">
          <button
            className="px-6 py-2 border border-zinc-800 hover:border-zinc-400 text-zinc-500 hover:text-white text-xs font-black tracking-wider rounded transition-all duration-300 cursor-pointer uppercase"
            onClick={() => onSelectProfile("Guest")}
          >
            Enter as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
