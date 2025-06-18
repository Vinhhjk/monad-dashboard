'use client';

import { TxInfo, TxType } from '../types/transaction';
import { ReactElement, useState, useEffect } from 'react';

interface TransactionPizzaProps {
  chartData: { blockNumber: string; count: number }[]; // Updated interface
  latestTxs?: TxInfo[];
  maxTx?: number;
}

// Map transaction types to colors with original theme (no purple)
const txTypeColors: Record<TxType, { color: string; gradient: string; name: string; icon: string; wtfIcon: string; sound: string }> = {
  transfer: { 
    color: '#10b981', 
    gradient: 'from-emerald-400 to-emerald-600',
    name: 'Transfer',
    icon: '💸',
    wtfIcon: '🚀💰',
    sound: 'WHOOSH!'
  },
  swap: { 
    color: '#3b82f6', 
    gradient: 'from-blue-400 to-blue-600',
    name: 'Swap',
    icon: '🔄',
    wtfIcon: '🌪️⚡',
    sound: 'BZZZAP!'
  },
  burn: { 
    color: '#ef4444', 
    gradient: 'from-red-400 to-red-600',
    name: 'Burn',
    icon: '🔥',
    wtfIcon: '🔥💀',
    sound: 'BURN!'
  },
  mint: { 
    color: '#f59e0b', 
    gradient: 'from-amber-400 to-amber-600',
    name: 'Mint',
    icon: '✨',
    wtfIcon: '✨🎭',
    sound: 'BLING!'
  },
  contract: { 
    color: '#8b5cf6', 
    gradient: 'from-purple-400 to-purple-600',
    name: 'Contract',
    icon: '📜',
    wtfIcon: '🧙‍♂️📜',
    sound: 'MAGIC!'
  },
  unknown: { 
    color: '#6b7280', 
    gradient: 'from-gray-400 to-gray-600',
    name: 'Unknown',
    icon: '❓',
    wtfIcon: '👽❓',
    sound: 'WTF?!'
  },
};

const pizzaFlavors = [
  "🍕 Purple Pepperoni",
  "🧀 Mystic Cheese", 
  "🍄 Magic Mushroom",
  "🌶️ Violet Supreme",
  "🥓 Cosmic Bacon",
  "🍍 Ethereal Pineapple",
  "🐙 Tentacle Special",
  "🦄 Unicorn Delight"
];

const wtfMessages = [
  "HOLY MOLY!",
  "PIZZA TIME!",
  "MONAD MAGIC!",
  "WOW SUCH TX!",
  "MUCH PIZZA!",
  "VERY BLOCKCHAIN!",
  "SUCH WOW!",
  "PIZZA TO THE MOON!",
  "BLOCKCHAIN PIZZA!",
  "MONAD MADNESS!"
];

const explosionMessages = [
  "💥 PIZZA EXPLOSION! 💥",
  "🔥 BURNT TO CRISP! 🔥",
  "💀 PIZZA OVERLOAD! 💀",
  "🚨 SYSTEM MELTDOWN! 🚨",
  "⚡ MONAD MADNESS! ⚡"
];

// Add this at the top of the file, outside the component
const gifLevels = [
  {
    minLevel: 1,
    maxLevel: 99,
    src: "/nyan_chog.gif",
    alt: "Level 1",
    size: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
    glowColor: "rgba(168, 85, 247, 0.5)", // Purple glow
    animationDuration: "1.2s"
  },
  {
    minLevel: 100,
    maxLevel: 149,
    src: "/single_cute.gif",
    alt: "Single Cute",
    size: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16",
    glowColor: "rgba(139, 92, 246, 0.5)", // Violet glow
    animationDuration: "1s"
  },
  {
    minLevel: 150,
    maxLevel: 199,
    src: "/frens_band.gif",
    alt: "Frens Band",
    size: "w-32 h-12 sm:w-40 sm:h-16 md:w-48 md:h-20",
    glowColor: "rgba(192, 132, 252, 0.5)", // Light purple glow
    animationDuration: "0.8s"
  },
  {
    minLevel: 200,
    maxLevel: 209,
    src: "/molandak.webp",
    alt: "Molandak",
    size: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
    glowColor: "rgba(124, 58, 237, 0.8)", // Deep purple glow
    animationDuration: "0.6s"
  },
];

