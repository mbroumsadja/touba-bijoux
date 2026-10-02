'use client';

import dynamic from 'next/dynamic';

// Le site est une application 100 % navigateur (état local, hash #gerant, localStorage) :
// on la charge côté client uniquement, comme avec Vite.
const App = dynamic(() => import('../App'), { ssr: false });

export default function ClientApp() {
  return <App />;
}
