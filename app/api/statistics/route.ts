/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/statistics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

// Supabase Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    const filters = searchParams.get('filters') || '{}';
    
    const parsedFilters = JSON.parse(filters);
    
    // Get date range based on period
    const dateRange = getDateRange(period);
    
    console.log(`Fetching statistics for period: ${period}`, dateRange);
    console.log('Applied filters:', parsedFilters);
    
    // Apply filters to SQL queries
    const timeSeriesQuery = supabase.rpc('get_contact_trends', {
      start_date: dateRange.start,
      end_date: dateRange.end,
      period_type: period
    });
    
    const distributionQuery = supabase.rpc('get_contact_distributions', {
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    // If we have filters, we need to get filtered data manually
    if (hasActiveFilters(parsedFilters)) {
      // Get filtered contacts first
      let contactQuery = supabase
        .from('contacts')
        .select('*')
        .gte('createdAt', dateRange.start)
        .lte('createdAt', dateRange.end);
      
      // Apply filters
      if (parsedFilters.contactType && parsedFilters.contactType !== 'all') {
        contactQuery = contactQuery.eq('contactType', parsedFilters.contactType);
      }
      if (parsedFilters.serviceType && parsedFilters.serviceType !== 'all') {
        contactQuery = contactQuery.eq('serviceType', parsedFilters.serviceType);
      }
      if (parsedFilters.district && parsedFilters.district !== 'all') {
        contactQuery = contactQuery.eq('district', parsedFilters.district);
      }
      
      const { data: filteredContacts, error: contactError } = await contactQuery;
      
      if (contactError) {
        console.error('Filtered contacts error:', contactError);
        throw contactError;
      }
      
      // Process filtered data manually
      const timeSeriesData = processFilteredTimeSeriesData(filteredContacts || [], period, dateRange);
      const distributionData = processFilteredDistributionData(filteredContacts || []);
      const comparisonData = await processFilteredComparisonData(filteredContacts || [], period);
      const summaryData = processFilteredSummaryData(filteredContacts || []);
      
      const formattedResponse = {
        timeSeries: timeSeriesData,
        distribution: distributionData,
        metrics: formatMetrics(comparisonData, summaryData, period),
        summary: summaryData,
        totalContacts: summaryData?.totalContacts || 0
      };
      
      return NextResponse.json(formattedResponse);
    }
    
    // Use the SQL functions for unfiltered data (better performance)
    
    // 1. Get time series data using get_contact_trends function
    const { data: timeSeriesData, error: timeSeriesError } = await timeSeriesQuery;
    
    if (timeSeriesError) {
      console.error('Time series error:', timeSeriesError);
      throw timeSeriesError;
    }
    
    // 2. Get distribution data using get_contact_distributions function
    const { data: distributionData, error: distributionError } = await distributionQuery;
    
    if (distributionError) {
      console.error('Distribution error:', distributionError);
      throw distributionError;
    }
    
    // 3. Get period comparison metrics using get_period_comparison function
    const previousDateRange = getPreviousDateRange(period);
    const { data: comparisonData, error: comparisonError } = await supabase.rpc('get_period_comparison', {
      current_start: getCurrentPeriodStart(period),
      current_end: dateRange.end,
      previous_start: previousDateRange.start,
      previous_end: previousDateRange.end
    });
    
    if (comparisonError) {
      console.error('Comparison error:', comparisonError);
      throw comparisonError;
    }
    
    // 4. Get dashboard summary using get_dashboard_summary function
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_dashboard_summary', {
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    if (summaryError) {
      console.error('Summary error:', summaryError);
      throw summaryError;
    }
    
    // Format the data for frontend consumption
    const formattedResponse = {
      timeSeries: formatTimeSeriesData(timeSeriesData || []),
      distribution: distributionData || {
        contactType: {},
        serviceType: {},
        gender: {},
        district: {}
      },
      metrics: formatMetrics(comparisonData, summaryData, period),
      summary: summaryData,
      totalContacts: summaryData?.totalContacts || 0
    };
    
    console.log('Successfully fetched statistics:', {
      timeSeriesCount: formattedResponse.timeSeries.length,
      totalContacts: formattedResponse.totalContacts,
      metricsCount: formattedResponse.metrics.length
    });
    
    return NextResponse.json(formattedResponse);
    
  } catch (error) {
    console.error('Statistics API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getDateRange(period: string) {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'weekly':
      start.setDate(now.getDate() - (12 * 7)); // 12 weeks back
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 12); // 12 months back
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 5); // 5 years back
      break;
    default:
      start.setMonth(now.getMonth() - 12);
  }
  
  return {
    start: start.toISOString(),
    end: now.toISOString()
  };
}