// Add this new component for just the gif
export function TransactionPizzaGif({ chartData, latestTxs = [] }: { chartData: { blockNumber: string; count: number }[]; latestTxs?: TxInfo[] }) {
  const totalTx = chartData.reduce((sum, d) => sum + d.count, 0);
  const totalGasSpent = latestTxs.reduce((sum, tx) => {
    const gasUsed = tx.gasUsed || 0;
    const gasPrice = tx.gasPrice ? parseFloat(tx.gasPrice) : 0;
    return sum + (gasUsed * gasPrice);
  }, 0);
  const gasHeatFactor = Math.round(totalGasSpent * 1000);
  const wtfLevel = Math.round(((totalTx + gasHeatFactor) / 1000) * 100);

  const currentGif = gifLevels.find(gif => 
    wtfLevel >= gif.minLevel && wtfLevel <= gif.maxLevel
  );

  return (
    <>
      {currentGif && (
        <div className="absolute top-2 right-2 z-30">
          <img 
            src={currentGif.src}
            alt={currentGif.alt}
            className={`${currentGif.size} animate-bounce`}
            style={{ 
              filter: `drop-shadow(0 0 10px ${currentGif.glowColor})`,
              animationDuration: currentGif.animationDuration
            }}
          />
        </div>
      )}
    </>
  );
}

