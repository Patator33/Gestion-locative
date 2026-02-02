import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Home,
  PiggyBank
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    error: 'bg-red-500/10 text-red-600'
  };

  return (
    <Card className="stat-card border hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-xl ${colorClasses[color]} shrink-0 ml-2`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
            <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            <span className={trend >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-muted-foreground hidden sm:inline">vs mois précédent</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Vue d'ensemble de votre parc locatif
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link to="/properties" className="flex-1 sm:flex-none">
            <Button variant="outline" className="btn-hover w-full sm:w-auto" data-testid="add-property-btn">
              <Building2 className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Ajouter un</span> bien
            </Button>
          </Link>
          <Link to="/payments" className="flex-1 sm:flex-none">
            <Button className="btn-hover w-full sm:w-auto" data-testid="new-payment-btn">
              <CreditCard className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Nouveau</span> paiement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Biens"
          value={stats?.total_properties || 0}
          subtitle={`${stats?.occupied_properties || 0} occupé(s)`}
          icon={Building2}
          color="primary"
        />
        <StatCard
          title="Locataires"
          value={stats?.total_tenants || 0}
          subtitle={`${stats?.active_leases || 0} bail(s) actif(s)`}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Loyers attendus"
          value={formatCurrency(stats?.total_monthly_rent || 0)}
          subtitle="Ce mois"
          icon={PiggyBank}
          color="primary"
        />
        <StatCard
          title="Encaissé"
          value={formatCurrency(stats?.total_collected || 0)}
          subtitle={`${formatCurrency(stats?.pending_amount || 0)} en attente`}
          icon={CreditCard}
          color="success"
        />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2 border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
              {stats?.revenue_chart?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenue_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenus']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun paiement enregistré</p>
                    <Link to="/payments">
                      <Button variant="link" className="mt-2">
                        Ajouter un paiement <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Occupancy */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Taux d'occupation
                </p>
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {stats?.occupancy_rate || 0}%
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${stats?.occupancy_rate || 0}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats?.occupied_properties || 0} sur {stats?.total_properties || 0} biens occupés
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Alertes
                </p>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-3">
                {stats?.active_vacancies > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Vacances locatives</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.active_vacancies} bien(s) vacant(s)
                      </p>
                    </div>
                    <Link to="/vacancies">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {stats?.pending_amount > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Paiements en attente</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(stats.pending_amount)}
                      </p>
                    </div>
                    <Link to="/payments">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {stats?.unread_notifications > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.unread_notifications} non lue(s)
                      </p>
                    </div>
                    <Link to="/notifications">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {!stats?.active_vacancies && !stats?.pending_amount && !stats?.unread_notifications && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Aucune alerte</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
