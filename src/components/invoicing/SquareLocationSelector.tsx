import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Property } from '../../types';

export interface DiagnosticLocationOption {
  id: string;
  name: string;
  businessName?: string;
  status?: string;
  capabilities?: string[];
  currency?: string;
  address?: any;
}

interface SquareLocationSelectorProps {
  activeLocationId: string;
  locations: DiagnosticLocationOption[];
  isLoadingLocations?: boolean;
  onLocationChange: (newLocationId: string, applyToProperty?: boolean) => void;
  onOpenDiagnostics?: () => void;
  onRefreshLocations?: () => void;
  selectedProperty?: Property;
  onAssignToProperty?: (propertyId: string, locationId: string) => Promise<void> | void;
  className?: string;
}

export const SquareLocationSelector: React.FC<SquareLocationSelectorProps> = ({
  activeLocationId,
  locations,
  isLoadingLocations = false,
  onLocationChange,
  onOpenDiagnostics,
  onRefreshLocations,
  selectedProperty,
  onAssignToProperty,
  className = ''
}) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLocationId, setCustomLocationId] = useState('');
  const [justChanged, setJustChanged] = useState(false);

  // Find active location object
  const activeLoc = locations.find(l => l.id === activeLocationId);
  const isPlaceholder = ['LOC_SPEER', 'LOC_CAPHILL', 'LOC_HIGHLANDS', 'LOC_DEMO'].includes(activeLocationId.toUpperCase());
  const propertyMatchesActive = selectedProperty?.squareLocationId === activeLocationId;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setShowCustomInput(true);
      return;
    }
    setShowCustomInput(false);
    onLocationChange(val);
    setJustChanged(true);
    setTimeout(() => setJustChanged(false), 3000);
  };

  const handleApplyCustom = () => {
    if (!customLocationId.trim()) return;
    onLocationChange(customLocationId.trim());
    setShowCustomInput(false);
    setCustomLocationId('');
    setJustChanged(true);
    setTimeout(() => setJustChanged(false), 3000);
  };

  const handleAssignToSelectedProperty = async () => {
    if (!selectedProperty || !onAssignToProperty) return;
    setIsAssigning(true);
    try {
      await onAssignToProperty(selectedProperty.id, activeLocationId);
    } catch (err) {
      console.error('Failed to assign location to property:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label and Real-time Badge */}
      <div className="flex items-center justify-between gap-1">
        <label 
          htmlFor="select-active-square-location" 
          className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 truncate"
        >
          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Active Square Location ID *</span>
        </label>
        <span 
          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold whitespace-nowrap"
          title="This updates VITE_SQUARE_DEFAULT_LOCATION_ID in real-time for all subsequent invoice generation."
        >
          VITE_SQUARE_DEFAULT_LOCATION_ID
        </span>
      </div>

      {/* Select Dropdown or Custom Input */}
      <div className="relative flex items-center gap-1.5">
        {!showCustomInput ? (
          <select
            id="select-active-square-location"
            value={locations.some(l => l.id === activeLocationId) ? activeLocationId : '__custom__'}
            onChange={handleSelectChange}
            className={`w-full p-2 bg-white border rounded-md text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all ${
              justChanged 
                ? 'border-emerald-500 ring-2 ring-emerald-200' 
                : isPlaceholder
                ? 'border-amber-400 bg-amber-50/40'
                : 'border-zinc-300'
            }`}
          >
            {locations.map((loc) => {
              const hasCardProcessing = (loc.capabilities || []).includes('CREDIT_CARD_PROCESSING');
              const statusText = loc.status ? `[${loc.status}]` : '';
              const cardText = hasCardProcessing ? '• Card Processing OK' : '';
              return (
                <option key={loc.id} value={loc.id}>
                  {loc.name || 'Square Location'} ({loc.id}) {statusText} {cardText}
                </option>
              );
            })}
            
            {/* If active location is not in diagnostic list, show it as selected */}
            {!locations.some(l => l.id === activeLocationId) && (
              <option value="__custom__">
                Custom / Unlisted ID: {activeLocationId}
              </option>
            )}

            <option value="__custom__">+ Enter Custom Location ID...</option>
          </select>
        ) : (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={customLocationId}
              onChange={(e) => setCustomLocationId(e.target.value.trim())}
              placeholder="e.g. LN4WBHANNNZ2Y"
              className="w-full p-2 bg-white border border-indigo-400 rounded-md text-xs font-mono font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              autoFocus
            />
            <button
              type="button"
              onClick={handleApplyCustom}
              className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold whitespace-nowrap shadow-2xs"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(false)}
              className="px-2 py-2 text-zinc-500 hover:text-zinc-800 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Refresh / Scan Diagnostics Button */}
        {onRefreshLocations && (
          <button
            type="button"
            onClick={onRefreshLocations}
            disabled={isLoadingLocations}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-md text-zinc-600 hover:text-zinc-900 transition-colors disabled:opacity-50 shrink-0"
            title="Re-query live Square locations from diagnostic report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLocations ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Real-time Status Details & Property Sync Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-600">
          {isPlaceholder ? (
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Placeholder ID! Switch to a live Square ID above.</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Active on Square:</span>
              <code className="font-mono font-bold text-zinc-900 bg-zinc-100 px-1 rounded">{activeLocationId}</code>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Diagnostic modal link */}
          {onOpenDiagnostics && (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
            >
              <Activity className="w-3 h-3" />
              <span>Diagnostic Report ({locations.length})</span>
            </button>
          )}

          {/* Sync to Selected Property button */}
          {selectedProperty && onAssignToProperty && !propertyMatchesActive && (
            <button
              type="button"
              id="btn-sync-active-location-to-prop"
              onClick={handleAssignToSelectedProperty}
              disabled={isAssigning || isPlaceholder}
              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded font-semibold text-[10px] flex items-center gap-1 transition-colors disabled:opacity-40"
              title={`Assign ${activeLocationId} to ${selectedProperty.name}`}
            >
              <ArrowRight className="w-2.5 h-2.5" />
              <span>{isAssigning ? 'Syncing...' : `Assign to ${selectedProperty.name}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time confirmation message */}
      {justChanged && (
        <div className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[10px] font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>VITE_SQUARE_DEFAULT_LOCATION_ID updated to <strong>{activeLocationId}</strong> in real-time for subsequent invoices.</span>
        </div>
      )}
    </div>
  );
};
