'use client';

import React, { useState } from 'react';
import { TrendingDown, TrendingUp, ChevronDown, X } from 'lucide-react';
import Gauge from './Gauge';

export default function DashboardPreview() {
  const [toggleClicks, setToggleClicks] = useState(true);
  const [toggleVideo, setToggleVideo] = useState(true);

  return (
    <div className="bg-[#f5f2ee] rounded-3xl p-4 sm:p-6 w-full max-w-[880px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1 - Clicks */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#ef4d23] font-medium">Clicks</span>
              <span className="text-neutral-400 text-[13px]">This Month</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[28px] font-semibold">6,896</span>
            <span className="bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1">
              <TrendingDown size={10} />
              -3,382 (33%)
            </span>
          </div>
          <p className="text-neutral-500 text-xs mb-4">Compared to yesterday</p>
          <div className="text-center mb-4">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Month Target achieved</span>
          </div>
          <Gauge value={92} showLabels min={389000} max={425000} />
          <div className="mt-4">
            <div className="bg-neutral-100 rounded-full p-1 flex">
              <button
                className={`flex-1 py-1.5 px-3 rounded-full text-xs transition-all ${
                  toggleClicks
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500'
                }`}
                onClick={() => setToggleClicks(true)}
              >
                Impressions
              </button>
              <button
                className={`flex-1 py-1.5 px-3 rounded-full text-xs transition-all ${
                  !toggleClicks
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500'
                }`}
                onClick={() => setToggleClicks(false)}
              >
                Clicks
              </button>
            </div>
          </div>
        </div>

        {/* Card 2 - Form */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#ef4d23] font-medium">Form</span>
            </div>
          </div>

          <div>
            <label className="text-[12px] text-neutral-700 block mb-1">Show figures for</label>
            <button className="w-full border border-neutral-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm text-neutral-600">
              <span>This month</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <div>
            <label className="text-[12px] text-neutral-700 block mb-1">Compare period by</label>
            <button className="w-full border border-neutral-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm text-neutral-600">
              <span>Month-to-date (MTD)</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <div>
            <label className="text-[12px] text-neutral-700 block mb-1">Ste targets (This month)</label>
            <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-2">
              <span className="text-neutral-500 text-sm">#</span>
              <input
                type="number"
                defaultValue={10}
                className="w-full px-2 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] text-neutral-700 block mb-1">Ste targets (This year)</label>
            <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-2">
              <span className="text-neutral-500 text-sm">#</span>
              <input
                type="number"
                defaultValue={100}
                className="w-full px-2 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center mt-auto pt-2">
            <button className="bg-[#ef4d23] text-white rounded-lg px-5 py-2 text-sm font-medium">
              Save
            </button>
            <button className="text-neutral-500 text-sm underline ml-3">Cancel</button>
            <button className="ml-auto p-1">
              <X size={16} className="text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Card 3 - Video Starts */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#ef4d23] font-medium">Video Starts</span>
              <span className="text-neutral-400 text-[13px]">today</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[28px] font-semibold">0</span>
            <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1">
              <TrendingUp size={10} />
              0
            </span>
          </div>
          <p className="text-neutral-500 text-xs mb-4">Compared to yesterday</p>
          <Gauge value={68} color="#9ca3af" />
          <div className="mt-4">
            <div className="bg-neutral-100 rounded-full p-1 flex">
              <button
                className={`flex-1 py-1.5 px-3 rounded-full text-xs transition-all ${
                  toggleVideo
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500'
                }`}
                onClick={() => setToggleVideo(true)}
              >
                Video Clicks
              </button>
              <button
                className={`flex-1 py-1.5 px-3 rounded-full text-xs transition-all ${
                  !toggleVideo
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500'
                }`}
                onClick={() => setToggleVideo(false)}
              >
                Video Starts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}