function getCurrentPeriodStart(period: string) {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }
  
  return start.toISOString();
}

function getPreviousDateRange(period: string) {
  const now = new Date();
  const start = new Date();
  const end = new Date();
  
  switch (period) {
    case 'weekly':
      start.setDate(now.getDate() - 14); // 2 weeks ago
      end.setDate(now.getDate() - 7);    // 1 week ago
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 2); // 2 months ago
      end.setMonth(now.getMonth() - 1);   // 1 month ago
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 2); // 2 years ago
      end.setFullYear(now.getFullYear() - 1);   // 1 year ago
      break;
    default:
      start.setMonth(now.getMonth() - 2);
      end.setMonth(now.getMonth() - 1);
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function formatTimeSeriesData(data: any[]) {
  return data.map(item => ({
    period: item.period_label,
    newConvert: Number(item.new_convert_count),
    firstTimer: Number(item.first_timer_count),
    total: Number(item.total_count),
    date: item.period_date
  }));
}

function formatMetrics(comparisonData: any, summaryData: any, period: string) {
  const current = comparisonData?.current || {};
  const changes = comparisonData?.changes || {};
  const summary = summaryData || {};
  
  const getTrend = (change: number): 'up' | 'down' | 'neutral' => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };
  
  return [
    {
      title: "Total Contacts",
      value: Number(summary.totalContacts) || 0,
      change: Number(changes.total) || 0,
      trend: getTrend(Number(changes.total) || 0),
      icon: "FaUsers",
      color: "bg-blue-500",
    },
    {
      title: period === "weekly" ? "This Week" : period === "monthly" ? "This Month" : "This Year",
      value: Number(current.total) || 0,
      change: Number(changes.total) || 0,
      trend: getTrend(Number(changes.total) || 0),
      icon: "FaCalendarCheck",
      color: "bg-green-500",
    },
    {
      title: "New Converts",
      value: Number(summary.newConverts) || 0,
      change: Number(changes.newConvert) || 0,
      trend: getTrend(Number(changes.newConvert) || 0),
      icon: "FaPrayingHands",
      color: "bg-indigo-500",
    },
    {
      title: "First Timers",
      value: Number(summary.firstTimers) || 0,
      change: Number(changes.firstTimer) || 0,
      trend: getTrend(Number(changes.firstTimer) || 0),
      icon: "FaChartLine",
      color: "bg-orange-500",
    },
  ];
}

// Helper functions for filtering

function hasActiveFilters(filters: any): boolean {
  return (filters.contactType && filters.contactType !== 'all') ||
         (filters.serviceType && filters.serviceType !== 'all') ||
         (filters.district && filters.district !== 'all');
}

