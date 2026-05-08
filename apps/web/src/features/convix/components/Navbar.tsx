'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingCart, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Home', hasDot: true },
    { label: 'Features', hasDot: false },
    { label: 'About', hasDot: false },
    { label: 'Pages', hasDot: false, hasChevron: true },
  ];

  return (
    <div className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4">
      <div className="bg-white rounded-full shadow-sm border border-neutral-200 pl-2 pr-2 py-2 w-full max-w-[760px] relative flex items-center">
        {/* Logo */}
        <div className="shrink-0">
          <svg
            viewBox="0 0 32 32"
            className="w-7 h-7 sm:w-8 sm:h-8"
            fill="none"
          >
            <circle cx="16" cy="16" r="3.5" fill="#ef4d23" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = 16 + 10 * Math.cos(rad);
              const y = 16 + 10 * Math.sin(rad);
              return (
                <circle
                  key={angle}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#ef4d23"
                />
              );
            })}
          </svg>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-6 ml-6 text-sm">
          {navLinks.map((link) => (
            <div key={link.label} className="flex items-center gap-1 cursor-pointer" style={{ color: link.label === 'Home' ? '#0b0f1a' : '#ef4d23' }}>
              {link.hasDot && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-black"
                  style={{ transform: 'translateY(-1px)' }}
                />
              )}
              <span>{link.label}</span>
              {link.hasChevron && (
                <ChevronDown size={14} className="ml-0.5" style={{ color: '#ef4d23' }} />
              )}
            </div>
          ))}
        </div>

        {/* Right Cluster */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Shopping Cart - Desktop */}
          <ShoppingCart
            size={20}
            className="hidden sm:block text-neutral-600 cursor-pointer hover:text-neutral-900"
          />

          {/* CTA Button */}
          <button className="flex items-center gap-1.5 sm:gap-2 bg-[#ef4d23] text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
            <span className="hidden sm:inline">Get early access</span>
            <span className="sm:hidden">Early access</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight size={12} className="sm:w-4 sm:h-4" />
            </div>
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 z-20 md:hidden">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="flex items-center justify-between py-2 px-2 hover:bg-neutral-50 rounded-lg cursor-pointer"
              >
                <div className="flex items-center gap-2 text-neutral-700">
                  {link.hasDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  )}
                  <span>{link.label}</span>
                </div>
                {link.hasChevron && <ChevronDown size={14} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}