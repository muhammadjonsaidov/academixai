import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Atom,
  FlaskConical,
  Globe,
  Microscope,
  Thermometer,
  Waves,
  X,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/labs")({
  head: () => ({ meta: [{ title: "Laboratoriya · AcademiXAI" }] }),
  component: LabsPage,
});

interface Lab {
  id: string;
  title: string;
  subject: string;
  description: string;
  icon: typeof FlaskConical;
  url: string;
  difficulty: "Oson" | "O'rta" | "Qiyin";
  grade: string;
}

const LABS: Lab[] = [
  {
    id: "pendulum",
    title: "Mayatnik laboratoriyasi",
    subject: "Fizika",
    description:
      "Mayatnikning tebranish davri, uzunlik va tortishish kuchi o'rtasidagi bog'liqlikni tajribada aniqlang.",
    icon: Waves,
    url: "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_uz.html",
    difficulty: "Oson",
    grade: "7–9-sinf",
  },
  {
    id: "circuit",
    title: "Elektr sxemasi",
    subject: "Fizika",
    description:
      "Ketma-ket va parallel sxemalar tuzing. Tok, kuchlanish va qarshilikni O'm qonuni orqali hisoblang.",
    icon: Zap,
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_uz.html",
    difficulty: "O'rta",
    grade: "8–10-sinf",
  },
  {
    id: "atom",
    title: "Atom tuzilishi",
    subject: "Kimyo",
    description:
      "Atom yadrosini qurang: proton, neytron va elektronlar sonini o'zgartiring, element nomini kuzating.",
    icon: Atom,
    url: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_uz.html",
    difficulty: "Oson",
    grade: "8–9-sinf",
  },
  {
    id: "wave",
    title: "Mexanik to'lqinlar",
    subject: "Fizika",
    description:
      "Amplituda, chastota va to'lqin uzunligi o'rtasidagi munosabatni interaktiv tajribada o'rganing.",
    icon: Waves,
    url: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_uz.html",
    difficulty: "O'rta",
    grade: "9–11-sinf",
  },
  {
    id: "energy",
    title: "Energiya saqlanish qonuni",
    subject: "Fizika",
    description:
      "Skeyt-parkda potensial va kinetik energiyaning bir-biriga o'tishini kuzating va hisoblang.",
    icon: Thermometer,
    url: "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_uz.html",
    difficulty: "Oson",
    grade: "9–10-sinf",
  },
  {
    id: "gravity",
    title: "Tortishish kuchi va orbitalar",
    subject: "Astronomiya",
    description:
      "Yer, Oy va Quyosh gravitatsiyasini solishtiring. Sayyoralar orbita harakatini vizualizatsiya qiling.",
    icon: Globe,
    url: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_uz.html",
    difficulty: "Qiyin",
    grade: "10–11-sinf",
  },
];

const difficultyColor: Record<Lab["difficulty"], string> = {
  Oson: "bg-success/15 text-success",
  "O'rta": "bg-warning/15 text-warning-foreground dark:text-warning",
  Qiyin: "bg-destructive/15 text-destructive",
};

function PhetModal({ lab, onClose }: { lab: Lab; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{lab.title}</span>
          <Badge variant="secondary" className="text-[11px]">
            PhET · {lab.subject}
          </Badge>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label="Yopish"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>
        <iframe
          src={lab.url}
          title={lab.title}
          className="flex-1 w-full border-0"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}

function LabsPage() {
  const { t } = useT();
  const [activeLab, setActiveLab] = useState<Lab | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.labs}
        title="PhET interaktiv simulatsiyalar"
        description="Colorado universiteti PhET loyihasi — 100 milliondan ortiq o'quvchi foydalanadi. O'zbek tilida."
      />

      {/* Banner */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/20 via-card to-secondary/10 border border-primary/20 p-5 shadow-soft">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Microscope className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Real tajriba, virtual muhit
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Har bir simulatsiya maktab dasturi bo'yicha tuzilgan. Dars oldidan yoki keyin mustaqil foydalaning.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((lab) => {
          const Icon = lab.icon;
          return (
            <div
              key={lab.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elevated hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    difficultyColor[lab.difficulty],
                  )}
                >
                  {lab.difficulty}
                </span>
              </div>

              <h3 className="mt-4 font-display text-base font-semibold text-foreground leading-snug">
                {lab.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lab.subject} · {lab.grade}
              </p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                {lab.description}
              </p>

              <Button
                className="mt-5 w-full gap-2"
                onClick={() => setActiveLab(lab)}
              >
                <FlaskConical className="h-4 w-4" />
                Laboratoriyani ochish
              </Button>
            </div>
          );
        })}
      </div>

      {activeLab && (
        <PhetModal lab={activeLab} onClose={() => setActiveLab(null)} />
      )}
    </div>
  );
}
