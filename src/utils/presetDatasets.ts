/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../types';
import { inferSchema } from './dataParser';

const SaaSPerformanceRows = [
  { Date: '2025-07-01', Month: 'Jul 2025', MRR: 45000, Revenue: 51200, ChurnRate: 2.1, ActiveUsers: 12000, MarketingSpend: 8000, NewSignups: 450, Region: 'North America' },
  { Date: '2025-08-01', Month: 'Aug 2025', MRR: 48000, Revenue: 53100, ChurnRate: 1.9, ActiveUsers: 12800, MarketingSpend: 8500, NewSignups: 510, Region: 'North America' },
  { Date: '2025-09-01', Month: 'Sep 2025', MRR: 52000, Revenue: 56900, ChurnRate: 2.3, ActiveUsers: 14100, MarketingSpend: 9200, NewSignups: 620, Region: 'North America' },
  { Date: '2025-10-01', Month: 'Oct 2025', MRR: 56000, Revenue: 61800, ChurnRate: 1.7, ActiveUsers: 15500, MarketingSpend: 10000, NewSignups: 710, Region: 'Europe' },
  { Date: '2025-11-01', Month: 'Nov 2025', MRR: 61000, Revenue: 68100, ChurnRate: 1.5, ActiveUsers: 17200, MarketingSpend: 11000, NewSignups: 820, Region: 'Europe' },
  { Date: '2025-12-01', Month: 'Dec 2025', MRR: 67000, Revenue: 77200, ChurnRate: 2.5, ActiveUsers: 19800, MarketingSpend: 15000, NewSignups: 1100, Region: 'Europe' },
  { Date: '2026-01-01', Month: 'Jan 2026', MRR: 72000, Revenue: 81400, ChurnRate: 1.3, ActiveUsers: 21500, MarketingSpend: 13000, NewSignups: 980, Region: 'Asia' },
  { Date: '2026-02-01', Month: 'Feb 2026', MRR: 78000, Revenue: 87500, ChurnRate: 1.2, ActiveUsers: 23100, MarketingSpend: 14000, NewSignups: 1050, Region: 'Asia' },
  { Date: '2026-03-01', Month: 'Mar 2026', MRR: 85000, Revenue: 95400, ChurnRate: 1.1, ActiveUsers: 25400, MarketingSpend: 15000, NewSignups: 1210, Region: 'Asia' },
  { Date: '2026-04-01', Month: 'Apr 2026', MRR: 91000, Revenue: 101800, ChurnRate: 1.4, ActiveUsers: 27100, MarketingSpend: 16500, NewSignups: 1150, Region: 'North America' },
  { Date: '2026-05-01', Month: 'May 2026', MRR: 97000, Revenue: 108300, ChurnRate: 1.0, ActiveUsers: 29200, MarketingSpend: 17000, NewSignups: 1300, Region: 'Europe' },
  { Date: '2026-06-01', Month: 'Jun 2026', MRR: 105000, Revenue: 118900, ChurnRate: 0.9, ActiveUsers: 31500, MarketingSpend: 19000, NewSignups: 1480, Region: 'Asia' }
];

