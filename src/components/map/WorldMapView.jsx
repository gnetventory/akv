import React, { useState, useMemo } from 'react';
import {
  Map,
  MapPin,
  Building2,
  Search,
  Filter,
  RotateCcw,
  Linkedin,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  ALL_WORLD_HUBS,
  GLOBAL_REGIONS,
  resolveMemberLocation,
} from '../../utils/worldHubs';
import { INDUSTRY_TAGS } from '../../utils/constants';
import { isAdminSession } from '../../utils/session';
import GlobalAllianceMap from './GlobalAllianceMap';
import ProfileCard from '../directory/ProfileCard';

export default function WorldMapView() {
  const { activeMembers: members, refreshMembers } = useApp();
  const isAdmin = isAdminSession();

  // Filter States
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedHubId, setSelectedHubId] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [founderSearch, setFounderSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [listSearch, setListSearch] = useState('');

  // Map Focus State
  const [focusedCoords, setFocusedCoords] = useState(null);
  const [focusedMemberId, setFocusedMemberId] = useState(null);
  const [mobileActiveTab, setMobileActiveTab] = useState('map'); // 'map' | 'list'

  // 1. Resolve and index all members globally
  const { hubCounts, membersByHub, allIndustries, resolvedMembers } = useMemo(() => {
    const counts = {};
    const byHub = {};
    const industriesSet = new Set();

    ALL_WORLD_HUBS.forEach((h) => {
      counts[h.id] = 0;
      byHub[h.id] = [];
    });

    const safeMembers = Array.isArray(members) ? members : [];

    const enriched = safeMembers.map((m) => {
      // Collect industries / tags
      if (Array.isArray(m.tags)) {
        m.tags.forEach((t) => industriesSet.add(t));
      }
      if (m.industry) industriesSet.add(m.industry);

      const resolved = resolveMemberLocation(m.location);

      if (counts[resolved.hubId] !== undefined) {
        counts[resolved.hubId]++;
        byHub[resolved.hubId].push(m);
      } else {
        // Fallback to cairo
        counts['cairo'] = (counts['cairo'] || 0) + 1;
        byHub['cairo'] = byHub['cairo'] || [];
        byHub['cairo'].push(m);
      }

      return {
        ...m,
        _geo: resolved,
      };
    });

    // Add fallback industry tags if not yet in set
    INDUSTRY_TAGS.slice(0, 10).forEach((t) => industriesSet.add(t));

    return {
      hubCounts: counts,
      membersByHub: byHub,
      allIndustries: Array.from(industriesSet).sort(),
      resolvedMembers: enriched,
    };
  }, [members]);

  // 2. Active Worldwide Hubs with >= 1 member
  const activeHubs = useMemo(() => {
    return ALL_WORLD_HUBS.filter((h) => (hubCounts[h.id] || 0) > 0).sort(
      (a, b) => (hubCounts[b.id] || 0) - (hubCounts[a.id] || 0)
    );
  }, [hubCounts]);

  // 3. Filtered Members (Applying Region, Hub, Industry, Founder, Company, and List search)
  const filteredMembers = useMemo(() => {
    return resolvedMembers.filter((m) => {
      const geo = m._geo;

      // 1. Region match
      if (selectedRegion !== 'all' && geo.regionId !== selectedRegion) {
        return false;
      }

      // 2. Hub match
      if (selectedHubId !== 'all' && geo.hubId !== selectedHubId) {
        return false;
      }

      // 3. Industry / Vertical match
      if (selectedIndustry !== 'all') {
        const memberTags = Array.isArray(m.tags) ? m.tags : [];
        const hasTag = memberTags.some(
          (t) => t.toLowerCase() === selectedIndustry.toLowerCase()
        );
        const matchInd = (m.industry || '').toLowerCase() === selectedIndustry.toLowerCase();
        const inBusiness = (m.business || '')
          .toLowerCase()
          .includes(selectedIndustry.toLowerCase());
        if (!hasTag && !matchInd && !inBusiness) return false;
      }

      // 4. Founder Name search
      if (founderSearch.trim()) {
        const q = founderSearch.toLowerCase().trim();
        if (!m.name?.toLowerCase().includes(q)) return false;
      }

      // 5. Company Name search
      if (companySearch.trim()) {
        const q = companySearch.toLowerCase().trim();
        if (!m.business?.toLowerCase().includes(q)) return false;
      }

      // 6. Drawer Quick Search
      if (listSearch.trim()) {
        const q = listSearch.toLowerCase().trim();
        const locStr =
          typeof m.location === 'string'
            ? m.location.toLowerCase()
            : `${m.location?.city || ''} ${m.location?.country || ''}`.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchRole = m.role?.toLowerCase().includes(q);
        const matchBiz = m.business?.toLowerCase().includes(q);
        const matchLoc = locStr.includes(q);
        if (!matchName && !matchRole && !matchBiz && !matchLoc) return false;
      }

      return true;
    });
  }, [
    resolvedMembers,
    selectedRegion,
    selectedHubId,
    selectedIndustry,
    founderSearch,
    companySearch,
    listSearch,
  ]);

  // Dynamic hub counts recalculated after filtering
  const dynamicHubCounts = useMemo(() => {
    const counts = {};
    ALL_WORLD_HUBS.forEach((h) => {
      counts[h.id] = 0;
    });

    filteredMembers.forEach((m) => {
      if (m._geo?.hubId && counts[m._geo.hubId] !== undefined) {
        counts[m._geo.hubId]++;
      }
    });
    return counts;
  }, [filteredMembers]);

  // Active hubs in current view
  const activeFilteredHubs = useMemo(() => {
    return ALL_WORLD_HUBS.filter((h) => (dynamicHubCounts[h.id] || 0) > 0).sort(
      (a, b) => (dynamicHubCounts[b.id] || 0) - (dynamicHubCounts[a.id] || 0)
    );
  }, [dynamicHubCounts]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedRegion('all');
    setSelectedHubId('all');
    setSelectedIndustry('all');
    setFounderSearch('');
    setCompanySearch('');
    setListSearch('');
    setFocusedCoords(null);
    setFocusedMemberId(null);
  };

  // Focus a specific founder on global map
  const handleFocusFounder = (member) => {
    setFocusedMemberId(member.id);
    const geo = member._geo || resolveMemberLocation(member.location);
    if (geo && geo.lat && geo.lng) {
      setFocusedCoords({ lat: geo.lat, lng: geo.lng });
    }
  };

  const selectedHubObj = ALL_WORLD_HUBS.find((h) => h.id === selectedHubId);

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* ── Frozen Sticky Top Container: Atlas Header + Controls ───────────── */}
      <div className="sticky top-[66px] z-20 space-y-3 bg-[#FAFAF7]/95 dark:bg-stone-950/95 backdrop-blur-md pb-2 pt-1 transition-colors">
        {/* Compact Header Banner (Warm Premium Palette) */}
        <div className="card p-3.5 sm:p-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 text-white border-0 shadow-lg relative overflow-hidden flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 text-white rounded-xl flex-shrink-0 shadow-md shadow-orange-500/30">
              <Globe size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-orange-200">
                  Alliance Atlas
                </span>
                <span className="text-[11px] text-emerald-300 font-bold">🌐 Global Ecosystem GIS</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight font-display text-white">
                Global Atlas & Founder Density
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-base font-black text-orange-300 font-mono leading-none">
                {activeHubs.length}
              </div>
              <div className="text-[8.5px] font-bold text-white/80 uppercase">Global Hubs</div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-base font-black text-emerald-300 font-mono leading-none">
                {filteredMembers.length}
              </div>
              <div className="text-[8.5px] font-bold text-white/80 uppercase">Matching</div>
            </div>
          </div>
        </div>

        {/* Top Global Filters Bar */}
        <div className="card p-3 sm:p-3.5 bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-orange-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Atlas Filter Controls
              </span>
            </div>
            {(selectedRegion !== 'all' ||
              selectedHubId !== 'all' ||
              selectedIndustry !== 'all' ||
              founderSearch ||
              companySearch ||
              listSearch) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {/* Region Dropdown */}
            <div>
              <label className="label text-[9.5px] mb-0.5">Global Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedHubId('all');
                }}
                className="input py-1.5 text-xs font-semibold cursor-pointer"
              >
                {GLOBAL_REGIONS.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.icon} {reg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City / Hub Dropdown */}
            <div>
              <label className="label text-[9.5px] mb-0.5">City Hub</label>
              <select
                value={selectedHubId}
                onChange={(e) => setSelectedHubId(e.target.value)}
                className="input py-1.5 text-xs font-semibold cursor-pointer"
              >
                <option value="all">🌐 All Hubs ({filteredMembers.length})</option>
                {activeHubs
                  .filter((h) => selectedRegion === 'all' || h.regionId === selectedRegion)
                  .map((h) => {
                    const count = dynamicHubCounts[h.id] || hubCounts[h.id] || 0;
                    return (
                      <option key={h.id} value={h.id}>
                        {h.flag} {h.name}, {h.country} ({count})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Vertical / Industry Dropdown */}
            <div>
              <label className="label text-[9.5px] mb-0.5">Industry / Vertical</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="input py-1.5 text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Verticals (Any)</option>
                {allIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Founder Name Search */}
            <div>
              <label className="label text-[9.5px] mb-0.5">Founder Name</label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={founderSearch}
                  onChange={(e) => setFounderSearch(e.target.value)}
                  placeholder="Filter founder..."
                  className="input pl-7 py-1.5 text-xs font-medium"
                />
              </div>
            </div>

            {/* Company Name Search */}
            <div>
              <label className="label text-[9.5px] mb-0.5">Company / Business</label>
              <div className="relative">
                <Building2
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Filter company..."
                  className="input pl-7 py-1.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Map vs List Segmented Switcher */}
      <div className="lg:hidden flex items-center bg-stone-100 dark:bg-stone-850 p-1 rounded-2xl border border-stone-200 dark:border-stone-800">
        <button
          onClick={() => setMobileActiveTab('map')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileActiveTab === 'map'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Map size={14} className="text-emerald-600" />
          <span>Map View</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('list')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileActiveTab === 'list'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Building2 size={14} className="text-orange-600" />
          <span>Founders & Hubs ({filteredMembers.length})</span>
        </button>
      </div>

      {/* ── Main Dashboard Body: Global Map + Right Founder Drawer ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left/Center Global GIS Map Canvas (8 Columns) */}
        <div className={`lg:col-span-8 flex flex-col space-y-3 ${mobileActiveTab === 'map' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="card overflow-hidden border-stone-200/90 dark:border-stone-800 p-0 shadow-lg">
            <GlobalAllianceMap
              hubCounts={dynamicHubCounts}
              selectedHubId={selectedHubId}
              onSelectHub={(id) => setSelectedHubId(id === selectedHubId ? 'all' : id)}
              membersByHub={membersByHub}
              focusedCoords={focusedCoords}
            />
          </div>

          {/* Quick Hub Filter Bar Underneath Map */}
          <div className="card p-3 bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex-shrink-0 mr-1 flex items-center gap-1">
              <MapPin size={12} className="text-orange-500" /> Active Hubs:
            </span>
            <button
              onClick={() => setSelectedHubId('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex-shrink-0 cursor-pointer ${
                selectedHubId === 'all'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 border-stone-900 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-orange-300'
              }`}
            >
              All ({filteredMembers.length})
            </button>
            {activeFilteredHubs.slice(0, 8).map((hub) => {
              const count = dynamicHubCounts[hub.id] || 0;
              const isSelected = selectedHubId === hub.id;
              return (
                <button
                  key={hub.id}
                  onClick={() => setSelectedHubId(hub.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-orange-300'
                  }`}
                >
                  <span>{hub.flag} {hub.name.split('&')[0].trim()}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${
                      isSelected
                        ? 'bg-white/30 text-white'
                        : 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Filterable Founders & Companies Drawer (4 Columns) */}
        <div className={`lg:col-span-4 card p-0 border-stone-200/90 dark:border-stone-800 flex flex-col overflow-hidden shadow-lg ${mobileActiveTab === 'list' ? 'flex max-h-[75dvh]' : 'hidden lg:flex max-h-[590px]'}`}>
          {/* Header styled with Emerald-to-Teal gradient and Orange Badge */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <h3 className="text-sm font-black tracking-tight font-display text-white">
                  Founders & Companies
                </h3>
              </div>
              <p className="text-[10px] text-emerald-200 font-medium mt-0.5">
                {selectedHubObj
                  ? `${selectedHubObj.flag} ${selectedHubObj.name}, ${selectedHubObj.country}`
                  : 'Global Alliance Network'}
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white font-mono font-black text-xs shadow-sm shadow-orange-500/30">
              {filteredMembers.length}
            </span>
          </div>

          {/* Quick Search inside Right Panel */}
          <div className="p-2.5 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search founders, companies, roles..."
                className="input pl-8 py-1.5 text-xs bg-white dark:bg-stone-900"
              />
            </div>
          </div>

          {/* Scrollable Founders List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-transparent">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-center space-y-2 text-stone-500 dark:text-stone-400">
                <div className="text-2xl">🔍</div>
                <div className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                  No matching founders
                </div>
                <p className="text-[11px] text-stone-500">
                  No members match your current filter selection.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-secondary mx-auto py-1 px-3 text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isFocused = focusedMemberId === m.id;
                const geo = m._geo || resolveMemberLocation(m.location);
                const locStr =
                  typeof m.location === 'string'
                    ? m.location
                    : `${m.location?.city || ''}${m.location?.country ? `, ${m.location.country}` : ''}`;

                // Safe social links checks
                const hasValidLinkedin =
                  m.linkedin &&
                  typeof m.linkedin === 'string' &&
                  m.linkedin.includes('linkedin.com');
                const hasValidEmail =
                  m.email && typeof m.email === 'string' && m.email.includes('@');
                const hasValidPhone =
                  m.phone && typeof m.phone === 'string' && m.phone.trim().length > 3;

                return (
                  <div
                    key={m.id}
                    onClick={() => handleFocusFounder(m)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isFocused
                        ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-500 ring-1 ring-orange-400/40 shadow-xs'
                        : 'bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-700/60 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                        {m.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate">
                            {m.name}
                          </h4>
                          {m.stage && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex-shrink-0 capitalize">
                              {m.stage}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-stone-600 dark:text-stone-300 truncate mt-0.5">
                          {m.role || 'Founder'}
                        </div>

                        {m.business && (
                          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                            <Building2 size={11} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{m.business}</span>
                          </div>
                        )}

                        {/* Location & Tags */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            <span className="text-[10px]">{geo.flag}</span>
                            {locStr || geo.hubName}
                          </span>
                          {Array.isArray(m.tags) &&
                            m.tags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                              >
                                {t}
                              </span>
                            ))}
                        </div>

                        {/* Social / Contact Icons */}
                        <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-stone-100 dark:border-stone-800">
                          {hasValidLinkedin ? (
                            <a
                              href={m.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                              title="LinkedIn Profile"
                            >
                              <Linkedin size={13} />
                            </a>
                          ) : (
                            <span
                              className="text-stone-300 dark:text-stone-700"
                              title="LinkedIn not available"
                            >
                              <Linkedin size={13} />
                            </span>
                          )}

                          {hasValidEmail ? (
                            <a
                              href={`mailto:${m.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-stone-600 dark:text-stone-300 hover:text-orange-500 transition-colors"
                              title={`Email: ${m.email}`}
                            >
                              <Mail size={13} />
                            </a>
                          ) : (
                            <span
                              className="text-stone-300 dark:text-stone-700"
                              title="Email not available"
                            >
                              <Mail size={13} />
                            </span>
                          )}

                          {isAdmin && hasValidPhone ? (
                            <a
                              href={`tel:${m.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-stone-600 dark:text-stone-300 hover:text-emerald-500 transition-colors"
                              title={`Admin: ${m.phone}`}
                            >
                              <Phone size={13} />
                            </a>
                          ) : null}

                          <span className="text-[10px] text-stone-400 font-semibold ml-auto flex items-center gap-1 group-hover:text-orange-500">
                            Fly on map ➔
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Panel Footer */}
          <div className="p-2.5 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
            <span>
              Showing {filteredMembers.length} of {members.length}
            </span>
            <button
              onClick={handleResetFilters}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Detailed Grid of Filtered Member Profile Cards (When filtered) ── */}
      {selectedHubId !== 'all' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="section-title text-sm">
              {selectedHubObj
                ? `${selectedHubObj.flag} Hub Deep-Dive: ${selectedHubObj.name}, ${selectedHubObj.country} (${filteredMembers.length})`
                : `Filtered Founders (${filteredMembers.length})`}
            </h3>
            <button
              onClick={() => setSelectedHubId('all')}
              className="btn-secondary py-1 px-3 text-xs font-bold cursor-pointer"
            >
              Show All Hubs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <ProfileCard
                key={m.id}
                member={m}
                onDeleted={refreshMembers}
                onUpdated={refreshMembers}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
