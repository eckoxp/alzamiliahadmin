'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function PageLoader() {
    const [phase, setPhase] = useState<'visible' | 'slideUp' | 'gone'>('visible');

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('slideUp'), 2200);
        const t2 = setTimeout(() => setPhase('gone'), 3100);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    if (phase === 'gone') return null;

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fillBar {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
                @keyframes dotPulse {
                    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                    40%           { opacity: 1;   transform: scale(1); }
                }
                .pl-root {
                    position: fixed;
                    inset: 0;
                    background: #0f0b05;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 36px;
                    transition: transform 0.95s cubic-bezier(0.76, 0, 0.24, 1);
                }
                .pl-root.out { transform: translateY(-100%); }
                .pl-logo {
                    animation: fadeInUp 0.8s ease both;
                }
                .pl-bar-wrap {
                    width: 100px;
                    height: 1px;
                    background: rgba(201,162,39,0.2);
                    overflow: hidden;
                    animation: fadeInUp 0.8s 0.2s ease both;
                }
                .pl-bar {
                    height: 100%;
                    background: #c9a227;
                    transform-origin: left;
                    animation: fillBar 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .pl-dots {
                    display: flex;
                    gap: 8px;
                    animation: fadeInUp 0.8s 0.4s ease both;
                }
                .pl-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #c9a227;
                }
                .pl-dot:nth-child(1) { animation: dotPulse 1.2s 0s infinite; }
                .pl-dot:nth-child(2) { animation: dotPulse 1.2s 0.2s infinite; }
                .pl-dot:nth-child(3) { animation: dotPulse 1.2s 0.4s infinite; }
            `}</style>

            <div className={`pl-root${phase === 'slideUp' ? ' out' : ''}`}>
                <div className="pl-logo">
                    <Image
                        src="/images/logo1.png"
                        alt="Alzamiliah"
                        width={70}
                        height={100}
                        priority
                    />
                </div>
                <div className="pl-bar-wrap">
                    <div className="pl-bar" />
                </div>
                <div className="pl-dots">
                    <div className="pl-dot" />
                    <div className="pl-dot" />
                    <div className="pl-dot" />
                </div>
            </div>
        </>
    );
}