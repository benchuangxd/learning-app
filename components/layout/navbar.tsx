'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, BarChart3, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function Navbar(): React.ReactElement {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/questions',
      label: 'Questions',
      icon: Library,
    },
    {
      href: '/study',
      label: 'Study',
      icon: BookOpen,
    },
    {
      href: '/statistics',
      label: 'Statistics',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/logo.png"
              alt="Learning App Logo"
              width={35}
              height={35}
              className="rounded-xl shadow-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
          </Link>

          {/* Navigation Links & Theme Toggle */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn('gap-2', isActive && 'pointer-events-none')}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
