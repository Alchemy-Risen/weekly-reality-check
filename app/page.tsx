export default function Home() {
  return (
    <div className="min-h-screen bg-white px-6 py-24 font-mono">
      <main className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-black">
          Weekly Reality Check
        </h1>

        <div className="space-y-6 text-lg leading-relaxed text-zinc-700">
          <p>
            Every week, you'll get an email. You'll answer some questions. Numbers first, then words.
          </p>

          <p>
            No dashboards. No goals. No coaching. No motivation.
          </p>

          <p>
            Just a forced moment to look at what's actually happening, not what you wish was happening.
          </p>

          <p className="border-l-4 border-zinc-300 pl-4 italic">
            "This app feels uncomfortable but useful."
          </p>

          <div className="mt-12 border-t border-zinc-200 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
              What you get:
            </h2>
            <ul className="space-y-2 text-zinc-700">
              <li>→ Weekly email with a 5-minute check-in</li>
              <li>→ Required numeric inputs (revenue, hours, whatever matters)</li>
              <li>→ Rotating questions that make you think</li>
              <li>→ AI summary of patterns (no advice)</li>
              <li>→ Monday follow-up email</li>
            </ul>
          </div>

          <div className="mt-12 border-t border-zinc-200 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-black">
              What you won't get:
            </h2>
            <ul className="space-y-2 text-zinc-700">
              <li>✗ Task management</li>
              <li>✗ Goal tracking</li>
              <li>✗ Charts or analytics</li>
              <li>✗ Motivational quotes</li>
              <li>✗ Productivity tips</li>
              <li>✗ Anything to make you feel better</li>
            </ul>
          </div>

          <div className="mt-16">
            <form className="space-y-4">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full border-b-2 border-zinc-300 bg-transparent px-2 py-3 font-mono text-lg focus:border-black focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-black px-8 py-4 font-mono text-lg text-white transition-colors hover:bg-zinc-800"
              >
                Start checking in
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
