import { relative } from "path";

interface MultiplierContainerProps {
    Multiplier: string,
    top?: string,
    left?: string,
}

export default function MultiplierContainer({Multiplier, top, left}: MultiplierContainerProps){
    return(
        <div style={{
            position: "fixed",
            display: "flex",
            width: '44px', 
            height: '30px',
            top: top,
            left: left,
            transform: 'translate(-50%, -50%)',
            padding: '0.55rem 1.05rem',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.85)',
            color: 'white',
            fontWeight: "bold",
            fontSize: '1.1rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            alignItems: "center",
            justifyContent: 'center',
            zIndex: 99999,
        }}>
            {Multiplier !== null ? `x${Multiplier}` : 'x1'}
        </div>
    )
}