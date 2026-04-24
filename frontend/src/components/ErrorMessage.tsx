interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
      <p className="font-medium">Error al cargar datos</p>
      <p className="text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm underline hover:no-underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}