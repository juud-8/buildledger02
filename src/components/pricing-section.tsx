"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const pricingTiers = [
  {
    name: "Solo",
    price: "$29",
    period: "/ month",
    description: "For the individual contractor getting started.",
    features: ["Up to 20 invoices/month", "Time tracking", "Client management", "Online payments"],
    cta: "Choose Solo",
    popular: false,
  },
  {
    name: "Crew",
    price: "$59",
    period: "/ month",
    description: "For growing teams that need more power.",
    features: [
      "Unlimited invoices",
      "Multi-user access (3 users)",
      "Project collaboration",
      "Advanced reporting",
      "Priority support",
    ],
    cta: "Choose Crew",
    popular: true,
  },
  {
    name: "Business",
    price: "Contact Us",
    period: "",
    description: "For established businesses with custom needs.",
    features: [
      "Everything in Crew",
      "Unlimited users",
      "Custom integrations",
      "Dedicated account manager",
      "API access",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-white/30 dark:bg-black/30 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Find the Right Plan for Your Business</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Simple, transparent pricing. No hidden fees.</p>
        </div>
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border ${
                tier.popular
                  ? "border-yellow-500 bg-white/70 dark:bg-gray-900/70"
                  : "border-white/20 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60"
              } backdrop-blur-md shadow-xl flex flex-col`}
            >
              {tier.popular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold">{tier.name}</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{tier.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-500 dark:text-gray-400">{tier.period}</span>
              </div>
              <ul className="mt-8 space-y-4 flex-grow">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className={`w-full mt-8 ${
                  tier.popular
                    ? "bg-gray-800 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    : "bg-gray-700 text-white hover:bg-gray-600 dark:bg-gray-300 dark:text-gray-900 dark:hover:bg-gray-400"
                }`}
                onClick={() => {
                  if (tier.name === 'Business') {
                    window.location.href = 'mailto:support@buildledger.com?subject=Business Plan Inquiry'
                  } else {
                    window.location.href = '/auth/signup'
                  }
                }}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 