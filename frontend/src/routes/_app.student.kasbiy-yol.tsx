import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Compass, Sparkles, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { getCourses, getDashboard } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/student/kasbiy-yol")({
  head: () => ({ meta: [{ title: "Kasbiy yo'l · AcademiXAI" }] }),
  component: CareerPage,
});

// Derive career suggestions based on enrolled course subjects
function suggestCareers(subjects: string[], avgScore: number) {
  const hasMath = subjects.some((s) => s.toLowerCase().includes("algebra") || s.toLowerCase().includes("matematika") || s.toLowerCase().includes("geometriya"));
  const hasPhysics = subjects.some((s) => s.toLowerCase().includes("fizika"));
  const hasBio = subjects.some((s) => s.toLowerCase().includes("biologiya"));
  const hasCS = subjects.some((s) => s.toLowerCase().includes("informatika"));
  const hasHistory = subjects.some((s) => s.toLowerCase().includes("tarix"));

  const suggestions = [];

  if (hasMath && hasPhysics) {
    suggestions.push({
      id: "cs",
      field: "Dasturiy ta'minot muhandisi",
      description: "Matematika va fizikaning kuchli bilimi sizni dasturiy ta'minot sohasida muvaffaqiyatli qiladi. AI, robotika, va tizim arxitekturasi — kelajagingiz.",
      match: Math.min(95, 75 + Math.round(avgScore / 10)),
      skills: ["Python / Java", "Algoritmlar", "Ma'lumotlar tuzilmasi", "AI/ML asoslari"],
      universities: ["TATU (Toshkent)", "INHA University Toshkent", "Turin Polytechnic University"],
    });
  }

  if (hasPhysics && hasMath) {
    suggestions.push({
      id: "engineering",
      field: "Muhandislik (Mexanika yoki Elektronika)",
      description: "Newton mexanikasi va algebra bilimlari sizni muhandislik yo'nalishida rivojlantiradi. Texnika olamiga qadam qo'ying.",
      match: Math.min(90, 70 + Math.round(avgScore / 12)),
      skills: ["Fizika", "CAD loyihalash", "Elektrotexnika", "Matematika tahlili"],
      universities: ["TATU", "O'zMU Texnika fakulteti", "Toshkent Politexnika"],
    });
  }

  if (hasBio) {
    suggestions.push({
      id: "medicine",
      field: "Tibbiyot yoki Biotexnologiya",
      description: "Biologiya fanidagi yutuqlaringiz tibbiyot va biotexnologiya sohasida ulkan imkoniyatlar ochadi.",
      match: Math.min(88, 68 + Math.round(avgScore / 12)),
      skills: ["Biologiya", "Kimyo", "Anatomiya", "Tibbiy texnologiyalar"],
      universities: ["ToshMI (Toshkent Tibbiyot)", "Samarqand Davlat Tibbiyot", "Andijan Tibbiyot"],
    });
  }

  if (hasHistory) {
    suggestions.push({
      id: "law",
      field: "Huquq yoki Diplomatiya",
      description: "Tarix bilimi huquqshunoslik va xalqaro munosabatlar sohasida mustahkam poydevor yaratadi.",
      match: Math.min(85, 65 + Math.round(avgScore / 14)),
      skills: ["Tahliliy fikrlash", "Muloqot ko'nikmalari", "Tarix va huquq", "Chet tillari"],
      universities: ["TSUL (Toshkent Huquq)", "O'zbekiston MDU", "WIUT"],
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "general",
      field: "Iqtisodiyot va Biznes",
      description: "Multifan bilimingiz iqtisodiyot va boshqaruv sohasida keng imkoniyatlar beradi.",
      match: 70,
      skills: ["Matematik tahlil", "Menejment", "Iqtisodiyot asoslari", "Loyiha boshqaruvi"],
      universities: ["TDIU (Toshkent)", "Westminster International", "INHA Toshkent"],
    });
  }

  return suggestions.sort((a, b) => b.match - a.match);
}

function CareerPage() {
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: getCourses });
  const { data: stats } = useQuery({ queryKey: ["student-dashboard"], queryFn: getDashboard });

  const subjects = courses.map((c) => c.subject ?? c.title);
  const avgScore = stats?.avgScore ?? 0;
  const suggestions = suggestCareers(subjects, avgScore);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kelajak rejasi"
        title="Sizga mos kasbiy yo'nalishlar"
        description="Kurs yo'nalishlaringiz va natijalaringiz asosida AI tahlil qilindi."
        actions={
          <Button asChild variant="outline">
            <Link to="/student/ai-ustoz">
              <Sparkles className="h-4 w-4" />
              AI bilan chuqurroq muhokama
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        {suggestions.map((c) => (
          <article key={c.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Compass className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold">{c.field}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{c.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-xl bg-success/10 px-4 py-2.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-success">Moslik</p>
                  <p className="font-display text-2xl font-semibold text-success">{c.match}%</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  Kerakli ko'nikmalar
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Tavsiya etilgan universitetlar
                </p>
                <ul className="space-y-1.5">
                  {c.universities.map((u) => (
                    <li key={u} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex gap-2 border-t border-border pt-4">
              <Button asChild size="sm">
                <Link to="/student/ai-ustoz">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI bilan suhbatlashish
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/student/kurslar">Kurslarni ko'rish</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
