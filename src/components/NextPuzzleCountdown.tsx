import { useState, useEffect } from 'react';
import { getTimeUntilNextPuzzle } from '../lib/puzzle';

export default function NextPuzzleCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextPuzzle);

  useEffect(() => {
    // Update immediately to avoid 1-second delay
    setTimeLeft(getTimeUntilNextPuzzle());

    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilNextPuzzle());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { hours, minutes, seconds } = timeLeft;
  
  return (
    <div className="text-center animate-fade-in">
      <p className="text-sm text-gray-500 font-medium mb-1 tracking-wide">
        Next puzzle in
      </p>
      <p className="text-3xl font-mono font-bold text-gray-900 tracking-tight">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
    </div>
  );
}
