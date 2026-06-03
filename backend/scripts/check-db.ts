import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Проверка базы данных...\n');

  // Получаем список всех таблиц
  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`✅ Найдено таблиц: ${tables.length}\n`);
  console.log('Список таблиц:');
  console.log('─'.repeat(50));
  
  tables.forEach((table, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${table.table_name}`);
  });

  console.log('\n' + '─'.repeat(50));
  console.log('✅ База данных готова!\n');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
