import { Metadata } from 'next';
import CompetitorDetailClient from './client';

export const metadata: Metadata = {
  title: 'Competitor Details - Competitor Intel',
};

export default function CompetitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <CompetitorDetailClient params={params} />;
}
