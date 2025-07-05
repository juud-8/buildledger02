import { FileText, Clock, Users, Zap } from "lucide-react"

const features = [
  {
    icon: <FileText className="w-8 h-8 text-gray-800 dark:text-white" />,
    title: "Effortless Invoicing",
    description: "Create and send professional invoices in just a few clicks. Customize with your logo and branding.",
  },
  {
    icon: <Clock className="w-8 h-8 text-gray-800 dark:text-white" />,
    title: "Time Tracking",
    description: "Log hours for projects and automatically add them to your invoices. Never lose a billable minute.",
  },
  {
    icon: <Users className="w-8 h-8 text-gray-800 dark:text-white" />,
    title: "Client Management",
    description: "Keep all your client information organized in one place for easy access and communication.",
  },
  {
    icon: <Zap className="w-8 h-8 text-gray-800 dark:text-white" />,
    title: "Online Payments",
    description: "Get paid faster by accepting credit card and bank payments directly through your invoices.",
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-white/30 dark:bg-black/30 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run your business</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            From estimates to payments, BuildLedger provides the tools to streamline your workflow and boost your bottom
            line.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-gray-800/50 transition-transform transform hover:-translate-y-2"
            >
              <div className="flex-shrink-0">{feature.icon}</div>
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 