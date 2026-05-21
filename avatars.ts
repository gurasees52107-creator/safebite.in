export type Avatar = {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
};

export const AVATARS: Avatar[] = [
  { id: "leaf", label: "Leaf", emoji: "🌿", gradient: "from-emerald-400 to-teal-500" },
  { id: "apple", label: "Apple", emoji: "🍎", gradient: "from-rose-400 to-red-500" },
  { id: "carrot", label: "Carrot", emoji: "🥕", gradient: "from-orange-400 to-amber-500" },
  { id: "avocado", label: "Avocado", emoji: "🥑", gradient: "from-lime-400 to-green-600" },
  { id: "berry", label: "Berry", emoji: "🫐", gradient: "from-indigo-400 to-blue-600" },
  { id: "lemon", label: "Lemon", emoji: "🍋", gradient: "from-yellow-300 to-amber-400" },
  { id: "broccoli", label: "Broccoli", emoji: "🥦", gradient: "from-green-400 to-emerald-600" },
  { id: "grape", label: "Grape", emoji: "🍇", gradient: "from-purple-400 to-fuchsia-600" },
  { id: "tomato", label: "Tomato", emoji: "🍅", gradient: "from-red-400 to-rose-600" },
  { id: "pepper", label: "Pepper", emoji: "🌶️", gradient: "from-red-500 to-orange-500" },
  { id: "mushroom", label: "Mushroom", emoji: "🍄", gradient: "from-stone-400 to-rose-400" },
  { id: "chef", label: "Chef", emoji: "👨‍🍳", gradient: "from-sky-400 to-indigo-500" },
];

export const getAvatar = (id: string) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];
