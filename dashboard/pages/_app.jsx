import 'reactflow/dist/style.css'
import 'prismjs/themes/prism.css'
import Link from 'next/link'

export default function App({ Component, pageProps }) {
  return (
    <>
      <nav style={{ display: 'flex', gap: 12, padding: '8px 12px', borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#111827' }}>Home</Link>
        <Link href="/schema" style={{ textDecoration: 'none', color: '#111827' }}>Schema</Link>
      </nav>
      <Component {...pageProps} />
    </>
  )
}
