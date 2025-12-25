import React from 'react';
import { useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { PlanetSheet } from '../components/PlanetSheet';
import { useGameStore } from '../store/gameStore';

export default function PlanetPage() {
  const { planetId } = useParams();
  const store = useGameStore();
  const planet = planetId ? store.planets[planetId] : undefined;

  if (!planetId || !planet) {
    return (
      <div className="page">
        <p>Planeta no encontrado.</p>
        <BackButton />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="row between">
          <h2>Ficha de planeta</h2>
          <BackButton />
        </div>
        <PlanetSheet planetId={planetId} mode="full" />
      </div>
    </div>
  );
}
