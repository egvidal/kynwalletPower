import type { ReactNode } from 'react';
import { BrandPanel } from '@/ui/layout/BrandPanel/BrandPanel';
import styles from './LoginScreen.module.css';

export function LoginScreen({ children }: { children: ReactNode }) {
  return (
    <div className={styles.screen}>
      <BrandPanel />
      <main className={styles.formPanel}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
