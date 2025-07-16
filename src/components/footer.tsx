import Link from "next/link"
import Image from "next/image"
import { Twitter, Linkedin, Facebook } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-12 px-4 md:px-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
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
          <p className="text-gray-500 dark:text-gray-400">Invoicing software for the modern tradesperson.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
              <Facebook className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white">Product</h4>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                href="#features"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                href="#pricing"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="#testimonials"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              >
                Testimonials
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white">Company</h4>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                Careers
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white">Legal</h4>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} BuildLedger. All rights reserved.</p>
      </div>
    </footer>
  )
} 