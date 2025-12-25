import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function DiceD6() {
  const die1 = useGameStore(s => s.die1);
  const die2 = useGameStore(s => s.die2);
  const roll = useGameStore(s => s.rollDice);
  const [rolling, setRolling] = useState(false);
  const [anim1, setAnim1] = useState<number | undefined>(undefined);
  const [anim2, setAnim2] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!rolling) return;
    const t0 = Date.now();
    const int = setInterval(() => {
      setAnim1(Math.floor(Math.random() * 6) + 1);
      setAnim2(Math.floor(Math.random() * 6) + 1);
      if (Date.now() - t0 > 650) {
        clearInterval(int);
        setRolling(false);
        setAnim1(undefined);
        setAnim2(undefined);
      }
    }, 60);
    return () => clearInterval(int);
  }, [rolling]);

  return (
    <div className={rolling ? 'dice rolling' : 'dice'}>
      <button
        className="primary"
        onClick={() => {
          setRolling(true);
          roll();
        }}
        disabled={rolling}
      >
        {rolling ? 'Tirando…' : 'Tirar dados (2D6)'}
      </button>
      <div className="dice-result">
        <div className="row wrap" style={{ gap: 12, alignItems: 'center' }}>
          <span className="muted">Dado 1:</span>
          <strong className="dice-num">{rolling ? (anim1 ?? die1 ?? '—') : (die1 ?? '—')}</strong>
          <span className="muted">Dado 2:</span>
          <strong className="dice-num">{rolling ? (anim2 ?? die2 ?? '—') : (die2 ?? '—')}</strong>
        </div>
      </div>
    </div>
  );
}
