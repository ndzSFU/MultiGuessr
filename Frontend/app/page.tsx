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
          width: 420,
          maxWidth: '90%',
          padding: '2.2rem',
          borderRadius: 14,
          background: 'rgba(17, 24, 39, 0.75)',
          boxShadow: '0 8px 24px rgba(105, 101, 101, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '2.8rem', letterSpacing: '0.5px', color: '#f9fafb', fontWeight: 800 }}>MultiGuessr</h1>
        <p style={{ marginTop: '0.3rem', marginBottom: '1.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>Guess the city, beat your friends.</p>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.7rem', justifyContent: 'center' }}>
          <Link href="/Map">
            <button className="landing-button">
              Practice
            </button>
          </Link>

          <Link href="/Multiplayer">
            <button className="landing-button primary">
              Multiplayer
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
