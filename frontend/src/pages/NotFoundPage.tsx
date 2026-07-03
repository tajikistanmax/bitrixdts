import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="text-[110px] leading-none font-extrabold bg-gradient-to-br from-primary-500 to-primary-700 bg-clip-text text-transparent">
        404
      </div>
      <h1 className="mt-2 text-xl font-semibold text-ink-800 dark:text-ink-100">Страница не найдена</h1>
      <p className="mt-1 text-sm text-ink-500 max-w-sm">
        Возможно, ссылка устарела или раздел ещё в разработке.
      </p>
      <Link to="/" className="mt-6">
        <Button>На главную</Button>
      </Link>
    </div>
  );
}
