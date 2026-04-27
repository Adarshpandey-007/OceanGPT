import { Hero } from '../components/landing/Hero';
import { CapabilityStrip } from '../components/landing/CapabilityStrip';
import { LiveStats } from '../components/landing/LiveStats';
import { RoadmapTimeline } from '../components/landing/RoadmapTimeline';
import { CtaBand } from '../components/landing/CtaBand';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <CapabilityStrip />
      <LiveStats />
      <RoadmapTimeline />
      <CtaBand />
    </main>
  );
}
