'use client';

import { useEffect, useState } from 'react';

interface TimerBoxProps {
    seconds: number;
    isActive: boolean;
    onExpire: () => void;
}

export default function TimerBox({ seconds, isActive, onExpire }: TimerBoxProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (isActive) {
            setTimeLeft(seconds);
        }
    }, [seconds, isActive]);

    useEffect(() => {
        if (!isActive) {
            return;
        }

        if (timeLeft <= 0) {
            onExpire();
            return;
        }

        const timerId = window.setTimeout(() => {
            setTimeLeft((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => window.clearTimeout(timerId);
    }, [isActive, timeLeft, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;

    return (
        <div
            style={{
                position: 'fixed',
                top: '3.3rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                pointerEvents: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontSize: '1.5rem',
                minWidth: '5.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
        >
            {minutes}:{remainingSeconds.toString().padStart(2, '0')}
        </div>
    );
}