const ClimateIndicatorRows = [
  { Year: 2015, TempAnomaly: 0.90, CO2PPM: 399.6, SeaLevelRise: 78.4, ForestLossIndex: 5.4, RenewablesShare: 19.1 },
  { Year: 2016, TempAnomaly: 1.02, CO2PPM: 401.9, SeaLevelRise: 82.1, ForestLossIndex: 6.2, RenewablesShare: 19.8 },
  { Year: 2017, TempAnomaly: 0.92, CO2PPM: 404.2, SeaLevelRise: 85.3, ForestLossIndex: 5.9, RenewablesShare: 20.4 },
  { Year: 2018, TempAnomaly: 0.85, CO2PPM: 406.4, SeaLevelRise: 88.7, ForestLossIndex: 5.1, RenewablesShare: 21.1 },
  { Year: 2019, TempAnomaly: 0.98, CO2PPM: 409.8, SeaLevelRise: 93.1, ForestLossIndex: 5.7, RenewablesShare: 21.9 },
  { Year: 2020, TempAnomaly: 1.02, CO2PPM: 412.5, SeaLevelRise: 96.8, ForestLossIndex: 6.1, RenewablesShare: 22.8 },
  { Year: 2021, TempAnomaly: 0.85, CO2PPM: 414.7, SeaLevelRise: 100.2, ForestLossIndex: 5.3, RenewablesShare: 23.6 },
  { Year: 2022, TempAnomaly: 0.89, CO2PPM: 417.2, SeaLevelRise: 103.5, ForestLossIndex: 4.8, RenewablesShare: 24.5 },
  { Year: 2023, TempAnomaly: 1.15, CO2PPM: 419.8, SeaLevelRise: 108.1, ForestLossIndex: 5.8, RenewablesShare: 25.8 },
  { Year: 2024, TempAnomaly: 1.22, CO2PPM: 422.4, SeaLevelRise: 112.5, ForestLossIndex: 6.5, RenewablesShare: 27.2 },
  { Year: 2025, TempAnomaly: 1.25, CO2PPM: 425.1, SeaLevelRise: 116.9, ForestLossIndex: 6.8, RenewablesShare: 29.0 }
];

const ECommerceTransactionRows = [
  { Category: 'Electronics', Sales: 125000, Quantity: 4200, Profit: 37500, Rating: 4.5, Segment: 'Consumer' },
  { Category: 'Electronics', Sales: 84000, Quantity: 1800, Profit: 24200, Rating: 4.2, Segment: 'Corporate' },
  { Category: 'Electronics', Sales: 41000, Quantity: 950, Profit: 11800, Rating: 4.4, Segment: 'Home Office' },
  { Category: 'Apparel & Fashion', Sales: 98000, Quantity: 8100, Profit: 41000, Rating: 4.1, Segment: 'Consumer' },
  { Category: 'Apparel & Fashion', Sales: 42000, Quantity: 3100, Profit: 18400, Rating: 3.9, Segment: 'Corporate' },
  { Category: 'Apparel & Fashion', Sales: 18000, Quantity: 1400, Profit: 7200, Rating: 4.3, Segment: 'Home Office' },
  { Category: 'Home & Kitchen', Sales: 71000, Quantity: 2900, Profit: 18200, Rating: 4.3, Segment: 'Consumer' },
  { Category: 'Home & Kitchen', Sales: 53000, Quantity: 1950, Profit: 14100, Rating: 4.1, Segment: 'Corporate' },
  { Category: 'Home & Kitchen', Sales: 26000, Quantity: 1100, Profit: 6800, Rating: 4.2, Segment: 'Home Office' },
  { Category: 'Books & Stationery', Sales: 31000, Quantity: 6100, Profit: 12500, Rating: 4.7, Segment: 'Consumer' },
  { Category: 'Books & Stationery', Sales: 21000, Quantity: 3900, Profit: 8100, Rating: 4.6, Segment: 'Corporate' },
  { Category: 'Books & Stationery', Sales: 14500, Quantity: 2200, Profit: 5900, Rating: 4.5, Segment: 'Home Office' },
  { Category: 'Sports & Outdoors', Sales: 59000, Quantity: 2400, Profit: 15300, Rating: 4.4, Segment: 'Consumer' },
  { Category: 'Sports & Outdoors', Sales: 34000, Quantity: 1350, Profit: 8900, Rating: 4.1, Segment: 'Corporate' },
  { Category: 'Sports & Outdoors', Sales: 19000, Quantity: 800, Profit: 5100, Rating: 4.2, Segment: 'Home Office' }
];

