import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, Trash2, Home, Wifi, Key, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { Property } from '../../types';
import { SquareService, SquareLocation } from '../../services/squareService';

interface NewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  editingProperty?: Property | null;
  onOpenDeleteConfirm?: (property: Property) => void;
}

export const NewPropertyModal: React.FC<NewPropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProperty,
  onOpenDeleteConfirm
}) => {
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Denver');
  const [state, setState] = useState<string>('CO');
  const [zip, setZip] = useState<string>('80204');
  const [propertyType, setPropertyType] = useState<string>('Coliving Single-Family');
  const [yearBuilt, setYearBuilt] = useState<number>(2018);
  const [ownerName, setOwnerName] = useState<string>('Jake Moyer');
  const [ownerPhone, setOwnerPhone] = useState<string>('(303) 555-0100');
  const [ownerEmail, setOwnerEmail] = useState<string>('jmoyer@moyerpm.com');
  const [wifiNetwork, setWifiNetwork] = useState<string>('MoyerColiving_Guest');
  const [wifiPassword, setWifiPassword] = useState<string>('StayClean2026!');
  const [keypadMasterCode, setKeypadMasterCode] = useState<string>('4920');
  const [squareLocationId, setSquareLocationId] = useState<string>('');
  const [isEditingSquareLocation, setIsEditingSquareLocation] = useState<boolean>(false);
  const [availableLocations, setAvailableLocations] = useState<SquareLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  const [sharedAmenities, setSharedAmenities] = useState<string>(
    'Chef Kitchen, High-Speed Fiber Wi-Fi, Bi-Weekly Commons Cleaning, In-unit Laundry'
  );
  const [houseRules, setHouseRules] = useState<string>(
    'Quiet hours 10 PM - 7 AM, No indoor smoking, Clean kitchen after cooking'
  );

  useEffect(() => {
    if (isOpen) {
      setIsEditingSquareLocation(false);
      if (editingProperty) {
        setName(editingProperty.name || '');
        setAddress(editingProperty.address || '');
        setCity(editingProperty.city || 'Denver');
        setState(editingProperty.state || 'CO');
        setZip(editingProperty.zip || '80204');
        setPropertyType(editingProperty.propertyType || 'Coliving Single-Family');
        setYearBuilt(editingProperty.yearBuilt || 2020);
        setOwnerName(editingProperty.ownerName || 'Jake Moyer');
        setOwnerPhone(editingProperty.ownerPhone || '(303) 555-0100');
        setOwnerEmail(editingProperty.ownerEmail || 'jmoyer@moyerpm.com');
        setWifiNetwork(editingProperty.wifiNetwork || 'MoyerColiving_Guest');
        setWifiPassword(editingProperty.wifiPassword || 'StayClean2026!');
        setKeypadMasterCode(editingProperty.keypadMasterCode || '4920');
        setSquareLocationId(editingProperty.squareLocationId || '');
        setSharedAmenities(
          editingProperty.sharedAmenities?.join(', ') ||
          'Chef Kitchen, High-Speed Fiber Wi-Fi, Bi-Weekly Commons Cleaning, In-unit Laundry'
        );
        setHouseRules(
          editingProperty.houseRules?.join(', ') ||
          'Quiet hours 10 PM - 7 AM, No indoor smoking, Clean kitchen after cooking'
        );
      } else {
        setName('');
        setAddress('');
        setCity('Denver');
        setState('CO');
        setZip('80204');
        setPropertyType('Coliving Single-Family');
        setYearBuilt(2021);
        setOwnerName('Jake Moyer');
        setOwnerPhone('(303) 555-0100');
        setOwnerEmail('jmoyer@moyerpm.com');
        setWifiNetwork('MoyerColiving_Guest');
        setWifiPassword('StayClean2026!');
        setKeypadMasterCode('4920');
        setSquareLocationId('');
        setSharedAmenities('Chef Kitchen, High-Speed Fiber Wi-Fi, Bi-Weekly Commons Cleaning, In-unit Laundry');
        setHouseRules('Quiet hours 10 PM - 7 AM, No indoor smoking, Clean kitchen after cooking');
      }
    }
  }, [isOpen, editingProperty]);

  const loadSquareLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const locs = await SquareService.getLocations();
      setAvailableLocations(locs);
      setIsEditingSquareLocation(true);
    } catch (err) {
      console.warn('Failed to load Square locations', err);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const newProp: Property = {
      id: editingProperty?.id || `prop-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      totalRooms: editingProperty?.totalRooms || 0,
      occupiedRooms: editingProperty?.occupiedRooms || 0,
      monthlyRevenueEstimate: editingProperty?.monthlyRevenueEstimate || 3600,
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      ownerPhone: ownerPhone.trim(),
      wifiNetwork: wifiNetwork.trim(),
      wifiPassword: wifiPassword.trim(),
      keypadMasterCode: keypadMasterCode.trim(),
      squareLocationId: squareLocationId.trim() || undefined,
      sharedAmenities: sharedAmenities.split(',').map(s => s.trim()).filter(Boolean),
      houseRules: houseRules.split(',').map(s => s.trim()).filter(Boolean),
      yearBuilt: Number(yearBuilt) || 2020,
      propertyType
    };

    onSave(newProp);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {editingProperty ? `Edit Property Details: ${editingProperty.name}` : 'Add New Coliving Property'}
              </h2>
              <p className="text-[11px] text-zinc-400">Configure address, amenities, lock codes, and owner details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[720px] overflow-y-auto">
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Property Name / Nickname *</label>
            <input
              type="text"
              required
              placeholder="e.g. Elmwood Coliving Manor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-zinc-800"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Street Address *</label>
            <input
              type="text"
              required
              placeholder="e.g. 1424 Elmwood Ave"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-6 gap-2.5">
            <div className="col-span-3">
              <label className="block font-bold text-zinc-700 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="Denver"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block font-bold text-zinc-700 mb-1">State *</label>
              <input
                type="text"
                required
                maxLength={2}
                placeholder="CO"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 uppercase text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-zinc-700 mb-1">Zip Code *</label>
              <input
                type="text"
                required
                placeholder="80204"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Coliving Single-Family">Coliving Single-Family</option>
                <option value="Coliving Townhouse">Coliving Townhouse</option>
                <option value="Coliving Duplex">Coliving Duplex</option>
                <option value="Coliving Multi-Family (4+ Units)">Coliving Multi-Family (4+ Units)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Year Built</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Wi-Fi Network Name</label>
              <input
                type="text"
                value={wifiNetwork}
                onChange={(e) => setWifiNetwork(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Keypad Door Master Code</label>
              <input
                type="text"
                value={keypadMasterCode}
                onChange={(e) => setKeypadMasterCode(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md font-mono font-bold text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Square Location ID Section */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-md">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Square Location ID</span>
              </label>
              <button
                type="button"
                onClick={loadSquareLocations}
                disabled={isLoadingLocations}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-sm shadow-2xs transition-colors"
                title="Query Square API for available merchant locations or enter manually"
              >
                {isLoadingLocations ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                ) : (
                  <Plus className="w-3 h-3 text-indigo-600" />
                )}
                <span>Add / Edit SquareLocationID</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={squareLocationId}
                onChange={(e) => setSquareLocationId(e.target.value)}
                placeholder="e.g. LOC_SPEER_DENVER or L0CATION_ID..."
                className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            {isEditingSquareLocation && availableLocations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-indigo-200">
                <p className="text-[11px] font-semibold text-indigo-900 mb-1">Select from active Square Merchant Locations:</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {availableLocations.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSquareLocationId(loc.id)}
                      className={`w-full text-left p-1.5 rounded text-xs flex items-center justify-between border transition-colors ${
                        squareLocationId === loc.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-white hover:bg-indigo-50 text-zinc-800 border-zinc-200'
                      }`}
                    >
                      <span className="truncate">{loc.name}</span>
                      <span className="font-mono text-[10px] opacity-75 shrink-0 ml-2">{loc.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-zinc-500 mt-1">
              Required for automated rent orders, utility splits, and Square invoicing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Owner Phone</label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Owner Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Shared Amenities (comma separated)</label>
            <input
              type="text"
              value={sharedAmenities}
              onChange={(e) => setSharedAmenities(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">House Rules (comma separated)</label>
            <textarea
              rows={2}
              value={houseRules}
              onChange={(e) => setHouseRules(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-zinc-200">
            {editingProperty && onOpenDeleteConfirm ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeleteConfirm(editingProperty);
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Property &amp; Rooms</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold shadow-xs transition-colors"
              >
                {editingProperty ? 'Save Changes' : 'Create Property'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
