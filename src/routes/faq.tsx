import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { faqs } from "@/lib/mock-data";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [
    { title: "FAQ — SkyRise Future" },
    { name: "description", content: "Common questions about SkyRise Future packages, ROI, referrals, and rewards." },
    { property: "og:title", content: "FAQ — SkyRise Future" },
    { property: "og:description", content: "Get answers to common SkyRise Future questions." },
  ]}),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PublicLayout>
      <section className="bg-sky-gradient py-16">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <Badge className="bg-primary/10 text-primary border-0">FAQ</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl">Frequently asked questions</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <Accordion type="single" collapsible className="bg-white rounded-2xl border border-soft shadow-card divide-y">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`} className="border-0 px-5">
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PublicLayout>
  );
}
