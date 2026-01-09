export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // TODO: Validate token and get user/week info
  // For now, just show the form

  return (
    <div className="min-h-screen bg-white px-6 py-12 font-mono">
      <main className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-black">
            Weekly Check-In
          </h1>
          <p className="text-zinc-600">Week 1 of 12-week cycle</p>
        </div>

        <form className="space-y-12">
          {/* Numeric Inputs Section */}
          <section className="space-y-6">
            <h2 className="border-b border-zinc-300 pb-2 text-xl font-semibold text-black">
              Numbers
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="revenue"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Revenue this week ($)
                </label>
                <input
                  type="number"
                  id="revenue"
                  name="revenue"
                  required
                  className="w-full border-b-2 border-zinc-300 bg-transparent px-2 py-2 text-lg focus:border-black focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label
                  htmlFor="hours"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Hours worked
                </label>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  required
                  className="w-full border-b-2 border-zinc-300 bg-transparent px-2 py-2 text-lg focus:border-black focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label
                  htmlFor="satisfaction"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Overall satisfaction (1-10)
                </label>
                <input
                  type="number"
                  id="satisfaction"
                  name="satisfaction"
                  min="1"
                  max="10"
                  required
                  className="w-full border-b-2 border-zinc-300 bg-transparent px-2 py-2 text-lg focus:border-black focus:outline-none"
                  placeholder="1-10"
                />
              </div>

              <div>
                <label
                  htmlFor="energy"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Energy level (1-10)
                </label>
                <input
                  type="number"
                  id="energy"
                  name="energy"
                  min="1"
                  max="10"
                  required
                  className="w-full border-b-2 border-zinc-300 bg-transparent px-2 py-2 text-lg focus:border-black focus:outline-none"
                  placeholder="1-10"
                />
              </div>
            </div>
          </section>

          {/* Rotating Questions Section */}
          <section className="space-y-6">
            <h2 className="border-b border-zinc-300 pb-2 text-xl font-semibold text-black">
              This Week's Questions
            </h2>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="q1"
                  className="mb-3 block text-base font-medium text-black"
                >
                  What decision are you avoiding?
                </label>
                <textarea
                  id="q1"
                  name="q1"
                  required
                  rows={4}
                  className="w-full border border-zinc-300 bg-transparent px-3 py-2 text-base focus:border-black focus:outline-none"
                  placeholder="Be honest..."
                />
              </div>

              <div>
                <label
                  htmlFor="q2"
                  className="mb-3 block text-base font-medium text-black"
                >
                  What feels harder than it should?
                </label>
                <textarea
                  id="q2"
                  name="q2"
                  required
                  rows={4}
                  className="w-full border border-zinc-300 bg-transparent px-3 py-2 text-base focus:border-black focus:outline-none"
                  placeholder="Be honest..."
                />
              </div>
            </div>
          </section>

          {/* Optional Context */}
          <section className="space-y-6">
            <h2 className="border-b border-zinc-300 pb-2 text-xl font-semibold text-black">
              Context (optional)
            </h2>

            <div>
              <label
                htmlFor="context"
                className="mb-3 block text-sm text-zinc-600"
              >
                Anything else you need to capture?
              </label>
              <textarea
                id="context"
                name="context"
                rows={6}
                className="w-full border border-zinc-300 bg-transparent px-3 py-2 text-base focus:border-black focus:outline-none"
                placeholder="No structure, just dump it here..."
              />
            </div>
          </section>

          {/* Submit */}
          <div className="border-t border-zinc-200 pt-8">
            <button
              type="submit"
              className="w-full bg-black px-8 py-4 text-lg text-white transition-colors hover:bg-zinc-800"
            >
              Submit Check-In
            </button>
            <p className="mt-4 text-center text-sm text-zinc-500">
              You'll get an immediate summary, then a follow-up on Monday.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
