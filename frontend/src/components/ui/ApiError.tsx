interface ApiErrorProps {
  message?: string;
}

/**
 * Muestra un mensaje de error estandarizado para fallos de API.
 */
export default function ApiError({ message = 'Something went wrong.' }: ApiErrorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto my-16 p-8 text-center bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-xl font-semibold text-red-800">Oops! Could not load content.</h3>
      <p className="text-red-600 mt-2">{message}</p>
      <p className="text-gray-500 text-sm mt-4">Please check your connection or try again later.</p>
    </div>
  );
}
