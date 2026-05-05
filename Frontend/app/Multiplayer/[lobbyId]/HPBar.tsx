interface HPBarProps {
    label: string;
    hp: number | null;
    maxHp: number;
    position: 'left' | 'right';
}

export default function HPBar({ label, hp, maxHp, position}: HPBarProps) {
    const currentHp = hp ?? maxHp;
    const hpPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
    
    // Determine color based on HP percentage
    let barColor = '#22c55e'; // green
    if (hpPercentage < 50) barColor = '#eab308'; // yellow
    if (hpPercentage < 25) barColor = '#ef4444'; // red

    return (
        <div
            style={{
                position: 'fixed',
                top: '1rem',
                [position === 'left' ? 'left' : 'right']: '1rem',
                background: '#1f2937',
                border: '2px solid #374151',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                minWidth: '200px',
                zIndex: 1000,
            }}
        >
            <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>
                HP: <span style={{ color: barColor }}>{currentHp}</span> / {maxHp}
            </div>
            <div
                style={{
                    width: '100%',
                    height: '24px',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '0.25rem',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${hpPercentage}%`,
                        background: barColor,
                        transition: 'width 0.3s ease, background-color 0.3s ease',
                    }}
                />
            </div>
        </div>
    );
}
