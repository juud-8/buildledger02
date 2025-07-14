"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-800 to-gray-600 dark:from-white dark:to-gray-400">
            Invoicing Made Simple for the Trades
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300">
            BuildLedger helps contractors, freelancers, and tradespeople create professional invoices in seconds. Get
            paid faster and manage your finances with ease.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-gray-800 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              onClick={() => window.location.href = '/auth/signup'}
            >
              Start Your Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="dark:border-gray-600 dark:hover:bg-gray-800 bg-transparent"
              onClick={() => window.location.href = '/auth/login'}
            >
              Log In
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="dark:border-gray-600 dark:hover:bg-gray-800 bg-transparent"
              onClick={() => alert('Demo video coming soon!')}
            >
              Watch Demo
            </Button>
          </div>
        </div>
        <div className="mt-16">
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-20 blur-2xl"></div>
            <div className="relative bg-white/60 dark:bg-black/60 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/20 dark:border-black/20">
              <Image
                src="/construction-invoicing-dashboard.png"
                alt="BuildLedger Dashboard"
                width={1200}
                height={675}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 