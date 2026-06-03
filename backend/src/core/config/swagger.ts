import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HR Platform API',
      version: '4.0.0',
      description: 'Корпоративная платформа управления персоналом. Полная документация всех API endpoints.',
      contact: {
        name: 'NLP-Core-Team',
        email: 'support@hr-platform.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.hr-platform.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен авторизации',
        },
      },
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            position: { type: 'string' },
            departmentId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['active', 'on_leave', 'business_trip', 'fired', 'archived'] },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['new', 'in_progress', 'approved', 'done', 'rejected', 'overdue'] },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
            assigneeId: { type: 'string', format: 'uuid' },
            dueDate: { type: 'string', format: 'date' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['planning', 'active', 'completed', 'archived'] },
          },
        },
        WorkflowRoute: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            entityType: { type: 'string' },
            steps: { type: 'array', items: { type: 'object' } },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['it', 'hardware', 'household', 'repair', 'other'] },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed', 'cancelled'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Аутентификация и авторизация' },
      { name: 'Employees', description: 'Управление сотрудниками' },
      { name: 'Departments', description: 'Управление подразделениями' },
      { name: 'Projects', description: 'Управление проектами' },
      { name: 'Tasks', description: 'Управление задачами' },
      { name: 'Workflow', description: 'Система согласований' },
      { name: 'Delegation', description: 'Делегирование и заместители' },
      { name: 'Resolutions', description: 'Резолюции к документам' },
      { name: 'Service Desk', description: 'IT-поддержка и заявки' },
      { name: 'Files', description: 'Управление файлами' },
      { name: 'Calendar', description: 'Календарь событий' },
      { name: 'Reports', description: 'Отчёты и аналитика' },
      { name: 'Notifications', description: 'Уведомления' },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/**/*.docs.ts',
  ],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export default swaggerSpec;
