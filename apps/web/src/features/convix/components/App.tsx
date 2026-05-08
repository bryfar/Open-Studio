'use client';

import React from 'react';
import Navbar from './Navbar';
import DashboardPreview from '@/features/dashboard/components/DashboardPreview';
import { ChevronRight } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#ededed] p-3 sm:p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="relative w-full h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] overflow-hidden bg-[#d9d9d9] rounded-2xl sm:rounded-3xl">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          webkit-playsinline="true"
          x5-playsinline="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          poster="https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
            type="video/mp4"
          />
        </video>

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-white/10" />

        {/* Foreground Content */}
        <div className="relative z-10">
          {/* Navbar */}
          <Navbar />

          {/* Hero Content */}
          <div className="flex flex-col items-center px-4 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#ef4d23]" />
              <span className="text-[13px] text-neutral-700">Convix Software</span>
            </div>

            {/* Headline */}
            <h1
              className="mt-5 sm:mt-6 max-w-4xl"
              style={{
                fontSize: 'clamp(36px, 8vw, 72px)',
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              Shaping{' '}
              <span
                style={{
                  fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                Agencies
              </span>
              <br />
              of tomorrow
            </h1>

            {/* Subtitle */}
            <p
              className="mt-4 sm:mt-6 text-neutral-700 px-2"
              style={{
                fontSize: 'clamp(13px, 3.5vw, 16px)',
              }}
            >
              The All-In-One Software Powering the Future of PR Agencies
            </p>

            {/* CTA Button */}
            <button
              className="mt-6 sm:mt-8 inline-flex items-center gap-3 bg-[#0b0f1a] text-white rounded-full pl-6 sm:pl-7 pr-2 py-2 sm:py-2.5"
              style={{ fontSize: '14px' }}
            >
              <span>Get Started</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 flex items-center justify-center">
                <ChevronRight size={14} className="sm:w-4 sm:h-4" />
              </div>
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="px-3 sm:px-4 pb-4 sm:pb-6">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </div>
  );
}