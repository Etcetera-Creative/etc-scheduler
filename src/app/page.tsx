import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Etcetera Scheduler
        </h1>
        <p className="text-xl text-muted-foreground">
          Make scheduling fun things with your friends easier. Create a plan,
          share the link, and find the dates that work for everyone.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
