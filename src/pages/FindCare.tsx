import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin, Star, Clock, Phone, Calendar, Search,
  Stethoscope, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Navigation, ExternalLink, ShieldCheck, Zap, XCircle,
} from "lucide-react";

/* ─── Active plan (mirrors MY_PLAN from Insurance.tsx) ── */
const ACTIVE_PLAN = {
  carrier: "Blue Cross Blue Shield",
  planName: "PPO Gold 1000",
};

/* ─── Types ──────────────────────────────────────────── */
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

/* ─── Provider directory ─────────────────────────────── */
const ALL_DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    title: "MD, PhD",
    specialty: ["Headache Medicine", "Neurology"],
    practice: "Northwestern Headache Center",
    address: "675 N Saint Clair St, Chicago, IL",
    distance: "1.2 mi",
    rating: 4.9,
    reviewCount: 312,
    acceptingNew: true,
    insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "Cigna", "UnitedHealthcare"],
    nextAvailable: "Feb 24, 2026",
    phone: "(312) 555-0182",
    migraineSpecialist: true,
    headacheCenter: true,
    telemedicine: true,
    boardCertified: true,
    yearsExp: 14,
    about: "Dr. Chen specializes in refractory migraine and CGRP therapies. She leads the Northwestern Headache Clinic and has published extensively on preventive migraine treatment.",
  },
  {
    id: 2,
    name: "Dr. James Okafor",
    title: "MD",
    specialty: ["Neurology", "Pain Medicine"],
    practice: "Rush University Medical Center",
    address: "1653 W Congress Pkwy, Chicago, IL",
    distance: "2.4 mi",
    rating: 4.7,
    reviewCount: 184,
    acceptingNew: true,
    insuranceAccepted: ["Blue Cross Blue Shield", "Medicare", "Humana"],
    nextAvailable: "Mar 3, 2026",
    phone: "(312) 555-0247",
    migraineSpecialist: true,
    headacheCenter: false,
    telemedicine: false,
    boardCertified: true,
    yearsExp: 9,
    about: "Dr. Okafor focuses on migraine management with an emphasis on lifestyle and trigger identification alongside pharmacologic treatment.",
  },
  {
    id: 3,
    name: "Dr. Maya Patel",
    title: "DO",
    specialty: ["Neurology"],
    practice: "Chicago Neurology Group",
    address: "30 N Michigan Ave, Chicago, IL",
    distance: "3.1 mi",
    rating: 4.5,
    reviewCount: 97,
    acceptingNew: false,
    insuranceAccepted: ["Aetna", "Cigna", "UnitedHealthcare"],
    nextAvailable: "Waitlist only",
    phone: "(312) 555-0391",
    migraineSpecialist: false,
    headacheCenter: false,
    telemedicine: true,
    boardCertified: true,
    yearsExp: 6,
    about: "Dr. Patel is a board-certified neurologist with broad neurological practice. She treats migraine, epilepsy, and movement disorders.",
  },
  {
    id: 4,
    name: "Dr. Robert Vance",
    title: "MD",
    specialty: ["Headache Medicine", "Neurology"],
    practice: "UChicago Medicine – Headache Clinic",
    address: "5841 S Maryland Ave, Chicago, IL",
    distance: "5.7 mi",
    rating: 4.8,
    reviewCount: 229,
    acceptingNew: true,
    insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "Medicare", "Medicaid", "UnitedHealthcare"],
    nextAvailable: "Feb 28, 2026",
    phone: "(773) 555-0604",
    migraineSpecialist: true,
    headacheCenter: true,
    telemedicine: true,
    boardCertified: true,
    yearsExp: 22,
    about: "Dr. Vance has over two decades of experience treating complex headache disorders, including NDPH and MOH. He is a fellow of the American Headache Society.",
  },
  {
    id: 5,
    name: "Dr. Fatima Khalid",
    title: "MD",
    specialty: ["Neurology", "Headache Medicine"],
    practice: "Illinois Neurological Institute",
    address: "530 NE Glen Oak Ave, Peoria, IL",
    distance: "7.4 mi",
    rating: 4.6,
    reviewCount: 142,
    acceptingNew: true,
    insuranceAccepted: ["Cigna", "Humana", "Medicaid", "Oscar Health"],
    nextAvailable: "Mar 10, 2026",
    phone: "(309) 555-0812",
    migraineSpecialist: true,
    headacheCenter: false,
    telemedicine: true,
    boardCertified: true,
    yearsExp: 11,
    about: "Dr. Khalid specializes in hormonal migraine and chronic daily headache, with a focus on non-pharmacological interventions alongside evidence-based treatment.",
  },
  {
    id: 6,
    name: "Dr. Marcus Webb",
    title: "MD",
    specialty: ["Neurology"],
    practice: "Advocate Lutheran General Hospital",
    address: "1775 Dempster St, Park Ridge, IL",
    distance: "9.2 mi",
    rating: 4.3,
    reviewCount: 76,
    acceptingNew: true,
    insuranceAccepted: ["Aetna", "UnitedHealthcare", "Molina Healthcare"],
    nextAvailable: "Mar 17, 2026",
    phone: "(847) 555-0338",
    migraineSpecialist: false,
    headacheCenter: false,
    telemedicine: false,
    boardCertified: true,
    yearsExp: 8,
    about: "General neurologist seeing a broad range of patients including migraine, tension headache, and peripheral neuropathy.",
  },
];

