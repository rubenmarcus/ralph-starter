import React from 'react';
import AIToggle from '@site/src/components/AIToggle';

export default function Root({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      {children}
      <AIToggle />
    </>
  );
}
