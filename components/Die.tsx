import React from 'react';
import { Rotation, Position, DiceResult } from '../types';

interface DieProps {
  id: number;
  value: DiceResult | null; // For accessibility or debugging mainly, visual is rotation based
  rotation: Rotation;
  position: Position;
  isRolling: boolean;
}

const Die: React.FC<DieProps> = ({ id, rotation, position, isRolling }) => {
  // Utility for dot rendering
  const Dot = () => <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />;

  // Face configurations
  const faces = [
    {
      id: 1,
      style: "rotate-y-0 translate-z-[3rem] md:translate-z-[4rem]", // Front
      content: <div className="flex items-center justify-center w-full h-full"><Dot /></div>
    },
    {
      id: 6,
      style: "rotate-y-180 translate-z-[3rem] md:translate-z-[4rem]", // Back
      content: (
        <div className="grid grid-cols-2 gap-2 md:gap-4 p-3 md:p-5">
          <Dot /><Dot /><Dot /><Dot /><Dot /><Dot />
        </div>
      )
    },
    {
      id: 2,
      style: "-rotate-y-90 translate-z-[3rem] md:translate-z-[4rem]", // Left
      content: (
        <div className="flex justify-between p-3 md:p-4 w-full h-full">
          <div className="self-start"><Dot /></div>
          <div className="self-end"><Dot /></div>
        </div>
      )
    },
    {
      id: 5,
      style: "rotate-y-90 translate-z-[3rem] md:translate-z-[4rem]", // Right
      content: (
        <div className="flex flex-col justify-between w-full h-full p-3 md:p-4">
          <div className="flex justify-between">
            <Dot /><Dot />
          </div>
          <div className="flex justify-center">
            <Dot />
          </div>
          <div className="flex justify-between">
            <Dot /><Dot />
          </div>
        </div>
      )
    },
    {
      id: 3,
      style: "rotate-x-90 translate-z-[3rem] md:translate-z-[4rem]", // Top
      content: (
        <div className="flex justify-between p-3 md:p-4 w-full h-full">
          <div className="self-start"><Dot /></div>
          <div className="self-center"><Dot /></div>
          <div className="self-end"><Dot /></div>
        </div>
      )
    },
    {
      id: 4,
      style: "-rotate-x-90 translate-z-[3rem] md:translate-z-[4rem]", // Bottom
      content: (
        <div className="flex flex-col justify-between w-full h-full p-3 md:p-4">
          <div className="flex justify-between">
            <Dot /><Dot />
          </div>
          <div className="flex justify-between">
            <Dot /><Dot />
          </div>
        </div>
      )
    }
  ];

  return (
    <div 
      className="absolute transition-all duration-[1500ms] ease-out will-change-transform"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: Math.floor(position.y) // Simple Z-layering based on Y position
      }}
    >
      <div className={`relative w-24 h-24 md:w-32 md:h-32 perspective-1000 ${isRolling ? 'animate-bounce-die' : ''}`}>
        
        {/* Shadow - scales and fades when die jumps */}
        <div 
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            w-[120%] h-[120%] bg-black/40 blur-md rounded-full
            transition-all duration-300
            ${isRolling ? 'animate-shadow-pulse opacity-30 scale-50' : 'opacity-60 scale-100'}
          `}
          style={{ transform: 'translate(-50%, -50%) rotateX(60deg) translateZ(-4rem)' }}
        />

        {/* The Die Cube */}
        <div
          className="w-full h-full transform-style-3d transition-transform duration-[1500ms] ease-out relative"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          }}
        >
          {faces.map((face) => (
            <div
              key={face.id}
              className={`
                absolute w-full h-full 
                bg-gradient-to-br from-red-600 via-red-500 to-red-800
                border-2 border-red-900/50 rounded-xl md:rounded-2xl
                shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]
                flex items-center justify-center
                backface-hidden
                [--tz:3rem] md:[--tz:4rem]
                ${face.style}
              `}
              style={{
                transform: face.id === 1 ? 'translateZ(var(--tz))' :
                           face.id === 6 ? 'rotateY(180deg) translateZ(var(--tz))' :
                           face.id === 2 ? 'rotateY(-90deg) translateZ(var(--tz))' :
                           face.id === 5 ? 'rotateY(90deg) translateZ(var(--tz))' :
                           face.id === 3 ? 'rotateX(90deg) translateZ(var(--tz))' :
                           'rotateX(-90deg) translateZ(var(--tz))'
              }} 
            >
               <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-white/10 pointer-events-none mix-blend-overlay" /> 
               {face.content}
            </div>
          ))}
          
          {/* Inner core to prevent light leaks */}
          <div className="absolute top-1/2 left-1/2 w-[95%] h-[95%] bg-red-950 -translate-x-1/2 -translate-y-1/2 transform-style-3d -z-10" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-die {
            0% { transform: translateY(0px) scale(1); animation-timing-function: ease-out; }
            20% { transform: translateY(-150px) scale(1.1); animation-timing-function: ease-in; }
            45% { transform: translateY(0px) scale(1); animation-timing-function: ease-out; }
            60% { transform: translateY(-60px) scale(1.05); animation-timing-function: ease-in; }
            80% { transform: translateY(0px) scale(1); animation-timing-function: ease-out; }
            90% { transform: translateY(-20px) scale(1.02); animation-timing-function: ease-in; }
            100% { transform: translateY(0px) scale(1); }
        }
        .animate-bounce-die {
            animation: bounce-die 1.5s both;
        }
        @keyframes shadow-pulse {
            0% { opacity: 0.6; transform: translate(-50%, -50%) rotateX(60deg) translateZ(-4rem) scale(1); }
            20% { opacity: 0.2; transform: translate(-50%, -50%) rotateX(60deg) translateZ(-4rem) scale(0.5); }
            45% { opacity: 0.6; transform: translate(-50%, -50%) rotateX(60deg) translateZ(-4rem) scale(1); }
            60% { opacity: 0.3; transform: translate(-50%, -50%) rotateX(60deg) translateZ(-4rem) scale(0.7); }
            100% { opacity: 0.6; transform: translate(-50%, -50%) rotateX(60deg) translateZ(-4rem) scale(1); }
        }
        .animate-shadow-pulse {
            animation: shadow-pulse 1.5s both;
        }
      `}</style>
    </div>
  );
};

export default Die;