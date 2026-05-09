const WORDS: string[] = [
  // Animals
  "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "butterfly", "snake",
  "rabbit", "turtle", "monkey", "lion", "bear", "fish", "shark", "whale", "eagle",
  "frog", "spider", "bee", "owl", "horse", "chicken", "pig", "cow", "mouse",
  "octopus", "crab", "bat", "wolf",

  // Food & Drinks
  "pizza", "hamburger", "ice cream", "cake", "cookie", "banana", "apple", "watermelon",
  "spaghetti", "sandwich", "popcorn", "donut", "pancake", "egg", "cheese", "bread",
  "chocolate", "coffee", "juice", "sushi", "taco", "hotdog", "pie", "grapes",
  "cherry", "carrot", "mushroom", "corn", "pineapple", "lemon",

  // Objects
  "umbrella", "guitar", "camera", "telephone", "television", "computer", "keyboard",
  "scissors", "glasses", "clock", "lamp", "chair", "table", "door", "window",
  "book", "pencil", "candle", "key", "mirror", "toothbrush", "hammer", "ladder",
  "balloon", "envelope", "pillow", "backpack", "flashlight", "magnet", "compass",

  // Nature
  "mountain", "volcano", "rainbow", "tornado", "lightning", "snowflake", "cloud",
  "sun", "moon", "star", "tree", "flower", "cactus", "island", "waterfall",
  "river", "ocean", "desert", "forest", "cave",

  // Transportation
  "airplane", "helicopter", "rocket", "bicycle", "motorcycle", "train", "submarine",
  "sailboat", "ambulance", "firetruck", "bus", "skateboard", "canoe", "tractor",

  // Buildings & Places
  "castle", "lighthouse", "hospital", "church", "bridge", "pyramid", "igloo",
  "tent", "windmill", "prison", "museum", "airport", "stadium",

  // People & Body
  "pirate", "astronaut", "ninja", "wizard", "robot", "ghost", "skeleton",
  "mermaid", "angel", "clown", "detective", "firefighter",

  // Activities
  "swimming", "fishing", "surfing", "skiing", "dancing", "singing", "painting",
  "camping", "bowling", "boxing", "skateboarding", "juggling",

  // Clothing
  "hat", "crown", "boots", "gloves", "necklace", "ring", "belt", "tie",
  "sunglasses", "scarf",

  // Misc
  "treasure", "map", "flag", "trophy", "diamond", "sword", "shield", "arrow",
  "bomb", "dice", "puzzle", "rocket", "anchor", "parachute", "telescope",
  "microscope", "stethoscope", "thermometer",
];

export function getRandomWords(count: number, exclude: Set<string> = new Set()): string[] {
  const available = WORDS.filter((w) => !exclude.has(w));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default WORDS;
