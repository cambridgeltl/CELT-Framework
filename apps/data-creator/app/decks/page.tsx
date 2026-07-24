'use client';

import { useDecks } from '../contexts/DecksContext';
import DecksDashboard from '../components/DecksDashboard';
import DeckView from '../components/DeckView';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="default" padding="none" className="overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DecksPage() {
  const { currentDeck, isLoading } = useDecks();

  // Show loading skeleton during initial load
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show DeckView if a deck is selected, otherwise show dashboard
  if (currentDeck) {
    return <DeckView />;
  }

  return <DecksDashboard />;
}
