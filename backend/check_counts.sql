SELECT 'employees' as table_name, count(*) as count FROM "Employee"
UNION ALL
SELECT 'projects', count(*) FROM "Project"
UNION ALL
SELECT 'tasks', count(*) FROM "Task"
UNION ALL
SELECT 'departments', count(*) FROM "Department"
UNION ALL
SELECT 'organizations', count(*) FROM "Organization"
UNION ALL
SELECT 'chat_channels', count(*) FROM "ChatChannel"
UNION ALL
SELECT 'kpi_metrics', count(*) FROM "KPIMetric"
UNION ALL
SELECT 'documents', count(*) FROM "Document"
UNION ALL
SELECT 'notifications', count(*) FROM "Notification";