const FitnessActivityRows = [
  { Date: '2026-05-25', Weekday: 'Mon', Steps: 10420, CaloriesBurned: 2450, ActiveMinutes: 45, SleepQuality: 82, HeartRateAvg: 72, HydrationML: 2200 },
  { Date: '2026-05-26', Weekday: 'Tue', Steps: 8530, CaloriesBurned: 2180, ActiveMinutes: 32, SleepQuality: 74, HeartRateAvg: 70, HydrationML: 1800 },
  { Date: '2026-05-27', Weekday: 'Wed', Steps: 12100, CaloriesBurned: 2610, ActiveMinutes: 58, SleepQuality: 88, HeartRateAvg: 76, HydrationML: 2500 },
  { Date: '2026-05-28', Weekday: 'Thu', Steps: 6200, CaloriesBurned: 1950, ActiveMinutes: 24, SleepQuality: 68, HeartRateAvg: 68, HydrationML: 1500 },
  { Date: '2026-05-29', Weekday: 'Fri', Steps: 11300, CaloriesBurned: 2520, ActiveMinutes: 50, SleepQuality: 79, HeartRateAvg: 73, HydrationML: 2100 },
  { Date: '2026-05-30', Weekday: 'Sat', Steps: 14800, CaloriesBurned: 2950, ActiveMinutes: 75, SleepQuality: 92, HeartRateAvg: 79, HydrationML: 3000 },
  { Date: '2026-05-31', Weekday: 'Sun', Steps: 9800, CaloriesBurned: 2310, ActiveMinutes: 40, SleepQuality: 85, HeartRateAvg: 71, HydrationML: 2000 },
  { Date: '2026-06-01', Weekday: 'Mon', Steps: 11100, CaloriesBurned: 2490, ActiveMinutes: 48, SleepQuality: 81, HeartRateAvg: 74, HydrationML: 2300 },
  { Date: '2026-06-02', Weekday: 'Tue', Steps: 9100, CaloriesBurned: 2220, ActiveMinutes: 35, SleepQuality: 78, HeartRateAvg: 71, HydrationML: 1900 },
  { Date: '2026-06-03', Weekday: 'Wed', Steps: 13400, CaloriesBurned: 2780, ActiveMinutes: 62, SleepQuality: 89, HeartRateAvg: 77, HydrationML: 2600 },
  { Date: '2026-06-04', Weekday: 'Thu', Steps: 7800, CaloriesBurned: 2080, ActiveMinutes: 28, SleepQuality: 72, HeartRateAvg: 69, HydrationML: 1700 },
  { Date: '2026-06-05', Weekday: 'Fri', Steps: 12500, CaloriesBurned: 2650, ActiveMinutes: 52, SleepQuality: 83, HeartRateAvg: 75, HydrationML: 2400 },
  { Date: '2026-06-06', Weekday: 'Sat', Steps: 15300, CaloriesBurned: 3100, ActiveMinutes: 80, SleepQuality: 90, HeartRateAvg: 81, HydrationML: 3200 },
  { Date: '2026-06-07', Weekday: 'Sun', Steps: 10100, CaloriesBurned: 2380, ActiveMinutes: 42, SleepQuality: 86, HeartRateAvg: 72, HydrationML: 2100 }
];

export const PRESET_DATASETS: Dataset[] = [
  {
    id: 'saas_metrics',
    name: 'SaaS SaaS Business Performance Metrics',
    rows: SaaSPerformanceRows,
    columns: inferSchema(SaaSPerformanceRows),
    source: 'preset'
  },
  {
    id: 'climate_trends',
    name: 'Global Climate Indicator Trends',
    rows: ClimateIndicatorRows,
    columns: inferSchema(ClimateIndicatorRows),
    source: 'preset'
  },
  {
    id: 'ecommerce_sales',
    name: 'E-Commerce Breakdown Matrix',
    rows: ECommerceTransactionRows,
    columns: inferSchema(ECommerceTransactionRows),
    source: 'preset'
  },
  {
    id: 'fitness_tracker',
    name: 'Fitness & Daily Activity Tracker',
    rows: FitnessActivityRows,
    columns: inferSchema(FitnessActivityRows),
    source: 'preset'
  }
];
