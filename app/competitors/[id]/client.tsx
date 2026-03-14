'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ExternalLink, RefreshCw, DollarSign, Rocket, 
  Briefcase, Newspaper, Star, AlertTriangle, TrendingUp 
} from 'lucide-react';

interface CompetitorData {
  id: string;
  name: string;
  domain: string;
  tagline?: string;
  targetMarket?: string;
  pricingModel?: string;
  fundingStage?: string;
  pricing: Array<{
    id: string;
    capturedAt: string;
    tiers: Array<{ name: string; price: string; features: string[] }>;
    changeDetected: boolean;
    changeSummary?: string;
  }>;
  features: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    launchedAt?: string;
  }>;
  news: Array<{
    id: string;
    title: string;
    url?: string;
    source?: string;
    createdAt: string;
  }>;
  jobs: Array<{
    id: string;
    title: string;
    department?: string;
    location?: string;
    postedAt: string;
  }>;
  reviews: Array<{
    id: string;
    platform: string;
    rating: number;
    text?: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
}

export default function CompetitorDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const [competitor, setCompetitor] = useState<CompetitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchCompetitor();
    }
  }, [resolvedParams]);

  const fetchCompetitor = async () => {
    if (!resolvedParams) return;
    try {
      const res = await fetch(`/api/competitors/${resolvedParams.id}`);
      const data = await res.json();
      setCompetitor(data);
    } catch (error) {
      console.error('Error fetching competitor:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerScrape = async () => {
    if (!resolvedParams) return;
    try {
      await fetch(`/api/competitors/${resolvedParams.id}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: ['pricing', 'features', 'news', 'jobs'] }),
      });
      fetchCompetitor();
    } catch (error) {
      console.error('Error triggering scrape:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Competitor not found</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'features', label: 'Features', icon: Rocket },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'jobs', label: 'Hiring', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{competitor.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={`https://${competitor.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-600 flex items-center"
                  >
                    {competitor.domain}
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                {competitor.tagline && (
                  <p className="text-gray-600 mt-2">{competitor.tagline}</p>
                )}
              </div>
              <button
                onClick={triggerScrape}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-t border-gray-200 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {competitor.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Recent Alerts ({competitor.alerts.length})
            </h2>
            <div className="space-y-3">
              {competitor.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Company Info</h3>
              <dl className="space-y-3">
                {competitor.targetMarket && (
                  <div>
                    <dt className="text-sm text-gray-500">Target Market</dt>
                    <dd className="text-gray-900">{competitor.targetMarket}</dd>
                  </div>
                )}
                {competitor.pricingModel && (
                  <div>
                    <dt className="text-sm text-gray-500">Pricing Model</dt>
                    <dd className="text-gray-900">{competitor.pricingModel}</dd>
                  </div>
                )}
                {competitor.fundingStage && (
                  <div>
                    <dt className="text-sm text-gray-500">Funding Stage</dt>
                    <dd className="text-gray-900">{competitor.fundingStage}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{competitor.features.length}</p>
                  <p className="text-sm text-gray-500">Features</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{competitor.jobs.length}</p>
                  <p className="text-sm text-gray-500">Open Positions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{competitor.news.length}</p>
                  <p className="text-sm text-gray-500">News Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{competitor.reviews.length}</p>
                  <p className="text-sm text-gray-500">Reviews</p>
                </div>
              </div>
            </div>

            {/* Recent News */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Recent News</h3>
              {competitor.news.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {competitor.news.slice(0, 5).map((item) => (
                    <li key={item.id} className="py-3">
                      <a
                        href={item.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:text-indigo-600"
                      >
                        {item.title}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.source} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No news yet. Refresh data to fetch.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {competitor.pricing.length > 0 ? (
              <>
                {/* Current Pricing */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Current Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {competitor.pricing[0].tiers.map((tier, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                        <p className="text-2xl font-bold text-indigo-600 mt-2">{tier.price}</p>
                        {tier.features.length > 0 && (
                          <ul className="mt-4 space-y-2">
                            {tier.features.slice(0, 5).map((f, j) => (
                              <li key={j} className="text-sm text-gray-600">• {f}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing History */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Pricing History</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Changes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {competitor.pricing.map((snapshot) => (
                        <tr key={snapshot.id}>
                          <td className="py-3 text-gray-900">
                            {new Date(snapshot.capturedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            {snapshot.changeDetected ? (
                              <span className="text-red-600">{snapshot.changeSummary}</span>
                            ) : (
                              <span className="text-gray-500">No changes</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pricing data yet. Click "Refresh Data" to fetch.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {competitor.features.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitor.features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`p-4 rounded-lg border ${
                      feature.status === 'deprecated'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900">{feature.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          feature.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {feature.status}
                      </span>
                    </div>
                    {feature.description && (
                      <p className="text-sm text-gray-600 mt-2">{feature.description}</p>
                    )}
                    {feature.launchedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Launched: {new Date(feature.launchedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No features tracked yet. Refresh data to fetch.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {competitor.news.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {competitor.news.map((item) => (
                  <li key={item.id} className="py-4">
                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-indigo-600 font-medium"
                    >
                      {item.title}
                    </a>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.source} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No news yet. Refresh data to fetch.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {competitor.jobs.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {competitor.jobs.map((job) => (
                  <li key={job.id} className="py-4">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      {job.department && <span>{job.department}</span>}
                      {job.location && <span>• {job.location}</span>}
                      <span>• {new Date(job.postedAt).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No job postings found. Refresh data to fetch.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
