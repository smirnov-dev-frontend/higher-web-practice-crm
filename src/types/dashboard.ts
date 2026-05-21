import type { Client } from './client';
import type { Deal } from './deal';
import type { Task } from './task';

export type DashboardStats = {
  clients: {
    total: number;
    today: number;
    week: number;
    month: number;
    quarter: number;
  };

  activeDeals: {
    total: number;
    today: number;
    week: number;
    month: number;
  };

  completedDeals: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
};

export type DashboardData = {
  stats: DashboardStats;

  topClients: Client[];

  recentDeals: Deal[];

  recentTasks: Task[];
};