const FILTER_OPTIONS = ["All", "In-Network Only", "Migraine Specialist", "Headache Center", "Telemedicine", "Accepting New"] as const;
type Filter = typeof FILTER_OPTIONS[number];

/* ─── Helpers ────────────────────────────────────────── */
function acceptsMyPlan(doc: Doctor) {
  return doc.insuranceAccepted.some(
    (ins) => ins.toLowerCase().includes(ACTIVE_PLAN.carrier.toLowerCase()) ||
      ACTIVE_PLAN.carrier.toLowerCase().includes(ins.toLowerCase())
  );
}

/* ─── Doctor card ────────────────────────────────────── */
function DoctorCard({ doc, isExpanded, onToggle }: { doc: Doctor; isExpanded: boolean; onToggle: () => void }) {
  const inNetwork = acceptsMyPlan(doc);

  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all ${!doc.acceptingNew ? "opacity-80" : ""} ${inNetwork ? "border-primary/20" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{doc.name}</span>
              <span className="text-xs text-muted-foreground">{doc.title}</span>
              {doc.migraineSpecialist && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                  Migraine Specialist
                </Badge>
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

        {/* Insurance match + status chips */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {inNetwork ? (
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <ShieldCheck className="h-3 w-3" /> In-Network
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <XCircle className="h-3 w-3" /> Out-of-Network
            </div>
          )}
          {doc.acceptingNew ? (
            <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--severity-low))]">
              <CheckCircle2 className="h-3 w-3" /> Accepting new patients
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertCircle className="h-3 w-3" /> Waitlist only
            </div>
          )}
          {doc.telemedicine && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Telemedicine</Badge>
          )}
          {doc.headacheCenter && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Headache Center</Badge>
          )}
        </div>

        {/* Next available */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Next available: <span className={`font-medium ${doc.acceptingNew ? "text-foreground" : "text-muted-foreground"}`}>{doc.nextAvailable}</span></span>
        </div>

        {/* Expanded detail */}
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

            {/* Insurance badges */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Accepted insurance</p>
              <div className="flex flex-wrap gap-1">
                {doc.insuranceAccepted.map((ins) => {
                  const isMyPlan = ins.toLowerCase().includes(ACTIVE_PLAN.carrier.toLowerCase()) ||
                    ACTIVE_PLAN.carrier.toLowerCase().includes(ins.toLowerCase());
                  return (
                    <Badge
                      key={ins}
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${isMyPlan
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-border text-muted-foreground"
                      }`}
                    >
                      {isMyPlan && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                      {ins}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{doc.address}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Calendar className="h-3.5 w-3.5" /> Book Appointment
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3" onClick={(e) => e.stopPropagation()}>
                <Phone className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              In the full version, booking shares your migraine history report with the provider
            </p>
          </div>
        )}

        <div className="flex justify-center mt-2">
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function FindCare() {
  const [zip, setZip] = useState("60611");
  const [filter, setFilter] = useState<Filter>("In-Network Only");
  const [expandedDoc, setExpandedDoc] = useState<number | null>(1);
  const [searched, setSearched] = useState(true);

  const filtered = ALL_DOCTORS.filter((d) => {
    if (filter === "In-Network Only") return acceptsMyPlan(d);
    if (filter === "Migraine Specialist") return d.migraineSpecialist;
    if (filter === "Headache Center") return d.headacheCenter;
    if (filter === "Telemedicine") return d.telemedicine;
    if (filter === "Accepting New") return d.acceptingNew;
    return true;
  });

  // Sort: in-network first, then by rating
  const sorted = [...filtered].sort((a, b) => {
    const aIn = acceptsMyPlan(a) ? 1 : 0;
    const bIn = acceptsMyPlan(b) ? 1 : 0;
    if (bIn !== aIn) return bIn - aIn;
    return b.rating - a.rating;
  });

  const inNetworkCount = ALL_DOCTORS.filter(acceptsMyPlan).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find a Neurologist</h1>
        <p className="text-muted-foreground">Connect with headache specialists near you</p>
      </div>

      {/* Active plan banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Filtering by your active plan</p>
            <p className="text-xs text-muted-foreground">{ACTIVE_PLAN.carrier} · {ACTIVE_PLAN.planName}</p>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
            {inNetworkCount} in-network
          </Badge>
        </CardContent>
      </Card>

      {/* Preview notice */}
      <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
        <CardContent className="p-3 flex items-start gap-2">
          <Zap className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Preview feature — </span>
            In the full release, this connects to live NPI provider directories, real-time insurance eligibility checks, and direct booking with your migraine history.
          </p>
        </CardContent>
      </Card>

      {/* Location search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ZIP code or city"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setSearched(true)} className="gap-1.5">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 text-xs rounded-full border px-3 py-1.5 transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sorted.length} provider{sorted.length !== 1 ? "s" : ""} near {zip}
              {filter === "In-Network Only" && " · in-network only"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Navigation className="h-3 w-3" /> Within 10 mi
            </div>
          </div>

          {sorted.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No providers match this filter. Try "All" to see everyone.
              </CardContent>
            </Card>
          ) : (
            sorted.map((doc) => (
              <DoctorCard
                key={doc.id}
                doc={doc}
                isExpanded={expandedDoc === doc.id}
                onToggle={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
