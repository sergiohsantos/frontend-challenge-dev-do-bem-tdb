import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { HeroSection } from "@/components/home/hero-section"
import { ImpactSection } from "@/components/home/impact-section"
import { ProgramsPreview } from "@/components/home/programs-preview"
import { HowItWorks } from "@/components/home/how-it-works"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CTASection } from "@/components/home/cta-section"
import { SupportersCarousel } from "@/components/home/supporters-carousel"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ImpactSection />
        <ProgramsPreview />
        <HowItWorks />
        <TestimonialsSection />
        <SupportersCarousel />
        <CTASection />
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
