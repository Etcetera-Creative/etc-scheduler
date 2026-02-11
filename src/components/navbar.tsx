"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    });
  }, []);

  // Don't show navbar on landing or login pages
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav className="border-b bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link href={loggedIn ? "/dashboard" : "/"} className="font-semibold text-lg shrink-0">
            Etcetera
          </Link>
          {loggedIn && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              Dashboard
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loggedIn ? (
            <>
              <Link href="/dashboard/new">
                <Button size="sm">New Plan</Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
