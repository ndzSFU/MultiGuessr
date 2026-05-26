import Link from 'next/link';

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: "url('/main_menu_background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        style={{
          width: 360,
          maxWidth: '92%',
          padding: '2.5rem',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 10px 30px rgba(2,6,23,0.4)',
          backdropFilter: 'blur(6px)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '0.6px', color: '#0b1220' }}>MultiGuessr</h1>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.25rem', color: '#111827' }}>Guess the city, beat your friends.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <Link href="/Map">
            <button className="landing-button"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: 8,
                border: '2px solid rgba(11,17,34,0.08)',
                cursor: 'pointer',
                fontWeight: 700,
                background: 'transparent',
                color: '#0b1220',
              }}
            >
              Single Player
            </button>
          </Link>

          <Link href="/Multiplayer">
            <button className="landing-button"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                background: 'linear-gradient(90deg,#06b6d4,#3b82f6)',
                color: 'white',
                boxShadow: '0 6px 18px rgba(59,130,246,0.25)',
              }}
            >
              Multiplayer
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
