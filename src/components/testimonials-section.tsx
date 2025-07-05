import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "John Carter",
    title: "General Contractor, Carter Construction",
    quote:
      "BuildLedger has cut my invoicing time in half. It's so intuitive and my clients love the professional look of the invoices. Getting paid on time has never been easier.",
    avatar: "/man-in-hard-hat.png",
  },
  {
    name: "Maria Garcia",
    title: "Electrician, Spark Bright Electrical",
    quote:
      "As a solo electrician, managing paperwork was a nightmare. BuildLedger is a lifesaver. I can track my hours and send invoices right from the job site.",
    avatar: "/woman-electrician.png",
  },
  {
    name: "David Lee",
    title: "Plumber, Precision Plumbing",
    quote:
      "The online payment feature is a game-changer. Most of my clients pay the same day I send the invoice. My cash flow has improved dramatically.",
    avatar: "/plumber-fixing-pipe.png",
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Trusted by Tradespeople Like You</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Hear what our customers have to say about how BuildLedger has transformed their business.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-gray-800/50"
            >
              <p className="text-gray-700 dark:text-gray-300 italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 