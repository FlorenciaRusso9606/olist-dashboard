'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Fresh data for 5 minutes
            staleTime: 1000 * 60 * 5,
            // Data lives in memory for up to 10 minutes even if not used            
            gcTime: 1000 * 60 * 10,
            // Retry once on error
            retry: 1,
           
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* DevTools*/}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}