"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface UserInfo {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  planCount: number;
  linkCount: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  tool: string | null;
  status: string;
  submitterId: string;
  submitterName: string | null;
  adminNotes: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  BUILT: "bg-blue-100 text-blue-800",
};

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "BUILT"];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editStatus, setEditStatus] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const [usersRes, suggestionsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/suggestions"),
      ]);

      if (usersRes.status === 403 || suggestionsRes.status === 403) {
        setError("Access denied. Admin only.");
        setLoading(false);
        return;
      }

      if (!usersRes.ok || !suggestionsRes.ok) {
        setError("Failed to load data.");
        setLoading(false);
        return;
      }

      setUsers(await usersRes.json());
      setSuggestions(await suggestionsRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(id: string) {
    setSaving(id);
    const body: Record<string, string> = {};
    if (editStatus[id]) body.status = editStatus[id];
    if (editNotes[id] !== undefined) body.adminNotes = editNotes[id];

    const res = await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      setExpandedId(null);
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const totalPlans = users.reduce((sum, u) => sum + u.planCount, 0);
  const totalLinks = users.reduce((sum, u) => sum + u.linkCount, 0);
  const pendingCount = suggestions.filter((s) => s.status === "PENDING").length;

  // Sort: pending first, then by date desc
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{totalPlans}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{totalLinks}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Short Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{pendingCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Suggestions</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium">User</th>
                  <th className="pb-3 pr-4 font-medium">Signed Up</th>
                  <th className="pb-3 pr-4 font-medium">Last Sign In</th>
                  <th className="pb-3 pr-4 font-medium text-center">Verified</th>
                  <th className="pb-3 pr-4 font-medium text-right">Plans</th>
                  <th className="pb-3 font-medium text-right">Links</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{u.displayName || "—"}</div>
                      <div className="text-muted-foreground text-xs">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {u.lastSignIn
                        ? format(new Date(u.lastSignIn), "MMM d, yyyy h:mm a")
                        : "Never"}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      {u.emailConfirmed ? "✓" : "✗"}
                    </td>
                    <td className="py-3 pr-4 text-right">{u.planCount}</td>
                    <td className="py-3 text-right">{u.linkCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground">No suggestions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Submitter</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Tool</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSuggestions.map((s) => (
                    <>
                      <tr
                        key={s.id}
                        className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (expandedId === s.id) {
                            setExpandedId(null);
                          } else {
                            setExpandedId(s.id);
                            setEditStatus((prev) => ({ ...prev, [s.id]: s.status }));
                            setEditNotes((prev) => ({
                              ...prev,
                              [s.id]: s.adminNotes || "",
                            }));
                          }
                        }}
                      >
                        <td className="py-3 pr-4 font-medium break-words max-w-[200px]">{s.title}</td>
                        <td className="py-3 pr-4 text-muted-foreground break-words">
                          {s.submitterName || "Unknown"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                          {s.category === "EXISTING_TOOL" ? "Existing" : "New tool"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground break-words max-w-[150px]">
                          {s.tool || "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                          {format(new Date(s.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_STYLES[s.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                      {expandedId === s.id && (
                        <tr key={`${s.id}-expand`} className="border-b">
                          <td colSpan={6} className="p-4 bg-muted/30">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium mb-1">Description</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-hidden">
                                  {s.description}
                                </p>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Status</label>
                                  <select
                                    value={editStatus[s.id] || s.status}
                                    onChange={(e) =>
                                      setEditStatus((prev) => ({
                                        ...prev,
                                        [s.id]: e.target.value,
                                      }))
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  >
                                    {STATUSES.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Admin Notes</label>
                                  <Textarea
                                    value={editNotes[s.id] ?? s.adminNotes ?? ""}
                                    onChange={(e) =>
                                      setEditNotes((prev) => ({
                                        ...prev,
                                        [s.id]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                    placeholder="Add notes..."
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={() => handleSave(s.id)}
                                disabled={saving === s.id}
                              >
                                {saving === s.id ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
