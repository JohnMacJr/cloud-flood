const ADJECTIVES = [
  'Brave', 'Calm', 'Clever', 'Eager', 'Fierce', 'Gentle', 'Happy', 'Jolly',
  'Kind', 'Lively', 'Merry', 'Nice', 'Proud', 'Quiet', 'Silly', 'Smart',
  'Sweet', 'Swift', 'Witty', 'Zippy', 'Cool', 'Lucky', 'Fast', 'Bold',
  'Wild', 'Wise', 'Super', 'Epic', 'Grand', 'Noble', 'Shiny', 'Sunny',
  'Bright', 'Brisk', 'Chill', 'Crisp', 'Fresh', 'Keen', 'Neat', 'Plump',
  'Quick', 'Rapid', 'Sleek', 'Stout', 'Tough', 'Vivid', 'Warm', 'Zealous',
  'Agile', 'Bouncy', 'Cheery', 'Dapper', 'Dashing', 'Flashy', 'Graceful',
  'Hardy', 'Jaunty', 'Peppy', 'Plucky', 'Spiffy', 'Sprightly', 'Sturdy'
];

const ANIMALS = [
  'Bear', 'Bird', 'Cat', 'Dog', 'Fox', 'Frog', 'Goat', 'Lion', 'Owl', 'Pig',
  'Wolf', 'Duck', 'Fish', 'Hawk', 'Moth', 'Swan', 'Toad', 'Worm', 'Bat',
  'Bee', 'Bug', 'Cow', 'Deer', 'Dove', 'Eel', 'Gull', 'Hare', 'Lark', 'Mole',
  'Mule', 'Puma', 'Seal', 'Tiger', 'Wasp', 'Zebra', 'Ant', 'Ape', 'Crab',
  'Crow', 'Flea', 'Gnat', 'Lynx', 'Mink', 'Newt', 'Pug', 'Rat', 'Roach',
  'Slug', 'Snail', 'Snake', 'Squid', 'Stag', 'Tick', 'Trout', 'Vole', 'Whale',
  'Yak', 'Dolphin', 'Eagle', 'Falcon', 'Gecko', 'Lemur', 'Llama', 'Moose',
  'Panda', 'Rhino', 'Shark', 'Sloth', 'Sponge', 'Turtle', 'Walrus', 'Weasel'
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${adj}${animal}${num}`;
}
