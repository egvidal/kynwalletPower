import type { ReactNode } from 'react';
import { BrandPanel } from '@/ui/layout/BrandPanel/BrandPanel';
import styles from './AuthLayout.module.css';

type AuthLayoutProps = {
  brandTitle: ReactNode;
  brandSubtitle: string;
  children: ReactNode;
};

/** Distribución compartida por login y registro: panel de marca + formulario (research.md R10). */
export function AuthLayout({ brandTitle, brandSubtitle, children }: AuthLayoutProps) {
  return (
    <div className={styles.screen}>
      <BrandPanel title={brandTitle} subtitle={brandSubtitle} />
      <main className={styles.formPanel}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
