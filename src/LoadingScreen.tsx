import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  isReady: boolean;
}

export default function LoadingScreen({ onComplete, isReady }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'toasting' | 'popping' | 'exit'>('toasting');
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Progress simulation that speeds up when ready
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (phase === 'exit') return prev;
        
        // If scene is ready, rush to 100
        if (isReady && prev >= 60) {
          const next = prev + 8;
          if (next >= 100) {
            setPhase('popping');
            return 100;
          }
          return next;
        }
        
        // Slow progress otherwise, cap at 85 until ready
        const cap = isReady ? 100 : 85;
        const speed = isReady ? 4 : (prev < 30 ? 2 : prev < 60 ? 1.5 : 0.5);
        return Math.min(prev + speed, cap);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isReady, phase]);

  // Pop and exit sequence
  useEffect(() => {
    if (phase === 'popping') {
      const timer = setTimeout(() => {
        setPhase('exit');
        setTimeout(onComplete, 900);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Toast browning color based on progress
  const toastColor = progress < 20 
    ? '#F5E6C8' 
    : progress < 40 
    ? '#E8D4A0' 
    : progress < 60 
    ? '#D4A852' 
    : progress < 80 
    ? '#C2853D' 
    : '#A0622A';

  const crustColor = progress < 40 
    ? '#C2A06A' 
    : progress < 70 
    ? '#8B5A2B' 
    : '#5C2E0B';

  return (
    <div
      className={`loading-screen ${phase === 'exit' ? 'loading-exit' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(-45deg, #050510, #0d0820, #0b1021, #050510)',
        overflow: 'hidden',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Ambient floating crumbs */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="loading-crumb"
          style={{
            position: 'absolute',
            width: `${3 + Math.random() * 6}px`,
            height: `${3 + Math.random() * 6}px`,
            background: '#8B5A2B',
            borderRadius: '1px',
            opacity: 0.15 + Math.random() * 0.2,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `crumbFloat ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 3}s infinite alternate`,
          }}
        />
      ))}

      {/* Toaster Assembly */}
      <div
        className="toaster-assembly"
        style={{
          position: 'relative',
          width: '200px',
          height: '280px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Heat shimmer lines */}
        {progress > 30 && (
          <div style={{ position: 'absolute', top: '-20px', left: '30%', width: '40%', zIndex: 1 }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="heat-wave"
                style={{
                  position: 'absolute',
                  left: `${20 + i * 25}%`,
                  bottom: '0',
                  width: '2px',
                  height: '30px',
                  background: `linear-gradient(to top, rgba(229, 184, 116, ${0.1 + progress * 0.004}), transparent)`,
                  borderRadius: '50%',
                  animation: `heatRise 1.5s ease-in-out ${i * 0.3}s infinite`,
                  opacity: Math.min((progress - 30) / 30, 1),
                }}
              />
            ))}
          </div>
        )}

        {/* Toast piece */}
        <div
          className={`toast-piece ${phase === 'popping' || phase === 'exit' ? 'toast-pop' : ''}`}
          style={{
            position: 'absolute',
            bottom: phase === 'popping' || phase === 'exit' ? '170px' : `${80 + progress * 0.3}px`,
            width: '80px',
            height: '90px',
            borderRadius: '6px 6px 14px 14px',
            background: `linear-gradient(180deg, ${toastColor} 0%, ${crustColor} 85%, ${crustColor} 100%)`,
            transition: phase === 'popping' ? 'bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'bottom 0.3s ease, background 0.5s ease',
            zIndex: 2,
            boxShadow: `
              inset 0 0 15px rgba(0,0,0,0.15),
              0 2px 10px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Toast face texture */}
          <div style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '3px 3px 8px 8px',
            background: `radial-gradient(ellipse at 30% 40%, ${toastColor} 0%, transparent 70%)`,
            opacity: 0.6,
          }} />
          
          {/* Pores/holes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.1)',
                left: `${15 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 65}%`,
              }}
            />
          ))}
          
          {/* Butter pat (appears when almost done) */}
          {progress > 80 && (
            <div
              className="butter-appear"
              style={{
                position: 'absolute',
                top: '25%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(12deg)',
                width: '24px',
                height: '20px',
                background: 'linear-gradient(135deg, #FFE600, #FFD700, #DAA520)',
                borderRadius: '3px',
                opacity: Math.min((progress - 80) / 15, 0.9),
                boxShadow: '0 1px 6px rgba(255, 230, 0, 0.3)',
                animation: 'butterMelt 2s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* Toaster body */}
        <div
          style={{
            position: 'relative',
            width: '160px',
            height: '130px',
            background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 40%, #15152a 100%)',
            borderRadius: '12px 12px 8px 8px',
            border: '2px solid #3a3a55',
            zIndex: 3,
            overflow: 'hidden',
          }}
        >
          {/* Toaster slot */}
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90px',
            height: '14px',
            background: '#0a0a15',
            borderRadius: '0 0 6px 6px',
            border: '2px solid #3a3a55',
            borderTop: 'none',
          }} />

          {/* Glow slots (heating elements) */}
          {progress > 10 && (
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '86px',
              height: '8px',
              background: `radial-gradient(ellipse, rgba(255, ${Math.max(100, 200 - progress * 1.5)}, 50, ${Math.min(progress / 100, 0.8)}), transparent)`,
              borderRadius: '4px',
              transition: 'background 0.5s ease',
            }} />
          )}

          {/* Chrome accent stripe */}
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '8%',
            right: '8%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }} />

          {/* Lever */}
          <div style={{
            position: 'absolute',
            right: '-8px',
            top: `${35 + (100 - progress) * 0.25}%`,
            width: '8px',
            height: '20px',
            background: 'linear-gradient(180deg, #4a4a65, #2a2a3e)',
            borderRadius: '0 4px 4px 0',
            border: '1px solid #5a5a75',
            transition: 'top 1s ease',
          }} />

          {/* Bottom base */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '-4px',
            right: '-4px',
            height: '10px',
            background: 'linear-gradient(180deg, #2a2a3e, #1a1a2e)',
            borderRadius: '0 0 10px 10px',
            borderTop: '1px solid #3a3a55',
          }} />
        </div>
      </div>

      {/* Progress bar styled as a toast browning gauge */}
      <div style={{
        marginTop: '40px',
        width: '200px',
        position: 'relative',
      }}>
        {/* Labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '9px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#EAE6DF',
          opacity: 0.5,
        }}>
          <span>Light</span>
          <span>Golden</span>
          <span>Burnt</span>
        </div>
        
        {/* Track */}
        <div style={{
          width: '100%',
          height: '6px',
          background: '#1a1a2e',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid #2a2a3e',
        }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: `linear-gradient(90deg, #F5E6C8, #E5B874, #C2853D, #8B4513)`,
              borderRadius: '3px',
              transition: 'width 0.15s ease',
              boxShadow: progress > 50 ? '0 0 8px rgba(229, 184, 116, 0.3)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Status text */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '13px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#EAE6DF',
          opacity: 0.7,
          fontFamily: '"Inter", sans-serif',
        }}>
          {phase === 'popping' ? '🍞 READY' : phase === 'exit' ? 'BON APPÉTIT' : `TOASTING${dots}`}
        </p>
        <p style={{
          fontSize: '11px',
          color: '#EAE6DF',
          opacity: 0.3,
          marginTop: '6px',
          fontFamily: 'monospace',
        }}>
          {Math.round(progress)}%
        </p>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes crumbFloat {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes heatRise {
          0% { 
            transform: translateY(0) scaleX(1); 
            opacity: 0;
          }
          30% { opacity: 1; }
          100% { 
            transform: translateY(-40px) scaleX(0.3); 
            opacity: 0;
          }
        }

        @keyframes butterMelt {
          0%, 100% { border-radius: 3px; transform: translate(-50%, -50%) rotate(12deg) scale(1); }
          50% { border-radius: 6px 3px 8px 4px; transform: translate(-50%, -50%) rotate(10deg) scale(1.05, 0.95); }
        }

        .toast-pop {
          animation: toastPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
        }

        @keyframes toastPop {
          0% { transform: translateY(0) rotate(0deg); }
          40% { transform: translateY(-60px) rotate(-5deg); }
          60% { transform: translateY(-50px) rotate(3deg); }
          80% { transform: translateY(-55px) rotate(-1deg); }
          100% { transform: translateY(-50px) rotate(0deg); }
        }

        .loading-exit {
          animation: screenExit 0.9s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes screenExit {
          0% { 
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
          60% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
          100% { 
            clip-path: inset(0 0 100% 0);
            opacity: 0;
          }
        }

        .butter-appear {
          animation: butterAppear 0.4s ease-out forwards;
        }

        @keyframes butterAppear {
          0% { transform: translate(-50%, -50%) rotate(12deg) scale(0); }
          100% { transform: translate(-50%, -50%) rotate(12deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
