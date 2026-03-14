import HeroPage from "@/components/Hero";
import Container from "@/components/Container";
import ChoosePage from "@/components/Choose";
import HowItWorks from "@/components/HowItWorks";
import PlansSection from "@/components/PlansSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import LandingFooterSection from "@/components/LandingFooterSection";
import { Scales } from "@/components/scales";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-breach-bg pb-14">
      <Container className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0 px-1 sm:px-2">
        <div className="relative h-full min-h-screen">
          <Scales />
        </div>
      </Container>

      <div className="relative z-10">
        <HeroPage />

        <Container className="py-10">
          <div className="space-y-10">
          <ChoosePage />
          <HowItWorks />
          <PlansSection />
          <TestimonialsSection />
          <FAQSection />
          <LandingFooterSection />
          </div>
        </Container>
      </div>
    </main>
  );
}
