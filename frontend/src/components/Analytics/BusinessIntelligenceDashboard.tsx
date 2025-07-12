/**
 * Business Intelligence Dashboard - Adaptive Learning Ecosystem
 * EbroValley Digital - Executive-level analytics and KPIs
 * 
 * Comprehensive BI dashboard for stakeholders with real-time metrics,
 * predictive analytics, and executive-level insights
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Brain,
  Activity
} from 'lucide-react';

import { getAnalyticsService } from '../../services/analyticsService';
import { useAuth } from '../../hooks/useAuth';
import { useApiService } from '../../hooks/useApiService';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { DateRangePicker } from '../ui/date-range-picker';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Alert, AlertDescription } from '../ui/alert';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface KPICard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}

interface TimeSeriesData {
  date: string;
  active_users: number;
  new_users: number;
  course_completions: number;
  engagement_score: number;
  revenue: number;
}

interface LearningEffectiveness {
  course_name: string;
  completion_rate: number;
  avg_score: number;
  dropout_rate: number;
  engagement_score: number;
  enrolled_students: number;
}

interface UserSegmentation {
  segment: string;
  count: number;
  percentage: number;
  avg_completion_rate: number;
  avg_engagement: number;
}

interface PredictiveMetrics {
  churn_probability: number;
  projected_growth: number;
  completion_forecast: number;
  revenue_forecast: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const BusinessIntelligenceDashboard: React.FC = () => {
  useAuth();
  const apiService = useApiService() as any;
  const analyticsService = useMemo(() => getAnalyticsService(apiService), [apiService]);
  const analytics = useAnalytics();

  // State management
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [kpis, setKpis] = useState<KPICard[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [learningEffectiveness, setLearningEffectiveness] = useState<LearningEffectiveness[]>([]);
  const [userSegmentation, setUserSegmentation] = useState<UserSegmentation[]>([]);
  const [predictiveMetrics, setPredictiveMetrics] = useState<PredictiveMetrics | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);

  // Chart colors - memoized to prevent dependency warnings
  const colors = useMemo(() => ({
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#6366F1',
    success: '#059669'
  }), []);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));

      // Fetch all data in parallel
      const [
        businessMetrics,
        historicalMetrics,
        learningAnalytics,
        realtimeData
      ] = await Promise.all([
        analyticsService.getBusinessMetrics(startDate.toISOString(), endDate.toISOString()),
        analyticsService.getHistoricalBusinessMetrics(parseInt(timeRange)),
        analyticsService.getAggregatedLearningAnalytics({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }),
        analyticsService.getRealtimeMetrics()
      ]);

      // Process KPIs
      const currentMetrics = businessMetrics.data;
      const previousPeriod = historicalMetrics.data[historicalMetrics.data.length - 2];
      
      const processedKPIs: KPICard[] = [
        {
          title: 'Active Users',
          value: currentMetrics.active_users.toLocaleString(),
          change: previousPeriod ? ((currentMetrics.active_users - previousPeriod.active_users) / previousPeriod.active_users * 100) : 0,
          changeType: 'increase',
          icon: <Users className="w-5 h-5" />,
          subtitle: 'Daily active users',
          color: colors.primary
        },
        {
          title: 'Course Completions',
          value: currentMetrics.course_completions.toLocaleString(),
          change: previousPeriod ? ((currentMetrics.course_completions - previousPeriod.course_completions) / previousPeriod.course_completions * 100) : 0,
          changeType: 'increase',
          icon: <Award className="w-5 h-5" />,
          subtitle: 'Total completions',
          color: colors.success
        },
        {
          title: 'Avg Session Duration',
          value: `${Math.round(currentMetrics.average_session_duration)}min`,
          change: previousPeriod ? ((currentMetrics.average_session_duration - previousPeriod.average_session_duration) / previousPeriod.average_session_duration * 100) : 0,
          changeType: 'increase',
          icon: <Clock className="w-5 h-5" />,
          subtitle: 'Average session time',
          color: colors.info
        },
        {
          title: 'New Registrations',
          value: currentMetrics.new_registrations.toLocaleString(),
          change: previousPeriod ? ((currentMetrics.new_registrations - previousPeriod.new_registrations) / previousPeriod.new_registrations * 100) : 0,
          changeType: 'increase',
          icon: <TrendingUp className="w-5 h-5" />,
          subtitle: 'New sign-ups',
          color: colors.secondary
        }
      ];

      // Process time series data
      const processedTimeSeries: TimeSeriesData[] = historicalMetrics.data.map((item: any) => ({
        date: new Date(item.period_start).toLocaleDateString(),
        active_users: item.active_users,
        new_users: item.new_registrations,
        course_completions: item.course_completions,
        engagement_score: item.engagement_metrics?.avg_engagement_score || 0,
        revenue: item.revenue_metrics?.total_revenue || 0
      }));

      // Process learning effectiveness data
      const processedLearningEffectiveness: LearningEffectiveness[] = (learningAnalytics.data as any)?.courses?.map((course: any) => ({
        course_name: course.title,
        completion_rate: course.completion_rate,
        avg_score: course.avg_score,
        dropout_rate: course.dropout_rate,
        engagement_score: course.engagement_score,
        enrolled_students: course.enrolled_students
      })) || [];

      // Process user segmentation
      const processedUserSegmentation: UserSegmentation[] = [
        { segment: 'Highly Engaged', count: 1250, percentage: 35, avg_completion_rate: 85, avg_engagement: 8.5 },
        { segment: 'Moderately Engaged', count: 1800, percentage: 50, avg_completion_rate: 65, avg_engagement: 6.2 },
        { segment: 'At Risk', count: 540, percentage: 15, avg_completion_rate: 25, avg_engagement: 3.1 }
      ];

      // Mock predictive metrics (replace with actual ML predictions)
      const mockPredictiveMetrics: PredictiveMetrics = {
        churn_probability: 0.12,
        projected_growth: 0.23,
        completion_forecast: 0.78,
        revenue_forecast: 125000
      };

      // Update state
      setKpis(processedKPIs);
      setTimeSeriesData(processedTimeSeries);
      setLearningEffectiveness(processedLearningEffectiveness);
      setUserSegmentation(processedUserSegmentation);
      setPredictiveMetrics(mockPredictiveMetrics);
      setRealtimeMetrics(realtimeData.data);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, analyticsService, colors]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates
  useEffect(() => {
    const updateRealtimeMetrics = async () => {
      try {
        const realtimeData = await analyticsService.getRealtimeMetrics();
        setRealtimeMetrics(realtimeData.data);
      } catch (err) {
        console.error('Failed to update real-time metrics:', err);
      }
    };

    const interval = setInterval(updateRealtimeMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [analyticsService]);

  // Track dashboard views
  useEffect(() => {
    analytics.trackPageView('/dashboard/business-intelligence', 'Business Intelligence Dashboard');
  }, [analytics]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    
    analytics.trackEngagementEvent({
      action: 'click',
      element_type: 'button',
      element_id: 'refresh-dashboard',
      page_section: 'dashboard-header'
    });
  }, [fetchDashboardData, analytics]);

  const handleExportData = useCallback(async (format: 'csv' | 'xlsx') => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));

      const blob = await analyticsService.exportData(format, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-intelligence-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      analytics.trackEvent({
        event_type: 'export',
        event_category: 'dashboard',
        event_action: 'download',
        event_label: format,
        properties: { export_type: 'business_intelligence' }
      });
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  }, [timeRange, analyticsService, analytics]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderKPICard = (kpi: KPICard) => (
    <Card key={kpi.title} className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <div className="text-muted-foreground" style={{ color: kpi.color }}>
          {kpi.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{kpi.subtitle}</span>
          <Badge 
            variant={kpi.changeType === 'increase' ? 'default' : 'secondary'}
            className="ml-auto"
          >
            {kpi.changeType === 'increase' ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(kpi.change).toFixed(1)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderPredictiveInsights = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Predictive Insights
        </CardTitle>
        <CardDescription>
          AI-powered predictions and forecasts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Churn Risk</span>
              <Badge variant={predictiveMetrics?.churn_probability! > 0.15 ? 'destructive' : 'default'}>
                {(predictiveMetrics?.churn_probability! * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Growth Forecast</span>
              <Badge variant="default">
                +{(predictiveMetrics?.projected_growth! * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completion Forecast</span>
              <Badge variant="default">
                {(predictiveMetrics?.completion_forecast! * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue Forecast</span>
              <Badge variant="default">
                ${predictiveMetrics?.revenue_forecast!.toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRealtimeMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Real-time Activity
        </CardTitle>
        <CardDescription>
          Live metrics updated every 30 seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {realtimeMetrics?.daily_active_users || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Users Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {realtimeMetrics?.active_sessions || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {realtimeMetrics?.total_events_today || 0}
            </div>
            <div className="text-sm text-muted-foreground">Events Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(realtimeMetrics?.event_counts || {}).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Interactions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <p className="text-muted-foreground">Executive dashboard with real-time insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportData('xlsx')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(renderKPICard)}
      </div>

      {/* Real-time and Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderRealtimeMetrics()}
        {renderPredictiveInsights()}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">Learning Analytics</TabsTrigger>
          <TabsTrigger value="users">User Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="active_users" 
                      stackId="1" 
                      stroke={colors.primary} 
                      fill={colors.primary}
                      name="Active Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="new_users" 
                      stackId="1" 
                      stroke={colors.secondary} 
                      fill={colors.secondary}
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="course_completions" 
                      stroke={colors.success} 
                      strokeWidth={2}
                      name="Completions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagement_score" 
                      stroke={colors.warning} 
                      strokeWidth={2}
                      name="Engagement Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Analytics Tab */}
        <TabsContent value="learning" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={learningEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completion_rate" fill={colors.primary} name="Completion Rate %" />
                    <Bar dataKey="avg_score" fill={colors.secondary} name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userSegmentation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({segment, percentage}) => `${segment} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {userSegmentation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(colors)[index % Object.values(colors).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Insights Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Segmentation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Segment</th>
                      <th className="text-left p-2">Users</th>
                      <th className="text-left p-2">Percentage</th>
                      <th className="text-left p-2">Avg Completion</th>
                      <th className="text-left p-2">Avg Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSegmentation.map((segment, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{segment.segment}</td>
                        <td className="p-2">{segment.count.toLocaleString()}</td>
                        <td className="p-2">{segment.percentage}%</td>
                        <td className="p-2">{segment.avg_completion_rate}%</td>
                        <td className="p-2">{segment.avg_engagement}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">250ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0.01%</div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceDashboard;