import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

type RollMode = 'die1' | 'die2' | 'both';

function DieFace({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className={'dice' + (rolling ? ' dice--rolling' : '')} aria-label={`Dado: ${value}`}>
      <div className="dice__face">{value}</div>
    </div>
  );
}

export function DiceD6() {
  const die1 = useGameStore((s) => s.die1);
  const die2 = useGameStore((s) => s.die2);
  const rollDie1 = useGameStore((s) => s.rollDie1);
  const rollDie2 = useGameStore((s) => s.rollDie2);
  const rollBoth = useGameStore((s) => s.rollBoth);

  const [rollingMode, setRollingMode] = useState<RollMode | null>(null);

  useEffect(() => {
    if (!rollingMode) return;
    const t = setTimeout(() => setRollingMode(null), 450);
    return () => clearTimeout(t);
  }, [rollingMode]);

  const doRoll = (mode: RollMode) => {
    setRollingMode(mode);
    if (mode === 'die1') rollDie1();
    else if (mode === 'die2') rollDie2();
    else rollBoth();
  };

  return (
    <div className="diceWrap">
      <div className="diceRow">
        <DieFace value={die1 ?? 1} rolling={rollingMode === 'die1' || rollingMode === 'both'} />
        <DieFace value={die2 ?? 1} rolling={rollingMode === 'die2' || rollingMode === 'both'} />
      </div>
      <div className="diceButtons">
        <button className="btn" type="button" onClick={() => doRoll('die1')}>Tirar dado 1</button>
        <button className="btn" type="button" onClick={() => doRoll('die2')}>Tirar dado 2</button>
        <button className="btn" type="button" onClick={() => doRoll('both')}>Tirar 2 dados</button>
      </div>
    </div>
  );
}
