import { Metadata } from 'next';
import DashboardClient from './client';

export const metadata: Metadata = {
  title: 'Competitor Intel - Dashboard',
  description: 'AI-powered competitor intelligence dashboard',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
