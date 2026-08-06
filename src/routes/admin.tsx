import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  adminLogin,
  adminLogout,
  adminStatus,
  getDashboard,
  updateEnquiry,
  updateProject,
  updateVisit,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Designer Dashboard | Spectra Interior Designing" },
      {
        name: "description",
        content:
          "Private staff dashboard for Spectra Interior Designing — projects, consultations, site visits and studio analytics.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Designer Dashboard | Spectra Interior Designing" },
      {
        property: "og:description",
        content: "Private staff dashboard for the Spectra Interior Designing studio team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STAGES = [
  "consultation",
  "concept design",
  "3d visualization",
  "material selection",
  "execution",
  "completed",
] as const;

const AED = (n: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(n);

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" });
const dateFmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "bg-accent/20 text-accent-foreground border-accent/40"
      : status === "awaiting approval" || status === "pending"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-primary/10 text-primary border-primary/20";
  return (
    <Badge variant="outline" className={`capitalize font-body text-xs ${tone}`}>
      {status}
    </Badge>
  );
}

function AdminPage() {
  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => adminStatus() });

  if (status.isLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }
  return status.data?.unlocked ? <Dashboard /> : <Unlock onUnlocked={() => status.refetch()} />;
}

function Unlock({ onUnlocked }: { onUnlocked: () => void }) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-sm border-border/70 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/15 text-accent-foreground">
            <Lock className="size-5" />
          </div>
          <CardTitle className="font-display text-2xl">Designer Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground font-body">Spectra studio staff access only</p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const res = await login({ data: { password } });
              setBusy(false);
              if (res.ok) onUnlocked();
              else setError(true);
            }}
          >
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Staff password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
            />
            {error && <p className="text-sm text-destructive font-body">Incorrect password</p>}
            <Button type="submit" className="w-full" disabled={busy || !password}>
              {busy ? "Checking…" : "Enter dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const fetchDashboard = useServerFn(getDashboard);
  const logout = useServerFn(adminLogout);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fetchDashboard() });

  const projectAction = useServerFn(updateProject);
  const enquiryAction = useServerFn(updateEnquiry);
  const visitAction = useServerFn(updateVisit);

  const mutate = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: () => toast.error("Could not update. Please try again."),
  });

  if (isLoading || !data) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading dashboard…</div>;
  }

  const { summary, projects, todaysConsultations, enquiries, upcomingVisits, charts, notifications } = data;

  const summaryCards = [
    { label: "Active Projects", value: summary.active, icon: Hammer },
    { label: "New Consultation Requests", value: summary.newRequests, icon: ClipboardList },
    { label: "Awaiting Approval", value: summary.awaitingApproval, icon: AlertTriangle },
    { label: "Completed Projects", value: summary.completed, icon: CheckCircle2 },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-xl tracking-tight sm:text-2xl">Designer Dashboard</p>
            <p className="font-body text-xs text-muted-foreground">Spectra Interior Designing · Dubai</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await logout();
              qc.clear();
              window.location.reload();
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((c) => (
            <Card
              key={c.label}
              className="border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-foreground">
                  <c.icon className="size-5" />
                </div>
                <div>
                  <p className="font-display text-3xl leading-none">{c.value}</p>
                  <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Notifications */}
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <BellRing className="size-4 text-accent-foreground" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <NotifBlock
              title="Nearing deadline"
              items={notifications.deadlineSoon.map((n) => `${n.label} · ${dateFmt(n.when)}`)}
            />
            <NotifBlock title="Pending approvals" items={notifications.pendingApprovals.map((n) => n.label)} />
            <NotifBlock
              title="Unread enquiries"
              items={notifications.unreadEnquiries ? [`${notifications.unreadEnquiries} new enquiries`] : []}
            />
            <NotifBlock
              title="Consultations in 24h"
              items={notifications.within24h.map((n) => `${n.label} · ${timeFmt(n.when)}`)}
            />
          </CardContent>
        </Card>

        {/* Today's consultations */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Today's Consultations</h2>
          {todaysConsultations.length === 0 ? (
            <EmptyState text="No consultations scheduled for today." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {todaysConsultations.map((c) => (
                <Card key={c.id} className="border-border/60 transition-shadow hover:shadow-md">
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg">{c.client_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{c.reference_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg text-accent-foreground">
                          {timeFmt(c.consultation_datetime)}
                        </p>
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                    <Separator />
                    <dl className="grid grid-cols-2 gap-2 font-body text-sm">
                      <Field label="Phone" value={c.client_phone} />
                      <Field label="Email" value={c.client_email} />
                      <Field label="Project Type" value={c.project_type} />
                      <Field label="Property" value={c.property_location} />
                      <Field label="Service" value={c.service_type} />
                      <Field label="Designer" value={c.assigned_designer ?? "Unassigned"} />
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Project management */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl">Project Management</h2>
          {STAGES.map((stage) => {
            const items = projects.filter((p) => p.stage === stage);
            if (items.length === 0) return null;
            return (
              <div key={stage} className="space-y-3">
                <h3 className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">{stage}</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  {items.map((p) => (
                    <Card key={p.id} className="border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-lg">{p.project_name}</p>
                            <p className="font-body text-sm text-muted-foreground">{p.client_name}</p>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                        <dl className="grid grid-cols-2 gap-2 font-body text-sm">
                          <Field label="Designer" value={p.designer ?? "Unassigned"} />
                          <Field label="Budget" value={p.budget ?? "—"} />
                          <Field label="Project Value" value={AED(Number(p.project_value))} />
                          <Field label="Start" value={dateFmt(p.start_date)} />
                          <Field label="Expected Completion" value={dateFmt(p.expected_completion)} />
                        </dl>
                        <div className="space-y-1">
                          <div className="flex justify-between font-body text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{p.progress}%</span>
                          </div>
                          <Progress value={p.progress} />
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(
                            [
                              ["start_design", "Start Design"],
                              ["send_quotation", "Send Quotation"],
                              ["approve_design", "Approve Design"],
                              ["mark_in_progress", "Mark In Progress"],
                              ["mark_completed", "Mark Completed"],
                            ] as const
                          ).map(([action, label]) => (
                            <Button
                              key={action}
                              size="sm"
                              variant="outline"
                              disabled={mutate.isPending}
                              onClick={() => mutate.mutate(() => projectAction({ data: { id: p.id, action } }))}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Enquiries */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Recent Client Enquiries</h2>
          {enquiries.length === 0 ? (
            <EmptyState text="No new enquiries." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enquiries.map((c) => (
                <Card key={c.id} className="border-border/60 transition-shadow hover:shadow-md">
                  <CardContent className="space-y-2 p-5">
                    <p className="font-display text-lg">{c.client_name}</p>
                    <dl className="grid gap-1 font-body text-sm">
                      <Field label="Contact" value={c.client_phone} />
                      <Field label="Project Type" value={c.project_type} />
                      <Field label="Budget" value={c.project_budget} />
                      <Field label="Preferred Date" value={dateFmt(c.consultation_datetime)} />
                    </dl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={mutate.isPending}
                        onClick={() => mutate.mutate(() => enquiryAction({ data: { id: c.id, action: "schedule" } }))}
                      >
                        <CalendarClock className="size-4" /> Schedule
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${c.client_phone}`}>
                          <Phone className="size-4" /> Call
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${c.client_email}`}>
                          <Mail className="size-4" /> Email
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={mutate.isPending}
                        onClick={() => mutate.mutate(() => enquiryAction({ data: { id: c.id, action: "archive" } }))}
                      >
                        Archive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Site visits */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Upcoming Site Visits</h2>
          {upcomingVisits.length === 0 ? (
            <EmptyState text="No site visits in the next seven days." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcomingVisits.map((v) => (
                <Card key={v.id} className="border-border/60 transition-shadow hover:shadow-md">
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-lg">{v.client_name}</p>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0" /> {v.address}
                    </p>
                    <dl className="grid gap-1 font-body text-sm">
                      <Field label="Visit" value={`${dateFmt(v.visit_at)} · ${timeFmt(v.visit_at)}`} />
                      <Field label="Designer" value={v.designer ?? "Unassigned"} />
                    </dl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutate.isPending}
                        onClick={() =>
                          mutate.mutate(() =>
                            visitAction({
                              data: {
                                id: v.id,
                                action: "reschedule",
                                datetime: new Date(new Date(v.visit_at).getTime() + 864e5).toISOString(),
                              },
                            }),
                          )
                        }
                      >
                        Reschedule +1d
                      </Button>
                      <Button
                        size="sm"
                        disabled={mutate.isPending}
                        onClick={() => mutate.mutate(() => visitAction({ data: { id: v.id, action: "visited" } }))}
                      >
                        Mark Visited
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={mutate.isPending}
                        onClick={() => mutate.mutate(() => visitAction({ data: { id: v.id, action: "cancel" } }))}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Analytics */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Dashboard Analytics</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Projects by Status">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {charts.byStatus.map((_, i) => (
                      <Cell key={i} fill="var(--accent)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Revenue">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => AED(Number(v))} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Consultation Requests">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="consultations" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Project Completion Rate">
              <div className="flex h-[240px] flex-col items-center justify-center gap-4">
                <TrendingUp className="size-8 text-accent-foreground" />
                <p className="font-display text-6xl">{charts.completionRate}%</p>
                <Progress value={charts.completionRate} className="w-3/4" />
                <p className="font-body text-sm text-muted-foreground">of all projects delivered</p>
              </div>
            </ChartCard>
          </div>
        </section>
      </div>
    </main>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

function NotifBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">Nothing pending</p>
      ) : (
        <ul className="space-y-1 font-body text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed border-border/70 bg-card/50">
      <CardContent className="p-8 text-center font-body text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
