import Footer from '@/app/components/Footer'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-24 font-mono">
      <main className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-black">
          Check Your Email
        </h1>

        <div className="space-y-6 text-lg leading-relaxed text-zinc-700">
          <p>
            We&apos;ve sent you a magic link to start your first check-in.
          </p>

          <p>
            Click the link in the email to get started. It expires in 7 days.
          </p>

          <div className="mt-12 border-t border-zinc-200 pt-8">
            <p className="text-base text-zinc-600">
              Didn&apos;t get the email? Check your spam folder. Still nothing? Email us at hello@weeklyrealitycheck.com
            </p>
          </div>

          <Footer />
        </div>
      </main>
    </div>
  )
}
