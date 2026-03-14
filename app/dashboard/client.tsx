'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, Plus, AlertTriangle, DollarSign, Rocket, Briefcase, 
  TrendingUp, ExternalLink, RefreshCw, Trash2 
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  tagline?: string;
  updatedAt: string;
  alerts: Array<{ id: string; severity: string; type: string; title: string }>;
  pricing: Array<{ changeDetected: boolean }>;
  _count?: { jobs: number; reviews: number };
}

export default function DashboardClient() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    domain: '',
    tagline: '',
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const res = await fetch('/api/competitors');
      const data = await res.json();
      setCompetitors(data);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompetitor),
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setNewCompetitor({ name: '', domain: '', tagline: '' });
        fetchCompetitors();
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
    }
  };

  const triggerScrape = async (id: string) => {
    try {
      await fetch(`/api/competitors/${id}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: ['pricing', 'features', 'news', 'jobs'] }),
      });
      fetchCompetitors();
    } catch (error) {
      console.error('Error triggering scrape:', error);
    }
  };

  const deleteCompetitor = async (id: string) => {
    if (!confirm('Delete this competitor?')) return;
    try {
      await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
      fetchCompetitors();
    } catch (error) {
      console.error('Error deleting competitor:', error);
    }
  };

  const filteredCompetitors = competitors.filter(c => {
    if (filter === 'alerts') return c.alerts.length > 0;
    if (filter === 'pricing') return c.pricing.some(p => p.changeDetected);
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <DollarSign className="w-4 h-4" />;
      case 'feature': return <Rocket className="w-4 h-4" />;
      case 'hiring': return <Briefcase className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🕵️ Competitor Intel</h1>
              <p className="text-sm text-gray-500">AI-powered competitor intelligence</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Competitor
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Competitors</p>
            <p className="text-3xl font-bold text-gray-900">{competitors.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500">Active Alerts</p>
            <p className="text-3xl font-bold text-red-600">
              {competitors.reduce((sum, c) => sum + c.alerts.length, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500">Open Positions</p>
            <p className="text-3xl font-bold text-gray-900">
              {competitors.reduce((sum, c) => sum + (c._count?.jobs || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">
              {competitors[0]?.updatedAt 
                ? new Date(competitors[0].updatedAt).toLocaleDateString() 
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'alerts', 'pricing'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Competitor List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredCompetitors.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {competitors.length === 0 
                  ? 'No competitors yet. Add your first one to get started.'
                  : 'No competitors match your filter.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredCompetitors.map((competitor) => (
                <li key={competitor.id} className="hover:bg-gray-50 transition">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link 
                          href={`/competitors/${competitor.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {competitor.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`https://${competitor.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-indigo-600 flex items-center"
                          >
                            {competitor.domain}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                        {competitor.tagline && (
                          <p className="text-sm text-gray-600 mt-1">{competitor.tagline}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Alerts */}
                        {competitor.alerts.length > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">{competitor.alerts.length}</span>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <button
                          onClick={() => triggerScrape(competitor.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition"
                          title="Refresh data"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteCompetitor(competitor.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Alert badges */}
                    {competitor.alerts.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {competitor.alerts.slice(0, 3).map((alert) => (
                          <span
                            key={alert.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              alert.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {getAlertIcon(alert.type)}
                            {alert.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Competitor</h2>
            <form onSubmit={addCompetitor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompetitor.name}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompetitor.domain}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline (optional)
                  </label>
                  <input
                    type="text"
                    value={newCompetitor.tagline}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="The best thing since sliced bread"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add & Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