export function TransactionPizza({ chartData, latestTxs = [], maxTx = 1000 }: TransactionPizzaProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentFlavor, setCurrentFlavor] = useState(0);
  const [showWtfMessage, setShowWtfMessage] = useState(false);
  const [currentWtfMessage, setCurrentWtfMessage] = useState('');
  const [pizzaGlow, setPizzaGlow] = useState(false);
  const [toppingAnimation, setToppingAnimation] = useState(false);
  const [lastTotalTx, setLastTotalTx] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  // Use chartData as the source of truth
  const totalTx = chartData.reduce((sum, d) => sum + d.count, 0);
  
  // Responsive pizza size based on screen size
  const basePizzaSize = 200; // Keep original size
  const maxPizzaSize = 300; // Keep original size
  const pizzaSize = Math.max(basePizzaSize, Math.min(maxPizzaSize, basePizzaSize + (totalTx / maxTx) * 100));
  const toppingCount = Math.floor(totalTx / 15);

  // Calculate total gas spent from recent transactions
  const totalGasSpent = latestTxs.reduce((sum, tx) => {
    const gasUsed = tx.gasUsed || 0;
    const gasPrice = tx.gasPrice ? parseFloat(tx.gasPrice) : 0;
    return sum + (gasUsed * gasPrice);
  }, 0);

  // Gas factor - normalize gas to contribute to heat (adjust multiplier as needed)
  const gasHeatFactor = Math.round(totalGasSpent * 1000);
  // Calculate WTF Level as percentage - NOW INCLUDES GAS!
  const wtfLevel = Math.round(((totalTx + gasHeatFactor) / maxTx) * 100);

  // Check for pizza explosion when over 210%
  useEffect(() => {
    if (wtfLevel >=210 && !isExploding) {
      setIsExploding(true);
      setShowExplosion(true);
      setCurrentWtfMessage(explosionMessages[Math.floor(Math.random() * explosionMessages.length)]);
      setShowWtfMessage(true);
      
      // Epic explosion sequence
      setTimeout(() => {
        setShowExplosion(false);
        setShowWtfMessage(false);
        setIsExploding(false);
      }, 5000); // 5 second explosion
    } else if (wtfLevel < 210) {
      setIsExploding(false);
    }
  }, [wtfLevel, isExploding]);

  // WTF Effects based on transaction activity - SLOWER
  useEffect(() => {
    if (totalTx > 0) {
      const interval = setInterval(() => {
        setCurrentFlavor(prev => (prev + 1) % pizzaFlavors.length);
        
        // Random WTF effects - LESS FREQUENT
        if (Math.random() > 0.85) {
          setPizzaGlow(true);
          setTimeout(() => setPizzaGlow(false), 1500);
        }
        
        if (Math.random() > 0.9) {
          setToppingAnimation(true);
          setTimeout(() => setToppingAnimation(false), 2000);
        }
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [totalTx]);

  // Trigger WTF message ONLY when totalTx actually changes significantly
  useEffect(() => {
    const txDifference = totalTx - lastTotalTx;
    
    // Only show WTF message if there's a significant increase (new block with many txs)
    if (txDifference >= 10 && totalTx > 20 && !isExploding) {
      setCurrentWtfMessage(wtfMessages[Math.floor(Math.random() * wtfMessages.length)]);
      setShowWtfMessage(true);
      setTimeout(() => setShowWtfMessage(false), 3000);
      setLastTotalTx(totalTx);
    } else if (totalTx !== lastTotalTx) {
      setLastTotalTx(totalTx);
    }
  }, [totalTx, lastTotalTx, isExploding]);

  // For legend, we'll estimate distribution based on recent transactions
  const recentTxTypes = latestTxs.slice(0, 100);
  
  const recentTypeCounts = Object.keys(txTypeColors).reduce((acc, type) => {
    acc[type as TxType] = 0;
    return acc;
  }, {} as Record<TxType, number>);

  recentTxTypes.forEach(tx => {
    recentTypeCounts[tx.type] = (recentTypeCounts[tx.type] || 0) + 1;
  });

  const recentTotal = Object.values(recentTypeCounts).reduce((sum, count) => sum + count, 0);

  const scaledTypeCounts = Object.keys(recentTypeCounts).reduce((acc, type) => {
    if (recentTotal > 0) {
      const proportion = recentTypeCounts[type as TxType] / recentTotal;
      acc[type as TxType] = Math.round(proportion * totalTx);
    } else {
      acc[type as TxType] = 0;
    }
    return acc;
  }, {} as Record<TxType, number>);

  // Generate CRAZY toppings
  const toppings: ReactElement[] = [];
  let toppingIndex = 0;
  
  Object.entries(scaledTypeCounts).forEach(([type, count]) => {
    const colorInfo = txTypeColors[type as TxType];
    const toppingsForType = Math.floor((count / totalTx) * toppingCount);
    
    for (let i = 0; i < toppingsForType && toppingIndex < toppingCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = (pizzaSize / 2) * 0.7 * Math.sqrt(Math.random());
      const x = pizzaSize / 2 + radius * Math.cos(angle);
      const y = pizzaSize / 2 + radius * Math.sin(angle);
      const size = 8 + Math.random() * 6;
      
      // WTF topping shapes!
      const shapes = ['circle', 'star', 'diamond', 'heart'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      if (shape === 'circle') {
        toppings.push(
          <circle
            key={toppingIndex}
            cx={x}
            cy={y}
            r={size}
            fill={isExploding ? '#8B0000' : colorInfo.color} // Keep original colors
            opacity={isExploding ? "0.9" : "0.85"}
            className={`${toppingAnimation || isExploding ? 'animate-bounce' : ''}`}
            style={{
              filter: pizzaGlow || isExploding ? 'drop-shadow(0 0 8px currentColor)' : 'none',
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        );
      } else if (shape === 'star') {
        toppings.push(
          <polygon
            key={toppingIndex}
            points={`${x},${y-size} ${x+size*0.3},${y-size*0.3} ${x+size},${y-size*0.3} ${x+size*0.5},${y+size*0.1} ${x+size*0.8},${y+size} ${x},${y+size*0.5} ${x-size*0.8},${y+size} ${x-size*0.5},${y+size*0.1} ${x-size},${y-size*0.3} ${x-size*0.3},${y-size*0.3}`}
            fill={isExploding ? '#8B0000' : colorInfo.color}
            opacity={isExploding ? "0.9" : "0.85"}
            className={`${toppingAnimation || isExploding ? 'animate-spin' : ''}`}
            style={{
              filter: pizzaGlow || isExploding ? 'drop-shadow(0 0 8px currentColor)' : 'none',
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        );
      } else if (shape === 'diamond') {
        toppings.push(
          <polygon
            key={toppingIndex}
            points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
            fill={isExploding ? '#8B0000' : colorInfo.color}
            opacity={isExploding ? "0.9" : "0.85"}
            className={`${toppingAnimation || isExploding ? 'animate-bounce' : ''}`}
            style={{
              filter: pizzaGlow || isExploding ? 'drop-shadow(0 0 8px currentColor)' : 'none',
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        );
      } else if (shape === 'heart') {
        // Approximate heart shape with path
        toppings.push(
          <path
            key={toppingIndex}
            d={`M ${x} ${y} 
                C ${x + size} ${y - size * 0.5} ${x + size * 1.5} ${y + size * 0.5} ${x} ${y + size} 
                C ${x - size * 1.5} ${y + size * 0.5} ${x - size} ${y - size * 0.5} ${x} ${y}`}
            fill={isExploding ? '#8B0000' : colorInfo.color}
            opacity={isExploding ? "0.9" : "0.85"}
            className={`${toppingAnimation || isExploding ? 'animate-bounce' : ''}`}
            style={{
              filter: pizzaGlow || isExploding ? 'drop-shadow(0 0 8px currentColor)' : 'none',
              animationDelay: `${Math.random() * 2}s`
            }}
            transform={`translate(${x}, ${y}) scale(${size / 10})`}
          />
        );
      }
      toppingIndex++;
    }
  });

  const handlePizzaClick = () => {
    setIsSpinning(true);
    setCurrentWtfMessage(wtfMessages[Math.floor(Math.random() * wtfMessages.length)]);
    setShowWtfMessage(true);
    setTimeout(() => {
      setIsSpinning(false);
      setShowWtfMessage(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col space-y-4 relative w-full">
      {/* EXPLOSION OVERLAY - COVERS EVERYTHING */}
      {showExplosion && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          {/* Explosion background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-30 animate-pulse"></div>
          
          {/* Flying moyaki_hot images - Responsive count */}
          {Array.from({ length: typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 20 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random()}s`
              }}
            >
              <img 
                src="/moyaki_hot.webp"
                alt="Moyaki Hot"
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.8))',
                  transform: `rotate(${Math.random() * 360}deg)` // Random rotation
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Header with rotating flavor - WITH OVERLAY CAPABILITY */}
      <div className="text-center relative px-2">
        {/* WTF Message Overlay - OVERLAYS THE HEADER */}
        {showWtfMessage && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <div className={`font-black px-3 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-lg animate-bounce shadow-2xl border-2 sm:border-4 border-white whitespace-nowrap backdrop-blur-md ${
              isExploding 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
            }`}>
              {currentWtfMessage}
            </div>
          </div>
        )}
        
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 flex items-center justify-center space-x-2 relative">
          <span className="animate-pulse">🍕</span>
          <span className="text-center">{isExploding ? 'PIZZA EXPLOSION!!!' : 'MONAD PIZZA MADNESS'}</span>
          <span className="animate-pulse">🍕</span>
        </h3>

        <div className="text-xs sm:text-sm text-purple-300 font-medium animate-pulse">
          {isExploding ? '💥 BURNT TO CRISP! 💥' : pizzaFlavors[currentFlavor]}
        </div>
      </div>

      {/* Pizza and Legend - Responsive Layout */}
      <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-6 w-full">
        {/* CRAZY Pizza - WITH EXPLOSION EFFECTS - Responsive Container */}
        <div className="flex-shrink-0 relative w-full lg:w-auto flex justify-center">
          <div 
            className={`cursor-pointer transition-all duration-500 ${
              isSpinning || isExploding ? 'animate-spin' : 'hover:scale-105'
            } ${pizzaGlow || isExploding ? 'animate-pulse' : ''}`}
            onClick={handlePizzaClick}
            style={{
              filter: isExploding 
                ? 'drop-shadow(0 0 30px #ff0000) drop-shadow(0 0 60px #ff4500)' 
                : pizzaGlow 
                ? 'drop-shadow(0 0 20px #fbbf24)' 
                : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}
          >
            <svg 
              width={pizzaSize} 
              height={pizzaSize} 
              style={{ background: 'none' }}
              className="max-w-full h-auto"
              viewBox={`0 0 ${pizzaSize} ${pizzaSize}`}
            >
              {/* Pizza base - Keep original color theme */}
              <circle
                cx={pizzaSize / 2}
                cy={pizzaSize / 2}
                r={pizzaSize / 2 - 8}
                fill={isExploding ? '#2D1B00' : '#f6e05e'} // Keep original colors
                stroke={isExploding ? '#8B0000' : '#d69e2e'}
                strokeWidth="8"
                className={isExploding ? 'animate-pulse' : ''}
              />
              
              {/* Burnt spots when exploding */}
              {isExploding && Array.from({ length: 8 }, (_, i) => {
                const angle = (i * Math.PI * 2) / 8;
                const radius = (pizzaSize / 2) * 0.6;
                const x = pizzaSize / 2 + radius * Math.cos(angle) * Math.random();
                const y = pizzaSize / 2 + radius * Math.sin(angle) * Math.random();
                
                return (
                  <circle
                    key={`burnt-${i}`}
                    cx={x}
                    cy={y}
                    r={5 + Math.random() * 8}
                    fill="#1a0000"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                );
              })}
              
              {/* Crazy toppings */}
              {toppings}
            </svg>
          </div>
          
          {/* Click hint */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-purple-300 animate-bounce">
            {isExploding ? 'BOOM! 💥' : 'Click this frens! 🎉'}
          </div>
        </div>

        {/* Legend with original theme colors, no purple */}
        <div className="flex-1 w-full lg:min-w-[200px]">
          <h4 className="text-white font-medium mb-2 text-sm flex items-center justify-center lg:justify-start space-x-2">
            <span className="animate-bounce">🎯</span>
            <span>TX Types (I have no ideas what I&#39;m doing)</span>
          </h4>
          <div className="space-y-1">
            {Object.entries(scaledTypeCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count], index) => {
                const colorInfo = txTypeColors[type as TxType];
                const percentage = totalTx > 0 ? ((count / totalTx) * 100).toFixed(1) : '0';
                
                return (
                  <div 
                    key={type}
                    className={`flex items-center justify-between py-1 hover:bg-purple-500/10 rounded px-2 transition-all duration-300 ${
                      count > 0 || isExploding ? 'animate-pulse' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                        style={{ 
                          backgroundColor: isExploding ? '#8B0000' : colorInfo.color,
                          boxShadow: `0 0 8px ${isExploding ? '#8B0000' : colorInfo.color}50`
                        }}
                      ></div>
                      <span className="text-xs text-white font-medium flex items-center space-x-1 truncate">
                        <span className="animate-bounce flex-shrink-0" style={{ animationDelay: `${index * 0.1}s` }}>
                          {isExploding ? '💀' : colorInfo.wtfIcon}
                        </span>
                        <span>{colorInfo.name}</span>
                      </span>
                    </div>
                    <div className="text-right flex items-center space-x-1 flex-shrink-0">
                      <span className="text-xs font-bold text-white mr-1">{count}</span>
                      <span className="text-xs text-purple-300 hidden sm:inline">({percentage}%)</span>
                      {count > 0 && (
                        <span className="text-xs text-yellow-400 font-black animate-pulse hidden md:inline">
                          {isExploding ? 'BOOM!' : colorInfo.sound}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* WTF Activity Meter - Responsive */}
          <div className={`mt-3 p-3 rounded-lg border relative overflow-hidden backdrop-blur-md ${
            isExploding 
              ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border-red-500/50' 
              : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
          }`}>
            {/* Animated background */}
            <div className={`absolute inset-0 animate-pulse ${
              isExploding 
                ? 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10' 
                : 'bg-gradient-to-r from-transparent via-purple-500/5 to-transparent'
            }`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-200 text-xs font-bold flex items-center space-x-1">
                  <span className={isExploding ? 'animate-spin text-red-400' : 'animate-spin'}>
                    {isExploding ? '💥' : '⚡'}
                  </span>
                  <span>HEAT Level</span>
                </span>
                <span className={`text-xs font-black animate-bounce ${
                  isExploding ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {wtfLevel >= 210 ? 'EXPLODED!' : 
                   wtfLevel >= 200 ? 'DANGER!' :
                   wtfLevel >= 150 ? 'INSANE!' : 
                   wtfLevel >= 100 ? 'CRAZY!' : 
                   wtfLevel >= 50 ? 'WOW!' : 'CHILL'}
                </span>
              </div>
              
              {/* Crazy activity bars - No purple theme */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const isActive = i < Math.min(10, Math.ceil((totalTx / maxTx) * 10));
                  const colors = ['bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400'];
                  const colorIndex = Math.floor(i / 2);
                  
                  return (
                    <div
                      key={i}
                      className={`w-2 h-4 rounded-full transition-all duration-300 ${
                        isActive
                          ? `${colors[colorIndex]} animate-pulse shadow-lg`
                          : 'bg-gray-600'
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        boxShadow: isActive ? `0 0 8px ${colors[colorIndex].replace('bg-', '').replace('-400', '')}` : 'none'
                      }}
                    ></div>
                  );
                })}
              </div>
              
              {/* Pizza stats with WTF elements - Keep original theme, no purple */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1 justify-center sm:justify-start">
                  <span className="animate-spin">{isExploding ? '💥' : '🌟'}</span>
                  <span className="text-purple-200">Cookin&#39;:</span>
                  <span className={`font-bold ${
                    isExploding ? 'text-red-400' : 'text-yellow-400'
                  }`}>{wtfLevel}%</span>
                </div>
                <div className="flex items-center space-x-1 justify-center sm:justify-start">
                  <span className="animate-bounce">⛽</span>
                  <span className="text-purple-200">Gas Heat:</span>
                  <span className="text-orange-400 font-bold">{gasHeatFactor}</span>
                </div>
              </div>
              
              {/* Random WTF facts - No purple theme */}
              <div className="mt-2 text-xs text-center">
                <span className={`animate-pulse ${
                  isExploding ? 'text-red-300' : 'text-green-300'
                }`}>
                  {isExploding ? "💥 PIZZA OVERLOAD! SYSTEM MELTDOWN! 💥" :
                   wtfLevel >= 200 ? "🚨 DANGER ZONE! PIZZA ABOUT TO EXPLODE! 🚨" :
                   wtfLevel >= 150 ? "🔥 PIZZA IS GETTING TOO HOT! 🔥" :
                   wtfLevel >= 100 ? "🚀 MONAD TO THE MOON! 🚀" :
                   wtfLevel >= 50 ? "🔥 PIZZA IS ON FIRE! 🔥" :
                   wtfLevel >= 20 ? "✨ MAGIC HAPPENING! ✨" :
                   totalTx > 0 ? "🍕 Pizza is cooking..." : "😴 Pizza is sleeping..."}
                </span>
              </div>
            </div>
          </div>
              {/* Extra WTF Stats - No purple theme, keep original colors */}
              <div className="mt-2 text-xs text-center space-y-1">
                <div className="flex justify-center items-center space-x-2 text-green-300">
                  <span className="animate-bounce">{isExploding ? '💀' : '🎲'}</span>
                  <span>Ayo no Cap: This pizza has {toppingCount} toppings!</span>
                  <span className="animate-bounce">{isExploding ? '💀' : '🎲'}</span>
                </div>
                
                {totalTx > 0 && (
                  <div className={`flex justify-center items-center space-x-2 font-bold animate-pulse ${
                    isExploding ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    <span>{isExploding ? '💥' : '🎉'}</span>
                    <span>{isExploding ? `BOOM! ${totalTx} transactions = EXPLOSION!` : `WOW! ${totalTx} transactions = MUCH WOW!`}</span>
                    <span>{isExploding ? '💥' : '🎉'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Floating WTF elements - No purple, keep original colors */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {(totalTx > 100 || isExploding) && Array.from({ length: isExploding ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 5 : 10) : (typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 3) }, (_, i) => (
              <div
                key={i}
                className="absolute animate-bounce text-lg sm:text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${0.5 + Math.random() * 2}s`
                }}
              >
                {isExploding ? ['💥', '🔥', '💀', '⚡', '🚨'][i % 5] : ['🚀', '⚡', '🔥'][i]}
              </div>
            ))}
          </div>
        </div>
      );
}

