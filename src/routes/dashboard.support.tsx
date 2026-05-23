import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle, FileQuestion } from "lucide-react";

export const Route = createFileRoute("/dashboard/support")({ component: SupportPage });

function SupportPage() {
  return (
    <DashboardLayout title="Support">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader><CardTitle>Contact Support</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-1.5"><Label>Subject</Label><Input placeholder="How can we help?" /></div>
              <div className="space-y-1.5"><Label>Message</Label><Textarea rows={6} placeholder="Describe your issue…" /></div>
              <Button className="bg-primary-gradient text-primary-foreground">Send Message</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[
            { icon: Mail, t: "Email Us", d: "support@skyrisefuture.com" },
            { icon: MessageCircle, t: "Live Chat", d: "Available 24 / 7" },
            { icon: FileQuestion, t: "Help Center", d: "Browse our FAQ" },
          ].map((c) => (
            <Card key={c.t} className="border-soft shadow-card">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><c.icon size={18} /></div>
                <div><div className="font-semibold text-sm">{c.t}</div><div className="text-xs text-muted-foreground">{c.d}</div></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
