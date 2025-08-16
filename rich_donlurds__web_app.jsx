import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info, Download, Copy, Truck, Globe, Calculator, Crown } from "lucide-react";

/**
 * RichDonlurds Shoes Limited – Delivery Pricing Prototype
 * - One-page React app
 * - Two modes: Internal Admin & Customer Calculator
 * - Configurable pricing model
 * - No external APIs required
 */

const CURRENCY = "GHS";

const numberFmt = (n) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(
    isNaN(n) ? 0 : n
  );

// Default pricing configuration
const defaultConfig = {
  baseFee: 15, // GHS
  perKm: 2, // GHS per km
  perKg: 5, // GHS per kg
  expressSurcharge: 20, // flat surcharge
  sameDaySurcharge: 35,
  fragileSurcharge: 5,
  codSurcharge: 3, // Cash on delivery
  // Optional zone surcharges (choose one approach: distance or zones)
  zones: [
    { id: "accra", name: "Accra Metro", surcharge: 0, approxKm: 5 },
    { id: "greater-accra", name: "Greater Accra (outside metro)", surcharge: 10, approxKm: 15 },
    { id: "other-region", name: "Other Regions", surcharge: 25, approxKm: 100 },
  ],
};

// Pricing calculation
function calcFee({
  cfg,
  weightKg,
  distanceKm,
  deliveryType, // "standard" | "express" | "same-day"
  fragile,
  cashOnDelivery,
  zoneId, // optional; adds zone surcharge
}) {
  const base = cfg.baseFee;
  const distance = Math.max(0, distanceKm) * cfg.perKm;
  const weight = Math.max(0, weightKg) * cfg.perKg;

  let typeSurcharge = 0;
  if (deliveryType === "express") typeSurcharge = cfg.expressSurcharge;
  if (deliveryType === "same-day") typeSurcharge = cfg.sameDaySurcharge;

  const zoneFee = zoneId ? cfg.zones.find((z) => z.id === zoneId)?.surcharge ?? 0 : 0;

  const extras = (fragile ? cfg.fragileSurcharge : 0) + (cashOnDelivery ? cfg.codSurcharge : 0);

  const subtotal = base + distance + weight + typeSurcharge + zoneFee + extras;
  // Optional: apply rounding to nearest 0.50 or 1.00 for cleaner prices
  const total = Math.round(subtotal * 2) / 2; // nearest 0.50

  return {
    base,
    distance,
    weight,
    typeSurcharge,
    zoneFee,
    extras,
    subtotal,
    total,
  };
}

