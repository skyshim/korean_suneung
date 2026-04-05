"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { name: "지문학습", href: "/" },
  { name: "단어장", href: "/vocabulary" },
  { name: "퀴즈", href: "/quiz" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#1e3a5f] p-4 fixed w-full z-10 top-0 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          수능 국어
        </Link>
        <div className="flex space-x-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                "text-white hover:text-gray-300 transition-colors duration-200",
                {
                  "font-bold border-b-2 border-white": pathname.startsWith(link.href),
                }
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
