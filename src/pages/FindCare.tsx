import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Star, Clock, Phone, Calendar, Search,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Navigation, ExternalLink, ShieldCheck, Zap, XCircle,
  Stethoscope, FlaskConical, Loader2, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/* ─── PBM / pharmacy network map ─────────────────────────────────────────────
   Maps lowercase carrier/PBM name keywords → in-network pharmacy chains.
   Well-known real-world network affiliations as of 2026.
──────────────────────────────────────────────────────────────────────────── */
const PBM_NETWORKS: Record<string, string[]> = {
  "express scripts": ["Walgreens", "Rite Aid", "Jewel-Osco", "Albertsons", "Safeway", "H-E-B", "Meijer", "Hy-Vee"],
  "evernorth":       ["Walgreens", "Rite Aid", "Jewel-Osco", "Albertsons", "Safeway", "Meijer"],
  "cvs caremark":    ["CVS Pharmacy", "Target Pharmacy", "Walgreens", "Jewel-Osco", "Kroger", "Mariano's", "Walmart", "Costco", "Rite Aid"],
  "caremark":        ["CVS Pharmacy", "Target Pharmacy", "Walgreens", "Jewel-Osco", "Kroger", "Mariano's", "Walmart"],
  "silverscript":    ["CVS Pharmacy", "Target Pharmacy", "Walmart", "Kroger", "Mariano's", "Walgreens"],
  "optumrx":         ["Walgreens", "CVS Pharmacy", "Walmart", "Costco", "Kroger", "Mariano's", "Jewel-Osco", "Rite Aid", "Target Pharmacy"],
  "optum":           ["Walgreens", "CVS Pharmacy", "Walmart", "Costco", "Kroger", "Mariano's", "Jewel-Osco"],
  "humana":          ["Walgreens", "Walmart", "Kroger", "Mariano's", "CVS Pharmacy", "Costco", "Rite Aid"],
  "prime therapeutics": ["Walgreens", "CVS Pharmacy", "Walmart", "Kroger", "Mariano's", "Rite Aid", "Costco"],
  "blue cross":      ["Walgreens", "CVS Pharmacy", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid", "Jewel-Osco"],
  "bcbs":            ["Walgreens", "CVS Pharmacy", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid", "Jewel-Osco"],
  "aetna":           ["Walgreens", "CVS Pharmacy", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid"],
  "cigna":           ["Walgreens", "CVS Pharmacy", "Walmart", "Costco", "Rite Aid", "Meijer", "Jewel-Osco"],
  "united":          ["Walgreens", "CVS Pharmacy", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid"],
  "wellcare":        ["CVS Pharmacy", "Walgreens", "Walmart", "Kroger", "Mariano's", "Rite Aid"],
  "molina":          ["Walgreens", "CVS Pharmacy", "Walmart", "Rite Aid"],
  "medco":           ["Walgreens", "Rite Aid", "CVS Pharmacy", "Kroger", "Mariano's", "Walmart"],
};

function getInNetworkChains(carrier: string): string[] | null {
  const lc = carrier.toLowerCase();
  for (const [key, chains] of Object.entries(PBM_NETWORKS)) {
    if (lc.includes(key) || key.includes(lc)) return chains;
  }
  return null;
}

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type Pharmacy = {
  id: number;
  name: string;
  chain: string;
  address: string;
  distance: string;
  phone: string;
  hours: string;
  driveThru: boolean;
  mailOrder: boolean;
  specialty: boolean;
  compounding: boolean;
  twentyFourHour: boolean;
};

type Doctor = {
  id: number;
  name: string;
  title: string;
  specialty: string[];
  practice: string;
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  acceptingNew: boolean;
  insuranceAccepted: string[];
  nextAvailable: string;
  phone: string;
  migraineSpecialist: boolean;
  headacheCenter: boolean;
  telemedicine: boolean;
  boardCertified: boolean;
  yearsExp: number;
  about: string;
};

interface SavedPlan {
  id: string;
  plan_type: string;
  carrier: string;
  plan_name: string | null;
}

/* ─── Pharmacy directory ────────────────────────────────────────────────────── */
const PHARMACIES: Pharmacy[] = [
  { id: 1,  chain: "Walgreens",        name: "Walgreens – Michigan Ave",       address: "757 N Michigan Ave, Chicago, IL",      distance: "0.8 mi",  phone: "(312) 787-1428", hours: "24 hours",  driveThru: false, mailOrder: false, specialty: true,  compounding: false, twentyFourHour: true  },
  { id: 2,  chain: "CVS Pharmacy",     name: "CVS Pharmacy – State St",        address: "1201 N State St, Chicago, IL",         distance: "1.1 mi",  phone: "(312) 255-0510", hours: "8am–10pm", driveThru: false, mailOrder: true,  specialty: true,  compounding: false, twentyFourHour: false },
  { id: 3,  chain: "Jewel-Osco",       name: "Jewel-Osco – Clark St",          address: "1224 S Wabash Ave, Chicago, IL",       distance: "1.6 mi",  phone: "(312) 986-0849", hours: "8am–9pm",  driveThru: false, mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 4,  chain: "Walgreens",        name: "Walgreens – Diversey Ave",       address: "2800 N Diversey Ave, Chicago, IL",     distance: "2.3 mi",  phone: "(773) 327-3334", hours: "24 hours",  driveThru: true,  mailOrder: false, specialty: false, compounding: false, twentyFourHour: true  },
  { id: 5,  chain: "CVS Pharmacy",     name: "CVS Pharmacy – Lincoln Ave",     address: "3033 N Lincoln Ave, Chicago, IL",      distance: "2.9 mi",  phone: "(773) 549-6800", hours: "7am–10pm", driveThru: false, mailOrder: true,  specialty: false, compounding: false, twentyFourHour: false },
  { id: 6,  chain: "Mariano's",        name: "Mariano's Pharmacy – Halsted",   address: "2021 S Halsted St, Chicago, IL",       distance: "3.1 mi",  phone: "(312) 666-2100", hours: "9am–8pm",  driveThru: false, mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 7,  chain: "Rite Aid",         name: "Rite Aid – Milwaukee Ave",       address: "3015 N Milwaukee Ave, Chicago, IL",    distance: "3.4 mi",  phone: "(773) 235-9800", hours: "9am–9pm",  driveThru: false, mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 8,  chain: "Walmart",          name: "Walmart Pharmacy – Chatham",     address: "8431 S Stewart Ave, Chicago, IL",      distance: "5.2 mi",  phone: "(773) 487-0142", hours: "9am–7pm",  driveThru: false, mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 9,  chain: "Costco",           name: "Costco Pharmacy – Crestwood",    address: "13350 Cicero Ave, Crestwood, IL",      distance: "6.8 mi",  phone: "(708) 371-6504", hours: "10am–6pm", driveThru: false, mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 10, chain: "Target Pharmacy",  name: "Target Pharmacy – Archer Ave",   address: "7100 S Cicero Ave, Bedford Park, IL",  distance: "7.4 mi",  phone: "(708) 924-8160", hours: "8am–9pm",  driveThru: true,  mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 11, chain: "Meijer",           name: "Meijer Pharmacy – North Ave",    address: "900 W North Ave, Melrose Park, IL",    distance: "8.1 mi",  phone: "(708) 450-8100", hours: "8am–9pm",  driveThru: true,  mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
  { id: 12, chain: "Walgreens",        name: "Walgreens – Oak Park",           address: "7232 W North Ave, Oak Park, IL",       distance: "9.0 mi",  phone: "(708) 848-5520", hours: "8am–10pm", driveThru: true,  mailOrder: false, specialty: true,  compounding: false, twentyFourHour: false },
  { id: 13, chain: "Kroger",           name: "Kroger Pharmacy – Naperville",   address: "2727 W Ogden Ave, Naperville, IL",     distance: "9.5 mi",  phone: "(630) 369-1200", hours: "9am–8pm",  driveThru: false, mailOrder: false, specialty: false, compounding: false, twentyFourHour: false },
];

/* ─── Active medical plan (fallback) ─────────────────────────────────────────── */
const ACTIVE_PLAN = { carrier: "Blue Cross Blue Shield", planName: "PPO Gold 1000" };

/* ─── Provider directory ─────────────────────────────────────────────────────── */
const ALL_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Sarah Chen", title: "MD, PhD", specialty: ["Headache Medicine", "Neurology"], practice: "Northwestern Headache Center", address: "675 N Saint Clair St, Chicago, IL", distance: "1.2 mi", rating: 4.9, reviewCount: 312, acceptingNew: true, insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "Cigna", "UnitedHealthcare"], nextAvailable: "Feb 24, 2026", phone: "(312) 555-0182", migraineSpecialist: true, headacheCenter: true, telemedicine: true, boardCertified: true, yearsExp: 14, about: "Dr. Chen specializes in refractory migraine and CGRP therapies. She leads the Northwestern Headache Clinic and has published extensively on preventive migraine treatment." },
  { id: 2, name: "Dr. James Okafor", title: "MD", specialty: ["Neurology", "Pain Medicine"], practice: "Rush University Medical Center", address: "1653 W Congress Pkwy, Chicago, IL", distance: "2.4 mi", rating: 4.7, reviewCount: 184, acceptingNew: true, insuranceAccepted: ["Blue Cross Blue Shield", "Medicare", "Humana"], nextAvailable: "Mar 3, 2026", phone: "(312) 555-0247", migraineSpecialist: true, headacheCenter: false, telemedicine: false, boardCertified: true, yearsExp: 9, about: "Dr. Okafor focuses on migraine management with an emphasis on lifestyle and trigger identification alongside pharmacologic treatment." },
  { id: 3, name: "Dr. Maya Patel", title: "DO", specialty: ["Neurology"], practice: "Chicago Neurology Group", address: "30 N Michigan Ave, Chicago, IL", distance: "3.1 mi", rating: 4.5, reviewCount: 97, acceptingNew: false, insuranceAccepted: ["Aetna", "Cigna", "UnitedHealthcare"], nextAvailable: "Waitlist only", phone: "(312) 555-0391", migraineSpecialist: false, headacheCenter: false, telemedicine: true, boardCertified: true, yearsExp: 6, about: "Dr. Patel is a board-certified neurologist with broad neurological practice. She treats migraine, epilepsy, and movement disorders." },
  { id: 4, name: "Dr. Robert Vance", title: "MD", specialty: ["Headache Medicine", "Neurology"], practice: "UChicago Medicine – Headache Clinic", address: "5841 S Maryland Ave, Chicago, IL", distance: "5.7 mi", rating: 4.8, reviewCount: 229, acceptingNew: true, insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "Medicare", "Medicaid", "UnitedHealthcare"], nextAvailable: "Feb 28, 2026", phone: "(773) 555-0604", migraineSpecialist: true, headacheCenter: true, telemedicine: true, boardCertified: true, yearsExp: 22, about: "Dr. Vance has over two decades of experience treating complex headache disorders, including NDPH and MOH. He is a fellow of the American Headache Society." },
  { id: 5, name: "Dr. Fatima Khalid", title: "MD", specialty: ["Neurology", "Headache Medicine"], practice: "Illinois Neurological Institute", address: "530 NE Glen Oak Ave, Peoria, IL", distance: "7.4 mi", rating: 4.6, reviewCount: 142, acceptingNew: true, insuranceAccepted: ["Cigna", "Humana", "Medicaid", "Oscar Health"], nextAvailable: "Mar 10, 2026", phone: "(309) 555-0812", migraineSpecialist: true, headacheCenter: false, telemedicine: true, boardCertified: true, yearsExp: 11, about: "Dr. Khalid specializes in hormonal migraine and chronic daily headache, with a focus on non-pharmacological interventions alongside evidence-based treatment." },
  { id: 6, name: "Dr. Marcus Webb", title: "MD", specialty: ["Neurology"], practice: "Advocate Lutheran General Hospital", address: "1775 Dempster St, Park Ridge, IL", distance: "9.2 mi", rating: 4.3, reviewCount: 76, acceptingNew: true, insuranceAccepted: ["Aetna", "UnitedHealthcare", "Molina Healthcare"], nextAvailable: "Mar 17, 2026", phone: "(847) 555-0338", migraineSpecialist: false, headacheCenter: false, telemedicine: false, boardCertified: true, yearsExp: 8, about: "General neurologist seeing a broad range of patients including migraine, tension headache, and peripheral neuropathy." },
];

const DOCTOR_FILTERS = ["All", "In-Network Only", "Migraine Specialist", "Headache Center", "Telemedicine", "Accepting New"] as const;
type DoctorFilter = typeof DOCTOR_FILTERS[number];

function acceptsMyPlan(doc: Doctor) {
  return doc.insuranceAccepted.some(
    (ins) => ins.toLowerCase().includes(ACTIVE_PLAN.carrier.toLowerCase()) ||
      ACTIVE_PLAN.carrier.toLowerCase().includes(ins.toLowerCase())
  );
}

/* ─── Doctor card ────────────────────────────────────────────────────────────── */
function DoctorCard({ doc, isExpanded, onToggle }: { doc: Doctor; isExpanded: boolean; onToggle: () => void }) {
  const inNetwork = acceptsMyPlan(doc);
  return (
    <Card className={`overflow-hidden cursor-pointer transition-all ${!doc.acceptingNew ? "opacity-80" : ""} ${inNetwork ? "border-primary/20" : ""}`} onClick={onToggle}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{doc.name}</span>
              <span className="text-xs text-muted-foreground">{doc.title}</span>
              {doc.migraineSpecialist && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">Migraine Specialist</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.practice}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
              <span className="text-xs font-medium">{doc.rating}</span>
              <span className="text-[10px] text-muted-foreground">({doc.reviewCount})</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{doc.distance}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          {inNetwork
            ? <div className="flex items-center gap-1 text-[10px] text-primary font-medium"><ShieldCheck className="h-3 w-3" /> In-Network</div>
            : <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><XCircle className="h-3 w-3" /> Out-of-Network</div>}
          {doc.acceptingNew
            ? <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--severity-low))]"><CheckCircle2 className="h-3 w-3" /> Accepting new patients</div>
            : <div className="flex items-center gap-1 text-[10px] text-destructive"><AlertCircle className="h-3 w-3" /> Waitlist only</div>}
          {doc.telemedicine && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Telemedicine</Badge>}
          {doc.headacheCenter && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Headache Center</Badge>}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Next available: <span className={`font-medium ${doc.acceptingNew ? "text-foreground" : ""}`}>{doc.nextAvailable}</span></span>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{doc.about}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="text-muted-foreground text-[10px]">Experience</p>
                <p className="font-medium">{doc.yearsExp} years</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="text-muted-foreground text-[10px]">Certification</p>
                <p className="font-medium">{doc.boardCertified ? "Board Certified" : "Board Eligible"}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Accepted insurance</p>
              <div className="flex flex-wrap gap-1">
                {doc.insuranceAccepted.map((ins) => {
                  const mine = ins.toLowerCase().includes(ACTIVE_PLAN.carrier.toLowerCase()) || ACTIVE_PLAN.carrier.toLowerCase().includes(ins.toLowerCase());
                  return (
                    <Badge key={ins} variant="outline" className={`text-[10px] px-1.5 py-0 ${mine ? "border-primary/30 text-primary bg-primary/5" : "border-border text-muted-foreground"}`}>
                      {mine && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}{ins}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{doc.address}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Calendar className="h-3.5 w-3.5" /> Book Appointment
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3" onClick={(e) => e.stopPropagation()}><Phone className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" className="h-8 px-3" onClick={(e) => e.stopPropagation()}><ExternalLink className="h-3.5 w-3.5" /></Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">In the full version, booking shares your migraine history report with the provider</p>
          </div>
        )}
        <div className="flex justify-center mt-2">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Neurologists tab ───────────────────────────────────────────────────────── */
function NeurologistsTab() {
  const [zip, setZip] = useState("");
  const [submittedZip, setSubmittedZip] = useState("");
  const [filter, setFilter] = useState<DoctorFilter>("In-Network Only");
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    const clean = zip.trim();
    if (!clean) return;
    setSubmittedZip(clean);
    setSearched(true);
    setExpandedDoc(null);
  };

  const filtered = ALL_DOCTORS.filter((d) => {
    if (filter === "In-Network Only") return acceptsMyPlan(d);
    if (filter === "Migraine Specialist") return d.migraineSpecialist;
    if (filter === "Headache Center") return d.headacheCenter;
    if (filter === "Telemedicine") return d.telemedicine;
    if (filter === "Accepting New") return d.acceptingNew;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aIn = acceptsMyPlan(a) ? 1 : 0;
    const bIn = acceptsMyPlan(b) ? 1 : 0;
    return bIn !== aIn ? bIn - aIn : b.rating - a.rating;
  });

  return (
    <div className="space-y-4">
      {/* Plan banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Filtering by your active plan</p>
            <p className="text-xs text-muted-foreground">{ACTIVE_PLAN.carrier} · {ACTIVE_PLAN.planName}</p>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
            {ALL_DOCTORS.filter(acceptsMyPlan).length} in-network
          </Badge>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              maxLength={10}
            />
          </div>
          <Button onClick={handleSearch} className="gap-1.5" disabled={!zip.trim()}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DOCTOR_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 text-xs rounded-full border px-3 py-1.5 transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {!searched && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-2">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Enter a ZIP code to find neurologists near you</p>
          </CardContent>
        </Card>
      )}

      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sorted.length} provider{sorted.length !== 1 ? "s" : ""} near {submittedZip}
              {filter === "In-Network Only" && " · in-network only"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Navigation className="h-3 w-3" /> Within 10 mi</div>
          </div>
          {sorted.length === 0
            ? <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No providers match this filter. Try "All" to see everyone.</CardContent></Card>
            : sorted.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} isExpanded={expandedDoc === doc.id} onToggle={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)} />
              ))
          }
        </div>
      )}
    </div>
  );
}

/* ─── Pharmacy card ──────────────────────────────────────────────────────────── */
function PharmacyCard({ pharmacy, inNetwork }: { pharmacy: Pharmacy; inNetwork: boolean | null }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      className={`cursor-pointer transition-all ${inNetwork === true ? "border-[hsl(var(--severity-low))]/30" : inNetwork === false ? "border-border opacity-75" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{pharmacy.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{pharmacy.address}</p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{pharmacy.distance}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          {inNetwork === true && (
            <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--severity-low))] font-medium">
              <CheckCircle2 className="h-3 w-3" /> In-Network
            </div>
          )}
          {inNetwork === false && (
            <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
              <XCircle className="h-3 w-3" /> Out-of-Network
            </div>
          )}
          {inNetwork === null && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3" /> Network unknown
            </div>
          )}
          {pharmacy.twentyFourHour && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">24hr</Badge>}
          {pharmacy.driveThru && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Drive-Thru</Badge>}
          {pharmacy.specialty && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Specialty Rx</Badge>}
          {pharmacy.mailOrder && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Mail Order</Badge>}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{pharmacy.hours}</span>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{pharmacy.address}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Phone className="h-3.5 w-3.5" /> {pharmacy.phone}
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3" onClick={(e) => e.stopPropagation()}>
                <Navigation className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-2">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Pharmacies tab ─────────────────────────────────────────────────────────── */
const PHARMACY_FILTERS = ["All", "In-Network Only", "24hr", "Drive-Thru", "Specialty Rx", "Mail Order"] as const;
type PharmacyFilter = typeof PHARMACY_FILTERS[number];

function PharmaciesTab() {
  const { user } = useAuth();
  const [zip, setZip] = useState("");
  const [submittedZip, setSubmittedZip] = useState("");
  const [filter, setFilter] = useState<PharmacyFilter>("In-Network Only");
  const [searched, setSearched] = useState(false);
  const [rxPlan, setRxPlan] = useState<SavedPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const handleSearch = () => {
    const clean = zip.trim();
    if (!clean) return;
    setSubmittedZip(clean);
    setSearched(true);
  };

  const loadRxPlan = useCallback(async () => {
    if (!user) { setLoadingPlan(false); return; }
    const { data } = await supabase
      .from("insurance_plans")
      .select("id, plan_type, carrier, plan_name")
      .eq("user_id", user.id)
      .eq("plan_type", "pharmacy")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    setRxPlan(data as SavedPlan | null);
    setLoadingPlan(false);
  }, [user]);

  useEffect(() => { loadRxPlan(); }, [loadRxPlan]);

  const inNetworkChains: string[] | null = rxPlan ? getInNetworkChains(rxPlan.carrier) : null;

  function isInNetwork(pharmacy: Pharmacy): boolean | null {
    if (!inNetworkChains) return null;
    return inNetworkChains.includes(pharmacy.chain);
  }

  const filtered = PHARMACIES.filter((p) => {
    if (filter === "In-Network Only") return isInNetwork(p) === true;
    if (filter === "24hr") return p.twentyFourHour;
    if (filter === "Drive-Thru") return p.driveThru;
    if (filter === "Specialty Rx") return p.specialty;
    if (filter === "Mail Order") return p.mailOrder;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aIn = isInNetwork(a);
    const bIn = isInNetwork(b);
    if (aIn === bIn) return parseFloat(a.distance) - parseFloat(b.distance);
    if (aIn === true) return -1;
    if (bIn === true) return 1;
    return 0;
  });

  const inNetworkCount = PHARMACIES.filter((p) => isInNetwork(p) === true).length;

  return (
    <div className="space-y-4">
      {/* Plan banner */}
      {loadingPlan ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : rxPlan ? (
        <Card className="border-[hsl(var(--severity-low))]/20 bg-[hsl(var(--severity-low))]/5">
          <CardContent className="p-3 flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-[hsl(var(--severity-low))] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Filtering by your pharmacy plan</p>
              <p className="text-xs text-muted-foreground">{rxPlan.carrier}{rxPlan.plan_name ? ` · ${rxPlan.plan_name}` : ""}</p>
            </div>
            {inNetworkChains && (
              <Badge variant="outline" className="text-xs border-[hsl(var(--severity-low))]/30 text-[hsl(var(--severity-low))] shrink-0">
                {inNetworkCount} in-network
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
          <CardContent className="p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">No pharmacy plan saved</p>
              <p className="text-xs text-muted-foreground">
                Add a Pharmacy / Rx Plan in <span className="font-medium">Insurance → My Plans</span> to see which pharmacies are in-network for your plan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Express Scripts out-of-network warning */}
      {rxPlan && rxPlan.carrier.toLowerCase().includes("express scripts") && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-3 flex items-start gap-2">
            <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Express Scripts note: </span>
              Kroger, Mariano's, and some other grocery pharmacies are <span className="font-medium text-destructive">not contracted</span> with Express Scripts. Using them may result in out-of-network costs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview notice */}
      <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
        <CardContent className="p-3 flex items-start gap-2">
          <Zap className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Preview feature — </span>
            In the full release, this connects to live pharmacy locator APIs with real-time eligibility and pricing.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              maxLength={10}
            />
          </div>
          <Button onClick={handleSearch} className="gap-1.5" disabled={!zip.trim()}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PHARMACY_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 text-xs rounded-full border px-3 py-1.5 transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {!searched && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-2">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Enter a ZIP code to find pharmacies near you</p>
          </CardContent>
        </Card>
      )}

      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sorted.length} pharmac{sorted.length !== 1 ? "ies" : "y"} near {submittedZip}
              {filter === "In-Network Only" && " · in-network only"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Navigation className="h-3 w-3" /> Within 10 mi</div>
          </div>
          {sorted.length === 0
            ? <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No pharmacies match this filter. Try "All" to see all nearby locations.</CardContent></Card>
            : sorted.map((p) => <PharmacyCard key={p.id} pharmacy={p} inNetwork={isInNetwork(p)} />)
          }
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function FindCare() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find Care</h1>
        <p className="text-muted-foreground">Neurologists & pharmacies matched to your insurance</p>
      </div>

      <Tabs defaultValue="neurologists" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="neurologists" className="flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Neurologists
          </TabsTrigger>
          <TabsTrigger value="pharmacies" className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Pharmacies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="neurologists" className="mt-4">
          <NeurologistsTab />
        </TabsContent>
        <TabsContent value="pharmacies" className="mt-4">
          <PharmaciesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