export default function App() {
  const [cfg, setCfg] = useState(defaultConfig);

  // Admin state
  const [editing, setEditing] = useState(false);

  // Shared inputs
  const [weightKg, setWeightKg] = useState(1);
  const [distanceKm, setDistanceKm] = useState(10);
  const [deliveryType, setDeliveryType] = useState("standard");
  const [fragile, setFragile] = useState(false);
  const [cod, setCod] = useState(false);
  const [useZones, setUseZones] = useState(false);
  const [zoneId, setZoneId] = useState(undefined);

  const breakdown = useMemo(
    () =>
      calcFee({
        cfg,
        weightKg: Number(weightKg) || 0,
        distanceKm: useZones ? (cfg.zones.find((z) => z.id === zoneId)?.approxKm ?? 0) : Number(distanceKm) || 0,
        deliveryType,
        fragile,
        cashOnDelivery: cod,
        zoneId: useZones ? zoneId : undefined,
      }),
    [cfg, weightKg, distanceKm, deliveryType, fragile, cod, zoneId, useZones]
  );

  const copyQuote = async () => {
    const text = `RichDonlurds Shoes Limited – Delivery Quote\n\n` +
      `Delivery type: ${deliveryType}\n` +
      `Weight: ${weightKg} kg\n` +
      (useZones ? `Zone: ${cfg.zones.find((z) => z.id === zoneId)?.name ?? "—"}\n` : `Distance: ${distanceKm} km\n`) +
      (fragile ? `Fragile handling: Yes\n` : "") +
      (cod ? `Cash on Delivery: Yes\n` : "") +
      `-----------------------------\n` +
      `Base: ${numberFmt(breakdown.base)}\n` +
      `Distance: ${numberFmt(breakdown.distance)}\n` +
      `Weight: ${numberFmt(breakdown.weight)}\n` +
      (breakdown.zoneFee ? `Zone: ${numberFmt(breakdown.zoneFee)}\n` : "") +
      (breakdown.typeSurcharge ? `Speed: ${numberFmt(breakdown.typeSurcharge)}\n` : "") +
      (breakdown.extras ? `Extras: ${numberFmt(breakdown.extras)}\n` : "") +
      `Total: ${numberFmt(breakdown.total)}`;

    try {
      await navigator.clipboard.writeText(text);
      alert("Quote copied to clipboard ✅");
    } catch {
      alert("Could not copy. Please copy manually.");
    }
  };

  const reset = () => {
    setWeightKg(1);
    setDistanceKm(10);
    setDeliveryType("standard");
    setFragile(false);
    setCod(false);
    setUseZones(false);
    setZoneId(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-inner">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">RichDonlurds Delivery Pricing</h1>
              <p className="text-slate-300 text-sm">Prototype calculator for internal use & customer quotes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyQuote} className="rounded-2xl"><Copy className="h-4 w-4 mr-2"/>Copy quote</Button>
            <Button variant="default" onClick={reset} className="rounded-2xl"><Calculator className="h-4 w-4 mr-2"/>Reset</Button>
          </div>
        </header>

        <Tabs defaultValue="customer" className="">
          <TabsList className="grid grid-cols-2 w-full md:w-auto rounded-2xl">
            <TabsTrigger value="customer" className="rounded-xl"><Globe className="h-4 w-4 mr-2"/>Customer Calculator</TabsTrigger>
            <TabsTrigger value="admin" className="rounded-xl"><Truck className="h-4 w-4 mr-2"/>Admin (Internal)</TabsTrigger>
          </TabsList>

          {/* Customer Calculator */}
          <TabsContent value="customer" className="">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-lg">
                <CardContent className="p-6 space-y-5">
                  <h2 className="text-xl font-semibold">Get a quick delivery quote</h2>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <Switch checked={useZones} onCheckedChange={setUseZones} id="zones" />
                      <Label htmlFor="zones">Use delivery zones (simple)</Label>
                    </div>
                    <span className="text-xs text-slate-400">Toggle to switch between distance vs. zone pricing</span>
                  </div>

                  {useZones ? (
                    <div className="grid gap-3">
                      <Label>Delivery Zone</Label>
                      <Select value={zoneId} onValueChange={setZoneId}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select zone" /></SelectTrigger>
                        <SelectContent>
                          {cfg.zones.map((z) => (
                            <SelectItem key={z.id} value={z.id}>{z.name} ({numberFmt(z.surcharge)} surcharge)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-400">Approx. distance for selected zone will be used automatically.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Label htmlFor="distance">Distance (km)</Label>
                      <Input id="distance" type="number" min={0} step="0.5" value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} className="rounded-xl" />
                      <p className="text-xs text-slate-400">If unsure, you can switch to zones above.</p>
                    </div>
                  )}

                  <div className="grid gap-3">
                    <Label htmlFor="weight">Package Weight (kg)</Label>
                    <Input id="weight" type="number" min={0} step="0.1" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="rounded-xl" />
                  </div>

                  <div className="grid gap-3">
                    <Label>Delivery Speed</Label>
                    <Select value={deliveryType} onValueChange={setDeliveryType}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (no surcharge)</SelectItem>
                        <SelectItem value="express">Express (+{numberFmt(cfg.expressSurcharge)})</SelectItem>
                        <SelectItem value="same-day">Same-day (+{numberFmt(cfg.sameDaySurcharge)})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Switch id="fragile" checked={fragile} onCheckedChange={setFragile} />
                      <Label htmlFor="fragile">Fragile handling</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="cod" checked={cod} onCheckedChange={setCod} />
                      <Label htmlFor="cod">Cash on delivery</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border-yellow-500/30">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">Total Quote <Crown className="h-5 w-5 text-yellow-400"/></h2>
                  <div className="bg-slate-900/60 rounded-xl p-4 space-y-2">
                    <Row label="Base" value={breakdown.base} />
                    <Row label="Distance" value={breakdown.distance} help={!useZones ? undefined : "From zone approx. km"} />
                    <Row label="Weight" value={breakdown.weight} />
                    {breakdown.zoneFee ? <Row label="Zone" value={breakdown.zoneFee} /> : null}
                    {breakdown.typeSurcharge ? <Row label="Speed" value={breakdown.typeSurcharge} /> : null}
                    {breakdown.extras ? <Row label="Extras" value={breakdown.extras} /> : null}
                    <div className="h-px bg-slate-700/60 my-2" />
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{numberFmt(breakdown.total)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-start gap-2"><Info className="h-4 w-4 mt-0.5"/>This is a live estimate. Final prices may vary based on exact address and courier availability.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin */}
          <TabsContent value="admin">
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Pricing Configuration (Internal)</h2>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="edit">Edit</Label>
                    <Switch id="edit" checked={editing} onCheckedChange={setEditing} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <ConfigField label="Base Fee" value={cfg.baseFee} onChange={(v) => setCfg({ ...cfg, baseFee: v })} editable={editing} />
                  <ConfigField label="Rate per Km" value={cfg.perKm} onChange={(v) => setCfg({ ...cfg, perKm: v })} editable={editing} />
                  <ConfigField label="Rate per Kg" value={cfg.perKg} onChange={(v) => setCfg({ ...cfg, perKg: v })} editable={editing} />
                  <ConfigField label="Express Surcharge" value={cfg.expressSurcharge} onChange={(v) => setCfg({ ...cfg, expressSurcharge: v })} editable={editing} />
                  <ConfigField label="Same-day Surcharge" value={cfg.sameDaySurcharge} onChange={(v) => setCfg({ ...cfg, sameDaySurcharge: v })} editable={editing} />
                  <ConfigField label="Fragile Surcharge" value={cfg.fragileSurcharge} onChange={(v) => setCfg({ ...cfg, fragileSurcharge: v })} editable={editing} />
                  <ConfigField label="COD Surcharge" value={cfg.codSurcharge} onChange={(v) => setCfg({ ...cfg, codSurcharge: v })} editable={editing} />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Zones</h3>
                  <div className="grid gap-3">
                    {cfg.zones.map((z, idx) => (
                      <div key={z.id} className="grid md:grid-cols-4 gap-3 bg-slate-900/50 p-3 rounded-xl">
                        <Input disabled={!editing} value={z.name} onChange={(e) => {
                          const zones = [...cfg.zones];
                          zones[idx] = { ...zones[idx], name: e.target.value };
                          setCfg({ ...cfg, zones });
                        }} className="rounded-xl" />
                        <Input disabled={!editing} type="number" step="1" value={z.surcharge} onChange={(e) => {
                          const zones = [...cfg.zones];
                          zones[idx] = { ...zones[idx], surcharge: Number(e.target.value) };
                          setCfg({ ...cfg, zones });
                        }} className="rounded-xl" placeholder="Surcharge (GHS)" />
                        <Input disabled={!editing} type="number" step="1" value={z.approxKm} onChange={(e) => {
                          const zones = [...cfg.zones];
                          zones[idx] = { ...zones[idx], approxKm: Number(e.target.value) };
                          setCfg({ ...cfg, zones });
                        }} className="rounded-xl" placeholder="Approx. Km" />
                        <Input disabled className="rounded-xl" value={z.id} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={!editing} onClick={() => {
                      const id = `zone-${Date.now()}`;
                      setCfg({ ...cfg, zones: [...cfg.zones, { id, name: "New Zone", surcharge: 0, approxKm: 0 }] });
                    }} className="rounded-2xl">Add Zone</Button>
                    <Button disabled={!editing || cfg.zones.length <= 1} variant="secondary" onClick={() => setCfg({ ...cfg, zones: cfg.zones.slice(0, -1) })} className="rounded-2xl">Remove Last Zone</Button>
                  </div>
                </div>

                <div className="pt-2 text-sm text-slate-400">
                  Tip: Keep prices rounded (e.g., nearest 0.50) for easier communication to customers.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-xs text-slate-400 pt-2">
          © {new Date().getFullYear()} RichDonlurds Shoes Limited. Prototype — not a final quotation tool.
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value, help }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="text-slate-300">{label}</span>
        {help ? <span className="text-[10px] text-slate-500">({help})</span> : null}
      </div>
      <span className="font-medium">{numberFmt(value)}</span>
    </div>
  );
}

function ConfigField({ label, value, onChange, editable }) {
  return (
    <div className="grid gap-2">
      <Label>{label} ({CURRENCY})</Label>
      <Input type="number" step="0.5" value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={!editable} className="rounded-xl" />
    </div>
  );
}
