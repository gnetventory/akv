import React, { useState } from 'react';
import { EGYPT_CITIES } from '../../utils/egyptCities';
import { Building2 } from 'lucide-react';

export default function EgyptIllustratedMap({
  cityCounts,
  selectedCityId,
  onSelectCity,
  membersByCity,
}) {
  const [hoveredCity, setHoveredCity] = useState(null);

  const activeCity =
    hoveredCity || EGYPT_CITIES.find((c) => c.id === selectedCityId) || EGYPT_CITIES[0];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-stone-300/80 dark:border-stone-800 bg-[#fbf5eb] dark:bg-stone-900 shadow-xl select-none">
      {/* ── Graphic Canvas — Concept 2: The Nile Silk & Emerald Atlas ───────── */}
      <svg
        viewBox="0 0 940 760"
        className="w-full h-auto max-h-[540px] transition-all duration-300"
        style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.06))' }}
      >
        <defs>
          {/* Desert Sand Land Gradient */}
          <linearGradient id="warmPapyrus" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e5ce" />
            <stop offset="45%" stopColor="#ebd6b8" />
            <stop offset="85%" stopColor="#dfc59e" />
            <stop offset="100%" stopColor="#d5b589" />
          </linearGradient>

          {/* Dark Mode Land */}
          <linearGradient id="desertDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#24201d" />
            <stop offset="50%" stopColor="#1a1715" />
            <stop offset="100%" stopColor="#0f0d0c" />
          </linearGradient>

          {/* Mediterranean Sea Deep Sapphire */}
          <linearGradient id="medSeaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="60%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Red Sea Sapphire */}
          <linearGradient id="redSeaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>

          {/* Nile River Gradient */}
          <linearGradient id="nileBlue" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>

          {/* Lush Green Delta Alluvial Gradient */}
          <linearGradient id="deltaGreenery" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#059669" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.3" />
          </linearGradient>

          {/* Nile Valley Green Ribbon Gradient */}
          <linearGradient id="nileValleyGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
          </linearGradient>

          {/* Contrasting Sunset Magenta-to-Amber Proportional Bubble Gradient */}
          <linearGradient id="sunsetBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="45%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="bubbleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── 1. Base Sea Layer (Mediterranean & Red Sea) ─────────────────── */}
        <rect
          width="940"
          height="760"
          fill="#0284c7"
          className="dark:fill-[#082f49]"
          opacity="0.95"
        />

        {/* Mediterranean Sea Waves */}
        <g fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.45" strokeLinecap="round">
          <path d="M 60 40 Q 80 32 100 40 T 140 40" />
          <path d="M 180 60 Q 200 52 220 60 T 260 60" />
          <path d="M 690 40 Q 710 32 730 40 T 770 40" />
          <path d="M 800 75 Q 820 67 840 75 T 880 75" />
        </g>

        {/* Sea Title Watermarks */}
        <text
          x="320"
          y="42"
          fill="#e0f2fe"
          fontSize="12"
          fontWeight="800"
          letterSpacing="3"
          opacity="0.9"
        >
          MEDITERRANEAN SEA
        </text>
        <text x="320" y="56" fill="#bae6fd" fontSize="9" fontWeight="600" opacity="0.75">
          البحر الأبيض المتوسط
        </text>

        <text
          x="750"
          y="580"
          fill="#e0f2fe"
          fontSize="11"
          fontWeight="800"
          letterSpacing="2"
          opacity="0.85"
        >
          RED SEA
        </text>
        <text x="750" y="594" fill="#bae6fd" fontSize="8" fontWeight="600" opacity="0.7">
          البحر الأحمر
        </text>

        {/* ── 2. Egypt Mainland & Sinai Geography Path ─────────────────────── */}
        {/* Main Egypt Land Polygon */}
        <path
          d="
            M 40 760
            L 40 120
            Q 180 130 280 115
            Q 350 125 370 155
            Q 440 145 490 110
            Q 535 115 560 150
            L 575 235
            L 590 295
            Q 640 370 680 460
            Q 740 550 770 650
            L 780 760
            Z
          "
          fill="url(#warmPapyrus)"
          className="dark:fill-[url(#desertDark)]"
          stroke="#ca8a04"
          strokeWidth="1.5"
          opacity="0.98"
        />

        {/* Sinai Peninsula */}
        <path
          d="
            M 585 150
            Q 670 105 740 110
            L 720 350
            Q 680 360 660 350
            L 600 255
            Z
          "
          fill="url(#warmPapyrus)"
          className="dark:fill-[url(#desertDark)]"
          stroke="#ca8a04"
          strokeWidth="1.5"
          opacity="0.98"
        />

        {/* Gulf of Suez Waterway */}
        <path
          d="
            M 575 235
            L 600 255
            L 660 350
            L 650 365
            L 590 295
            Z
          "
          fill="url(#redSeaGrad)"
          className="dark:fill-[#0c4a6e]"
          opacity="0.95"
        />

        {/* Gulf of Aqaba Waterway */}
        <path
          d="
            M 740 110
            L 760 145
            L 720 350
            L 708 335
            L 730 125
            Z
          "
          fill="url(#redSeaGrad)"
          className="dark:fill-[#0c4a6e]"
          opacity="0.95"
        />

        {/* ── 3. Rich Agricultural Greenery & Alluvial Corridors ───────────── */}
        {/* Nile Delta Alluvial Green Fan (Lush Farmlands) */}
        <path
          d="
            M 475 260
            Q 430 175 355 150
            Q 445 120 515 135
            Q 560 150 565 220
            Z
          "
          fill="url(#deltaGreenery)"
        />

        {/* Nile Valley Green Corridor (Upper Egypt Alluvial Ribbon) */}
        <path
          d="
            M 600 740
            Q 595 680 600 680
            Q 585 645 590 615
            Q 580 590 585 570
            Q 540 550 530 535
            Q 505 510 495 475
            Q 470 445 465 415
            Q 475 380 480 350
            Q 460 300 475 260
          "
          fill="none"
          stroke="url(#nileValleyGreen)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Fayoum Oasis Green Patch & Lake Qarun */}
        <g transform="translate(425, 305)" opacity="0.85">
          <ellipse cx="0" cy="0" rx="14" ry="10" fill="#10b981" fillOpacity="0.45" />
          <ellipse cx="-2" cy="-1" rx="8" ry="4" fill="#0284c7" />
          <text
            x="0"
            y="14"
            fill="#065f46"
            className="dark:fill-emerald-400"
            fontSize="6.5"
            fontWeight="800"
            textAnchor="middle"
          >
            FAYOUM OASIS
          </text>
        </g>

        {/* Western Desert Oases (Siwa, Bahariya, Dakhla) Green Enclaves */}
        <g transform="translate(180, 240)" opacity="0.75">
          <circle cx="0" cy="0" r="9" fill="#10b981" fillOpacity="0.4" />
          <circle cx="2" cy="1" r="3" fill="#0284c7" />
          <text
            x="0"
            y="13"
            fill="#78350f"
            className="dark:fill-stone-400"
            fontSize="6"
            fontWeight="700"
            textAnchor="middle"
          >
            SIWA OASIS 🌴
          </text>
        </g>
        <g transform="translate(310, 360)" opacity="0.7">
          <circle cx="0" cy="0" r="8" fill="#10b981" fillOpacity="0.35" />
          <text
            x="0"
            y="12"
            fill="#78350f"
            className="dark:fill-stone-400"
            fontSize="6"
            fontWeight="700"
            textAnchor="middle"
          >
            BAHARIYA 🌴
          </text>
        </g>
        <g transform="translate(380, 580)" opacity="0.7">
          <circle cx="0" cy="0" r="8" fill="#10b981" fillOpacity="0.35" />
          <text
            x="0"
            y="12"
            fill="#78350f"
            className="dark:fill-stone-400"
            fontSize="6"
            fontWeight="700"
            textAnchor="middle"
          >
            DAKHLA 🌴
          </text>
        </g>

        {/* ── 4. Nile River Artery (Blue Waterway) ─────────────────────────── */}
        {/* Nile River from Aswan -> Luxor -> Asyut -> Minya -> Cairo */}
        <path
          d="
            M 600 740
            Q 595 680 600 680
            Q 585 645 590 615
            Q 580 590 585 570
            Q 540 550 530 535
            Q 505 510 495 475
            Q 470 445 465 415
            Q 475 380 480 350
            Q 460 300 475 260
          "
          fill="none"
          stroke="url(#nileBlue)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Rosetta Branch (Alexandria side) */}
        <path
          d="
            M 475 260
            Q 440 210 400 170
            Q 380 155 365 152
          "
          fill="none"
          stroke="url(#nileBlue)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Damietta Branch (Mansoura side) */}
        <path
          d="
            M 475 260
            Q 485 210 480 160
            Q 500 150 515 140
          "
          fill="none"
          stroke="url(#nileBlue)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Suez Canal Waterway */}
        <path
          d="
            M 560 150
            L 565 220
            L 570 275
          "
          fill="none"
          stroke="#0284c7"
          strokeWidth="3.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* ── 5. Illustrated Cultural Landmarks & Palm Groves ──────────────── */}
        {/* Pyramids of Giza */}
        <g transform="translate(415, 245)" className="cursor-pointer" opacity="0.95">
          <polygon points="22,0 0,28 44,28" fill="#c28834" stroke="#925a18" strokeWidth="1" />
          <polygon points="22,0 30,28 44,28" fill="#925a18" opacity="0.5" />
          <polygon points="44,8 26,28 62,28" fill="#d99b42" stroke="#925a18" strokeWidth="1" />
          <polygon points="44,8 52,28 62,28" fill="#925a18" opacity="0.5" />
          <text
            x="22"
            y="38"
            fill="#78350f"
            className="dark:fill-stone-300"
            fontSize="7"
            fontWeight="800"
            textAnchor="middle"
          >
            GIZA PYRAMIDS
          </text>
        </g>

        {/* Traditional Felucca Sailboat on the Nile */}
        <g transform="translate(470, 370) scale(0.75)" opacity="0.9">
          <polygon points="12,0 2,24 12,24" fill="#ffffff" stroke="#0369a1" strokeWidth="0.8" />
          <polygon points="14,4 20,24 14,24" fill="#f0f9ff" stroke="#0369a1" strokeWidth="0.8" />
          <path d="M 0 24 Q 10 28 24 24 L 20 22 L 4 22 Z" fill="#78350f" />
        </g>

        {/* Upper Egypt Palm Cluster */}
        <g transform="translate(550, 520) scale(0.7)" opacity="0.85">
          <path d="M 12 30 Q 10 18 14 6" stroke="#92400e" strokeWidth="2.5" fill="none" />
          <circle cx="14" cy="6" r="8" fill="#15803d" opacity="0.85" />
          <circle cx="20" cy="8" r="6" fill="#16a34a" opacity="0.85" />
          <circle cx="8" cy="8" r="6" fill="#16a34a" opacity="0.85" />
        </g>

        {/* Sinai Palm Cluster */}
        <g transform="translate(650, 220) scale(0.7)" opacity="0.85">
          <path d="M 12 30 Q 14 18 16 6" stroke="#92400e" strokeWidth="2.5" fill="none" />
          <circle cx="16" cy="6" r="8" fill="#15803d" opacity="0.85" />
          <circle cx="22" cy="8" r="6" fill="#16a34a" opacity="0.85" />
          <circle cx="10" cy="8" r="6" fill="#16a34a" opacity="0.85" />
        </g>

        {/* Red Sea Coral Reef Watermark */}
        <g transform="translate(710, 420) scale(0.8)" opacity="0.6">
          <ellipse cx="0" cy="0" rx="16" ry="7" fill="#38bdf8" fillOpacity="0.4" />
          <text x="0" y="3" fill="#ffffff" fontSize="6.5" fontWeight="800" textAnchor="middle">
            CORAL REEFS
          </text>
        </g>

        {/* Country Title Watermark */}
        <text
          x="140"
          y="340"
          fill="#92400e"
          className="dark:fill-stone-600"
          fontSize="34"
          fontWeight="900"
          letterSpacing="10"
          opacity="0.2"
        >
          EGYPT
        </text>

        {/* ── 6. PROPORTIONAL CONTRASTING GRADIENT CIRCLES ─────────────────── */}
        {/* One vibrant sunset-gradient circle per city that grows with founders */}
        {EGYPT_CITIES.map((city) => {
          // Adjust y coordinate to calibrated viewBox
          const y = Math.round(city.y * 0.9);
          const x = city.x;
          const count = cityCounts[city.id] || 0;
          const isSelected = selectedCityId === city.id;
          const isHovered = hoveredCity?.id === city.id;
          const hasMembers = count > 0;

          // Proportional Dynamic Radius: scales up as count increases!
          const baseRadius = 12;
          const maxRadius = 38;
          const dynamicRadius = Math.min(maxRadius, baseRadius + Math.sqrt(count) * 5.5);
          const outerHaloRadius = dynamicRadius * 1.5;

          return (
            <g
              key={city.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectCity(city.id)}
              onMouseEnter={() => setHoveredCity(city)}
              onMouseLeave={() => setHoveredCity(null)}
            >
              {hasMembers ? (
                /* Active Hub with Proportional Sunset Gradient Circle */
                <g>
                  {/* Outer Pulsing Radiant Halo */}
                  <circle
                    cx="0"
                    cy="0"
                    r={outerHaloRadius}
                    fill="url(#sunsetBubbleGrad)"
                    opacity="0.25"
                    className="animate-ping origin-center"
                    style={{ animationDuration: isSelected ? '1.5s' : '3s' }}
                  />

                  {/* Secondary Glow Shell */}
                  <circle
                    cx="0"
                    cy="0"
                    r={dynamicRadius + 4}
                    fill="url(#sunsetBubbleGrad)"
                    opacity={isSelected ? '0.45' : '0.3'}
                  />

                  {/* Core Contrasting Gradient Bubble */}
                  <circle
                    cx="0"
                    cy="0"
                    r={dynamicRadius}
                    fill="url(#sunsetBubbleGrad)"
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '3' : '2'}
                    filter="url(#bubbleGlow)"
                  />

                  {/* Founder Count Number inside the Gradient Circle */}
                  <text
                    x="0"
                    y={dynamicRadius >= 18 ? '4' : '3.5'}
                    fill="#ffffff"
                    fontSize={dynamicRadius >= 24 ? '12' : dynamicRadius >= 18 ? '10' : '8.5'}
                    fontWeight="900"
                    fontFamily="Outfit, system-ui, sans-serif"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {count}
                  </text>

                  {/* City Label Badge Below Circle */}
                  <g transform={`translate(0, ${dynamicRadius + 14})`}>
                    <rect
                      x="-42"
                      y="-8"
                      width="84"
                      height="16"
                      rx="8"
                      fill={isSelected ? '#0f172a' : '#ffffff'}
                      className="dark:fill-stone-900"
                      stroke={isSelected ? '#f97316' : '#e2e8f0'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill={isSelected ? '#ffffff' : '#0f172a'}
                      className="dark:fill-stone-100"
                      fontSize="8.5"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {city.name.split('&')[0].trim()} ({count})
                    </text>
                  </g>
                </g>
              ) : (
                /* Inactive City Landmark Pin */
                <g opacity={isHovered ? '1' : '0.5'}>
                  <circle
                    cx="0"
                    cy="0"
                    r={isHovered ? '5' : '3.5'}
                    fill="#78350f"
                    className="dark:fill-stone-400"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {isHovered && (
                    <g transform="translate(0, 15)">
                      <rect
                        x="-32"
                        y="-7"
                        width="64"
                        height="14"
                        rx="7"
                        fill="#0f172a"
                        opacity="0.9"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#ffffff"
                        fontSize="7.5"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {city.name.split('&')[0].trim()}
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Overlay Interactive City Inspector (Compact Floating Drawer) ──── */}
      {activeCity && (
        <div className="absolute top-3 right-3 z-20 w-72 max-w-[calc(100%-1.5rem)] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xl space-y-2.5 animate-fade-in">
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm leading-tight">
                  {activeCity.name}
                </h4>
              </div>
              <p className="text-[11px] font-bold text-stone-400 mt-0.5">
                {activeCity.nameAr} · {activeCity.region}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-mono font-black text-[11px] border border-orange-200 dark:border-orange-800/60">
              <Building2 size={11} /> {cityCounts[activeCity.id] || 0}
            </span>
          </div>

          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed font-medium line-clamp-2">
            {activeCity.description}
          </p>

          {/* Quick Founder Avatars preview */}
          {membersByCity[activeCity.id]?.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <span className="text-[9px] font-black uppercase text-stone-400">
                Founders in Hub:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {membersByCity[activeCity.id].slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    title={`${m.name} (${m.role})`}
                    className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-xs"
                  >
                    {m.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                ))}
                {membersByCity[activeCity.id].length > 5 && (
                  <span className="text-[10px] font-bold text-stone-500 ml-1">
                    +{membersByCity[activeCity.id].length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => onSelectCity(activeCity.id)}
            className="btn-accent w-full py-1.5 text-xs font-bold justify-center"
          >
            {selectedCityId === activeCity.id
              ? 'Viewing Hub Members'
              : `Filter by ${activeCity.name.split('&')[0].trim()}`}
          </button>
        </div>
      )}

      {/* Map Legend Footer */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 border border-white" />
          <span>Proportional Founder Beacon</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Lush Nile Delta & Oases</span>
        </div>
      </div>
    </div>
  );
}
