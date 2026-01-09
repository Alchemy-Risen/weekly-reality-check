import { getSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Footer from '@/app/components/Footer'

export default async function CompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params

  // Fetch the check-in data
  const supabase = getSupabaseClient()
  const { data: checkIn, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !checkIn) {
    notFound()
  }

  const { numeric_data, narrative_data } = checkIn

  return (
    <div className="min-h-screen bg-white px-6 py-12 font-mono">
      <main className="mx-auto max-w-2xl">
        <div className="mb-12">
          <h1 className="mb-3 text-3xl font-bold text-black">Check-In Submitted</h1>
          <p className="text-lg text-zinc-600">
            You'll get a follow-up email on Monday.
          </p>
        </div>

        {/* Summary of what was submitted */}
        <div className="space-y-8 border-t border-zinc-200 pt-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-black">
              Your Numbers This Week
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l-2 border-zinc-300 pl-4">
                <div className="text-sm text-zinc-600">Revenue</div>
                <div className="text-2xl font-semibold text-black">
                  ${numeric_data.revenue.toLocaleString()}
                </div>
              </div>
              <div className="border-l-2 border-zinc-300 pl-4">
                <div className="text-sm text-zinc-600">Hours</div>
                <div className="text-2xl font-semibold text-black">
                  {numeric_data.hours}
                </div>
              </div>
              <div className="border-l-2 border-zinc-300 pl-4">
                <div className="text-sm text-zinc-600">Satisfaction</div>
                <div className="text-2xl font-semibold text-black">
                  {numeric_data.satisfaction}/10
                </div>
              </div>
              <div className="border-l-2 border-zinc-300 pl-4">
                <div className="text-sm text-zinc-600">Energy</div>
                <div className="text-2xl font-semibold text-black">
                  {numeric_data.energy}/10
                </div>
              </div>
            </div>
          </section>

          {/* AI Summary placeholder */}
          <section className="border-t border-zinc-200 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
              Pattern Summary
            </h2>
            {checkIn.ai_summary ? (
              <div className="border-l-4 border-zinc-300 bg-zinc-50 p-4 text-base leading-relaxed text-zinc-700">
                {checkIn.ai_summary}
              </div>
            ) : (
              <div className="border-l-4 border-zinc-300 bg-zinc-50 p-4 text-base leading-relaxed text-zinc-600">
                AI summary will be generated and sent to your email within a few minutes.
              </div>
            )}
          </section>

          {/* What happens next */}
          <section className="border-t border-zinc-200 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
              What Happens Next
            </h2>
            <ul className="space-y-3 text-zinc-700">
              <li className="flex items-start">
                <span className="mr-3 text-zinc-400">→</span>
                <span>
                  You'll receive an email with your full summary and pattern analysis
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-zinc-400">→</span>
                <span>
                  On Monday, you'll get a follow-up email with your week's data
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-zinc-400">→</span>
                <span>
                  Next week, you'll receive another check-in link at the same time
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-zinc-200 pt-8 text-center">
            <p className="text-sm text-zinc-500">
              You can close this page now.
            </p>
          </div>

          <Footer />
        </div>
      </main>
    </div>
  )
}
