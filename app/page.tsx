import AuctionDashboard from '@/components/AuctionDashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        <AuctionDashboard />
      </main>
    </div>
  );
}
