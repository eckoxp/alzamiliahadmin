'use client';

import { useEffect, useRef } from 'react';

interface StatsBarProps {
  isRTL: boolean;
}

export default function StatsBar({ isRTL }: StatsBarProps) {
  const statsRef = useRef<HTMLDivElement>(null);

  // ← الـ function الأول قبل useEffect
  const animateCounter = (el: HTMLElement, target: number, duration: number) => {
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const update = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(update);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const countEls = statsRef.current?.querySelectorAll('.stat-count');
            countEls?.forEach(el => {
              if (el.classList.contains('animated')) return;
              el.classList.add('animated');
              const target = parseInt(el.getAttribute('data-target') || '0', 10);
              animateCounter(el as HTMLElement, target, 2000);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [animateCounter]);

  const statsData = [
    {
      number: '16',
      labelAr: 'عاماً من الاستثمار والتطوير',
      labelEn: 'Years of Investment & Development',
      icon: <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
    },
    {
      number: '45',
      labelAr: 'مشروع منجز',
      labelEn: 'Completed Projects',
      icon: <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    },
    {
      number: '450',
      labelAr: 'وحدة سكنية تم بناءها',
      labelEn: 'Residential Units Built',
      icon: <svg viewBox="0 0 24 24"><path d="M1 11l11-9 11 9v11H15v-6H9v6H1z"/></svg>
    },
    {
      number: '270',
      labelAr: 'الف متر مربع أمتار مطورة',
      labelEn: 'Thousand sqm Developed',
      icon: <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/></svg>
    }
  ];

  return (
    <div className="stats-bar" ref={statsRef}>
      {statsData.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-number-wrapper">
            <span className="stat-prefix">+</span>
            <span className="stat-count" data-target={stat.number}>0</span>
          </div>
          <div className="stat-label">
            {isRTL ? stat.labelAr : stat.labelEn}
          </div>
        </div>
      ))}
    </div>
  );
}