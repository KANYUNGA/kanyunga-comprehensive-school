import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <header className="bg-green-800 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Kanyunga Comprehensive School
            </h1>
            <p className="mt-1 text-sm text-green-100">
              Buuri West Sub-County, Meru County, Kenya
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-green-800 hover:bg-green-50"
          >
            Staff Login
          </Link>
        </div>
      </header>

      <section className="bg-green-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <p className="font-semibold uppercase tracking-wider text-green-800">
            Welcome to our school
          </p>

          <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
            Learning, Growing and Building a Brighter Future
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Kanyunga Comprehensive School is located in Buuri West
            Sub-County, Meru County, Kenya. We are committed to supporting
            learners in their education, skills development and personal growth.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Staff Login
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
        <article className="rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-green-800">
            Learning
          </h3>
          <p className="mt-3 leading-7 text-gray-600">
            Supporting learners as they develop knowledge, understanding and
            practical skills.
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-green-800">
            Talent and Growth
          </h3>
          <p className="mt-3 leading-7 text-gray-600">
            Encouraging learners to develop their abilities, confidence and
            responsibility.
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-green-800">
            School Community
          </h3>
          <p className="mt-3 leading-7 text-gray-600">
            Working towards a supportive learning environment for learners,
            families and the wider community.
          </p>
        </article>
      </section>

      <footer className="bg-gray-100 px-6 py-8 text-center text-sm text-gray-600">
        <p className="font-semibold">Kanyunga Comprehensive School</p>
        <p className="mt-2">
          Buuri West Sub-County, Meru County, Kenya
        </p>
        <p className="mt-3">
          © {new Date().getFullYear()} Kanyunga Comprehensive School
        </p>
      </footer>
    </main>
  )
}