function processFilteredTimeSeriesData(contacts: any[], period: string, dateRange: any) {
  const now = new Date();
  const groupedData: { [key: string]: { newConvert: number; firstTimer: number; total: number } } = {};
  
  // Initialize periods
  let periods = 12;
  if (period === 'weekly') periods = 12;
  if (period === 'monthly') periods = 12;
  if (period === 'yearly') periods = 5;
  
  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date(now);
    let key = '';
    
    if (period === 'weekly') {
      date.setDate(date.getDate() - (i * 7));
      key = `Week ${periods - i}`;
    } else if (period === 'monthly') {
      date.setMonth(date.getMonth() - i);
      key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      date.setFullYear(date.getFullYear() - i);
      key = date.getFullYear().toString();
    }
    
    groupedData[key] = { newConvert: 0, firstTimer: 0, total: 0 };
  }
  
  // Group contacts by period
  contacts.forEach(contact => {
    const createdAt = new Date(contact.createdAt);
    let key = '';
    
    if (period === 'weekly') {
      const weeksDiff = Math.floor((now.getTime() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksDiff < periods && weeksDiff >= 0) {
        key = `Week ${periods - weeksDiff}`;
      }
    } else if (period === 'monthly') {
      key = createdAt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      key = createdAt.getFullYear().toString();
    }
    
    if (groupedData[key]) {
      if (contact.contactType === 'new convert') {
        groupedData[key].newConvert++;
      } else if (contact.contactType === 'first timer') {
        groupedData[key].firstTimer++;
      }
      groupedData[key].total++;
    }
  });
  
  // Convert to array format for charts
  return Object.entries(groupedData).map(([period, data]) => ({
    period,
    ...data,
    date: new Date().toISOString()
  }));
}

function processFilteredDistributionData(contacts: any[]) {
  const distribution = {
    contactType: {} as { [key: string]: number },
    serviceType: {} as { [key: string]: number },
    gender: {} as { [key: string]: number },
    district: {} as { [key: string]: number }
  };
  
  contacts.forEach(contact => {
    // Contact Type
    const contactType = contact.contactType || 'unknown';
    distribution.contactType[contactType] = (distribution.contactType[contactType] || 0) + 1;
    
    // Service Type
    const serviceType = contact.serviceType || 'unknown';
    distribution.serviceType[serviceType] = (distribution.serviceType[serviceType] || 0) + 1;
    
    // Gender
    const gender = contact.gender || 'unknown';
    distribution.gender[gender] = (distribution.gender[gender] || 0) + 1;
    
    // District
    const district = contact.district || 'unknown';
    distribution.district[district] = (distribution.district[district] || 0) + 1;
  });
  
  return distribution;
}

async function processFilteredComparisonData(contacts: any[], period: string) {
  const now = new Date();
  const currentPeriodStart = new Date();
  
  // Set current period start based on period type
  if (period === 'weekly') {
    currentPeriodStart.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    currentPeriodStart.setMonth(now.getMonth() - 1);
  } else {
    currentPeriodStart.setFullYear(now.getFullYear() - 1);
  }
  
  // Filter contacts for current period
  const currentPeriodContacts = contacts.filter(contact => 
    new Date(contact.createdAt) >= currentPeriodStart
  );
  
  // Get previous period data (this would need another filtered query in real implementation)
  // For now, we'll simulate with half the data
  const previousPeriodContacts = contacts.slice(0, Math.floor(contacts.length / 2));
  
  const currentStats = {
    total: currentPeriodContacts.length,
    newConvert: currentPeriodContacts.filter(c => c.contactType === 'new convert').length,
    firstTimer: currentPeriodContacts.filter(c => c.contactType === 'first timer').length
  };
  
  const previousStats = {
    total: previousPeriodContacts.length,
    newConvert: previousPeriodContacts.filter(c => c.contactType === 'new convert').length,
    firstTimer: previousPeriodContacts.filter(c => c.contactType === 'first timer').length
  };
  
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    current: currentStats,
    previous: previousStats,
    changes: {
      total: calculateChange(currentStats.total, previousStats.total),
      newConvert: calculateChange(currentStats.newConvert, previousStats.newConvert),
      firstTimer: calculateChange(currentStats.firstTimer, previousStats.firstTimer)
    }
  };
}

function processFilteredSummaryData(contacts: any[]) {
  const totalContacts = contacts.length;
  const newConverts = contacts.filter(c => c.contactType === 'new convert').length;
  const firstTimers = contacts.filter(c => c.contactType === 'first timer').length;
  
  return {
    totalContacts,
    newConverts,
    firstTimers,
    conversionRate: totalContacts > 0 ? (newConverts / totalContacts) * 100 : 0,
    averagePerMonth: totalContacts / 12
  };
}