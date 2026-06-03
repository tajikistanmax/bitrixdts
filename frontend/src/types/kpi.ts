export interface KPIMetric {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  target?: number;
  organizationId: string;
  values: KPIMetricValue[];
}

export interface KPIMetricValue {
  id: string;
  metricId: string;
  employeeId: string;
  value: number;
  period: string;
  employee?: { id: string; fullName: string };
}
