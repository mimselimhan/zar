import React, { useState, useCallback, useRef, useEffect } from 'react';
import Die from './components/Die';
import { DiceResult, Rotation, DieState } from './types';
import { Dices, Volume2, VolumeX, Plus, Minus, RotateCcw } from 'lucide-react';

// Map final dice faces to specific rotation angles [x, y]
const FACE_ROTATIONS: Record<DiceResult, Rotation> = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: 0, y: 90, z: 0 },
  3: { x: -90, y: 0, z: 0 },
  4: { x: 90, y: 0, z: 0 },
  5: { x: 0, y: -90, z: 0 },
  6: { x: 180, y: 0, z: 0 },
};

const App: React.FC = () => {
  const [diceCount, setDiceCount] = useState(1);
  const [dice, setDice] = useState<DieState[]>([
    { id: 0, value: 1, rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0 } }
  ]);
  
  const [isRolling, setIsRolling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<{ total: number; values: number[] } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync dice array with dice count
  useEffect(() => {
    setDice(current => {
      const newDice = [...current];
      
      // Helper to place initial dice somewhat safely if adding new ones
      const getSafePos = (index: number) => {
          // Simple grid fallback for initial add
          const col = index % 2;
          const row = Math.floor(index / 2);
          return { 
              x: (col - 0.5) * 120, 
              y: (row - 0.5) * 120 
          };
      };

      if (newDice.length < diceCount) {
        // Add dice
        for (let i = newDice.length; i < diceCount; i++) {
          newDice.push({
            id: i,
            value: 1,
            rotation: { x: Math.random() * 360, y: Math.random() * 360, z: 0 },
            position: getSafePos(i)
          });
        }
      } else if (newDice.length > diceCount) {
        // Remove dice
        newDice.splice(diceCount);
      }
      return newDice;
    });
    // Reset result when dice count changes
    setLastResult(null);
  }, [diceCount]);

  const playRollSound = useCallback(() => {
    if (!soundEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    
    if (ctx) {
      // Simulate plastic hitting wood
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = 'square';
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      // Random pitch for variety
      const pitch = 200 + Math.random() * 200;
      oscillator.frequency.setValueAtTime(pitch, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    }
  }, [soundEnabled]);

  // Generate random positions ensuring no overlap
  const generateSafePositions = (count: number) => {
    const positions: {x: number, y: number}[] = [];
    // Die is approx 128px wide on desktop, allow margin
    const minDistance = 140; 
    const boundsX = 180; // Increased bounds slightly
    const boundsY = 100;

    for (let i = 0; i < count; i++) {
        let bestPos = { x: 0, y: 0 };
        let valid = false;
        let attempts = 0;
        
        while (!valid && attempts < 50) {
            const x = (Math.random() - 0.5) * 2 * boundsX;
            const y = (Math.random() - 0.5) * 2 * boundsY;
            
            // Check collision with existing positions
            let collision = false;
            for (const p of positions) {
                const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
                if (dist < minDistance) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                bestPos = { x, y };
                valid = true;
            }
            attempts++;
        }

        // Fallback to a grid layout if random placement fails (rare with few dice)
        if (!valid) {
             const col = i % 2;
             const row = Math.floor(i / 2);
             bestPos = {
                 x: (col - 0.5) * minDistance,
                 y: (row - 0.5) * minDistance
             };
        }
        positions.push(bestPos);
    }
    return positions;
  };

  const rollDice = async () => {
    if (isRolling) return;
    setIsRolling(true);
    setLastResult(null);

    // Simulate clicking sounds
    let clickCount = 0;
    const maxClicks = 6;
    const clickInterval = setInterval(() => {
      if (clickCount >= maxClicks) clearInterval(clickInterval);
      playRollSound();
      clickCount++;
    }, 200);

    // 1. Determine target positions first (Collision Avoidance)
    const targetPositions = generateSafePositions(dice.length);

    // 2. Calculate new state for all dice
    const newDiceStates = dice.map((die, index) => {
        const result = (Math.floor(Math.random() * 6) + 1) as DiceResult;
        const targetRot = FACE_ROTATIONS[result];
        
        // Crazy spins
        const spinsX = 3 + Math.floor(Math.random() * 3);
        const spinsY = 3 + Math.floor(Math.random() * 3);
        const spinsZ = 1 + Math.floor(Math.random() * 2); 

        return {
            ...die,
            value: result,
            position: targetPositions[index], // Use the pre-calculated safe position
            rotation: {
                x: die.rotation.x + (360 * spinsX) + (targetRot.x - (die.rotation.x % 360)),
                y: die.rotation.y + (360 * spinsY) + (targetRot.y - (die.rotation.y % 360)),
                z: die.rotation.z + (360 * spinsZ) 
            }
        };
    });

    const finalDiceStates = newDiceStates.map(d => ({
        ...d,
        rotation: { ...d.rotation, z: Math.round(d.rotation.z / 360) * 360 }
    }));

    requestAnimationFrame(() => {
        setDice(finalDiceStates);
    });

    setTimeout(() => {
      setIsRolling(false);
      const results = finalDiceStates.map(d => d.value as number);
      const total = results.reduce((a, b) => a + b, 0);
      setLastResult({ total, values: results });
    }, 1600); // Matches animation duration
  };

  const handleCountChange = (delta: number) => {
      setDiceCount(prev => Math.max(1, Math.min(4, prev + delta)));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-4 overflow-hidden relative selection:bg-red-500 selection:text-white font-sans">
      
      {/* Background Texture (Dark Table Surface) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black pointer-events-none">
        {/* Wood Grain Texture overlay */}
        <div className="absolute inset-0 opacity-25 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 radial-gradient-center"></div>
      </div>

      <header className="relative w-full flex justify-between items-center px-4 py-4 md:px-12 z-20">
        <div className="flex items-center gap-2 text-white/90 drop-shadow-md">
          <Dices className="w-6 h-6 text-red-500" />
          <h1 className="text-xl font-bold tracking-wider">3D ZAR</h1>
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-full bg-black/20 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl z-10 relative">
        
        {/* Table Area (The Stage) */}
        <div className="relative w-full h-[350px] flex items-center justify-center perspective-[1200px]">
            <div className="relative w-0 h-0 transform-style-3d rotate-x-[30deg]">
                {dice.map((die) => (
                    <Die 
                        key={die.id} 
                        id={die.id}
                        value={die.value}
                        rotation={die.rotation} 
                        position={die.position}
                        isRolling={isRolling} 
                    />
                ))}
            </div>
        </div>

        {/* Results & Controls Area */}
        <div className="w-full max-w-md flex flex-col items-center gap-6 mt-2">
            
            {/* Result Display (Static, not covering button) */}
            <div className={`
                h-16 flex items-center justify-center transition-all duration-500
                ${lastResult && !isRolling ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
                {lastResult && (
                    <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 shadow-xl">
                        <div className="flex gap-2">
                            {lastResult.values.map((val, i) => (
                                <span key={i} className="text-slate-400 font-mono">{val}</span>
                            ))}
                        </div>
                        <div className="w-px h-8 bg-slate-600 mx-2"></div>
                        <span className="text-2xl font-bold text-white">
                            Toplam: <span className="text-red-400">{lastResult.total}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6">
                {/* Dice Count Control */}
                <div className="flex items-center gap-4 bg-black/30 backdrop-blur-sm p-1.5 rounded-full border border-white/5">
                    <button 
                        onClick={() => handleCountChange(-1)}
                        disabled={diceCount <= 1 || isRolling}
                        className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-mono font-bold text-lg w-4 text-center">{diceCount}</span>
                    <button 
                        onClick={() => handleCountChange(1)}
                        disabled={diceCount >= 4 || isRolling}
                        className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={rollDice}
                    disabled={isRolling}
                    className={`
                    group relative px-12 py-4 bg-gradient-to-b from-red-600 to-red-800 text-white font-bold rounded-xl 
                    text-xl tracking-widest uppercase transition-all duration-200 shadow-[0_8px_0_rgb(153,27,27)]
                    active:shadow-none active:translate-y-2
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                    border-t border-red-400
                    `}
                >
                    <span className="flex items-center gap-3 drop-shadow-md">
                    {isRolling ? (
                        <>
                            <RotateCcw className="w-6 h-6 animate-spin" />
                            Sallanıyor...
                        </>
                    ) : (
                        <>
                            Salla Gelsin
                            <Dices className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        </>
                    )}
                    </span>
                </button>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;