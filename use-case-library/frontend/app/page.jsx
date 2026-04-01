'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) { router.replace('/login'); return; }
    router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
  }, [router]);
  return null;
}
