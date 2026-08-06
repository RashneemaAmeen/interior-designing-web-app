import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const HIDDEN_STATUSES = ["archived", "cancelled"];

export type AdminProject = {
  id: string;
  project_name: string;
  client_name: string;
  designer: string | null;
  budget: string | null;
  project_value: number;
  stage: string;
  status: string;
  start_date: string | null;
  expected_completion: string | null;
  progress: number;
};

export type AdminConsultation = {
  id: string;
  reference_number: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  project_type: string;
  service_type: string;
  property_location: string;
  project_budget: string;
  consultation_datetime: string;
  assigned_designer: string | null;
  status: string;
  created_at: string;
};

export type AdminVisit = {
  id: string;
  client_name: string;
  address: string;
  visit_at: string;
  designer: string | null;
  status: string;
};

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isUnlocked } = await import("@/lib/admin.server");
  return { unlocked: await isUnlocked() };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) =>
    z.object({ password: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { passwordMatches, getAdminSession } = await import("@/lib/admin.server");
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("ADMIN_PASSWORD is not configured");
    if (!passwordMatches(data.password, expected)) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("@/lib/admin.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("@/lib/admin.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [projectsRes, consultationsRes, visitsRes] = await Promise.all([
    supabaseAdmin.from("projects").select("*").order("expected_completion", { ascending: true }),
    supabaseAdmin
      .from("consultations")
      .select("*")
      .eq("archived", false)
      .order("consultation_datetime", { ascending: true }),
    supabaseAdmin.from("site_visits").select("*").order("visit_at", { ascending: true }),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (consultationsRes.error) throw consultationsRes.error;
  if (visitsRes.error) throw visitsRes.error;

  const allProjects = (projectsRes.data ?? []) as unknown as AdminProject[];
  const projects = allProjects.filter((p) => !HIDDEN_STATUSES.includes(p.status));
  const consultations = (consultationsRes.data ?? []) as unknown as AdminConsultation[];
  const visits = (visitsRes.data ?? []) as unknown as AdminVisit[];

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 864e5);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 864e5);

  const todaysConsultations = consultations.filter((c) => {
    const d = new Date(c.consultation_datetime);
    return d >= startOfToday && d < endOfToday && c.status !== "cancelled";
  });

  const upcomingVisits = visits.filter((v) => {
    const d = new Date(v.visit_at);
    return v.status === "scheduled" && d >= now && d <= in7;
  });

  const enquiries = consultations
    .filter((c) => c.status === "pending")
    .slice()
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8);

  // Monthly revenue (last 6 months) from project value of completed projects
  const months: { month: string; revenue: number; consultations: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const revenue = allProjects
      .filter((p) => {
        const c = p.expected_completion ? new Date(p.expected_completion) : null;
        return p.status === "completed" && c && c >= d && c < next;
      })
      .reduce((s, p) => s + Number(p.project_value || 0), 0);
    const reqs = consultations.filter((c) => {
      const cd = new Date(c.created_at);
      return cd >= d && cd < next;
    }).length;
    months.push({ month: label, revenue, consultations: reqs });
  }

  const summary = {
    active: projects.filter((p) => p.status === "active" || p.status === "in progress").length,
    newRequests: consultations.filter((c) => c.status === "pending").length,
    awaitingApproval: projects.filter((p) => p.status === "awaiting approval").length,
    completed: allProjects.filter((p) => p.status === "completed").length,
  };

  const completionRate =
    allProjects.length === 0
      ? 0
      : Math.round(
          (allProjects.filter((p) => p.status === "completed").length / allProjects.length) * 100,
        );

  const deadlineSoon = projects.filter((p) => {
    if (!p.expected_completion || p.status === "completed") return false;
    const d = new Date(p.expected_completion);
    return d >= startOfToday && d <= new Date(now.getTime() + 14 * 864e5);
  });

  const within24h = consultations.filter((c) => {
    const d = new Date(c.consultation_datetime);
    return d >= now && d <= new Date(now.getTime() + 864e5) && c.status !== "cancelled";
  });

  return {
    projects,
    todaysConsultations,
    enquiries,
    upcomingVisits,
    summary,
    charts: {
      byStatus: ["active", "in progress", "awaiting approval", "completed"].map((s) => ({
        status: s,
        count: allProjects.filter((p) => p.status === s).length,
      })),
      months,
      completionRate,
    },
    notifications: {
      deadlineSoon: deadlineSoon.map((p) => ({ id: p.id, label: p.project_name, when: p.expected_completion })),
      pendingApprovals: projects
        .filter((p) => p.status === "awaiting approval")
        .map((p) => ({ id: p.id, label: p.project_name })),
      unreadEnquiries: enquiries.length,
      within24h: within24h.map((c) => ({
        id: c.id,
        label: c.client_name,
        when: c.consultation_datetime,
      })),
    },
  };
});

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; action: string }) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum([
          "start_design",
          "send_quotation",
          "approve_design",
          "mark_in_progress",
          "mark_completed",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = {};
    switch (data.action) {
      case "start_design":
        patch.stage = "concept design";
        patch.status = "in progress";
        patch.progress = 20;
        patch.start_date = new Date().toISOString().slice(0, 10);
        break;
      case "send_quotation":
        patch.stage = "material selection";
        patch.status = "awaiting approval";
        patch.progress = 50;
        break;
      case "approve_design":
        patch.stage = "execution";
        patch.status = "in progress";
        patch.progress = 70;
        break;
      case "mark_in_progress":
        patch.status = "in progress";
        break;
      case "mark_completed":
        patch.stage = "completed";
        patch.status = "completed";
        patch.progress = 100;
        break;
    }

    const { error } = await supabaseAdmin.from("projects").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const updateEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; action: string; datetime?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["schedule", "archive"]),
        datetime: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> =
      data.action === "archive"
        ? { archived: true }
        : {
            status: "scheduled",
            ...(data.datetime ? { consultation_datetime: data.datetime } : {}),
          };

    const { error } = await supabaseAdmin.from("consultations").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const updateVisit = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; action: string; datetime?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["reschedule", "visited", "cancel"]),
        datetime: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> =
      data.action === "visited"
        ? { status: "visited" }
        : data.action === "cancel"
          ? { status: "cancelled" }
          : { visit_at: data.datetime ?? new Date(Date.now() + 864e5).toISOString() };

    const { error } = await supabaseAdmin.from("site_visits").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
