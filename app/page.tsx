import AuctionDashboard from '@/components/AuctionDashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <main className="container mx-auto px-4 py-8">
        <AuctionDashboard />
      </main>
    </div>
  );
}
