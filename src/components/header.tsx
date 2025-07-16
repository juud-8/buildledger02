"use client"

import Link from "next/link"
import Image from "next/image"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

export default function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="py-6 px-4 md:px-8 lg:px-16">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/buildledger-icon.svg" 
            alt="BuildLedger Logo" 
            width={32} 
            height={32}
            className="w-8 h-8" 
          />
          <span className="text-2xl font-bold text-gray-800 dark:text-white">BuildLedger</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Features
          </Link>
          <Link href="#testimonials" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Testimonials
          </Link>
          <Link href="#pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Link href="/auth/signup">
            <Button className="hidden sm:inline-flex bg-gray-800 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
} 