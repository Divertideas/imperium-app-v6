import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { EmpireId } from '../store/types';

type PlanetOwner = string;

function isEmpireId(v: unknown): v is EmpireId {
  return v === 'primus' || v === 'xilnah' || v === 'navui' || v === 'tora' || v === 'miradu';
}

function PlanetNodesPanel({
  planetId,
  planetNumber,
}: {
  planetId: string;
  planetNumber?: number;
}) {
  const store = useGameStore();
  const planet = store.planets[planetId];
  const [editMode, setEditMode] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [notice, setNotice] = useState<string>('');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const src = planetNumber ? `/planet-nodes/${planetNumber}.png` : undefined;

  useEffect(() => {
    // When planet number changes, try loading the image again.
    setImgOk(true);
  }, [src]);

  const points = planet?.nodePoints ?? [];
  const active = planet?.nodeActive ?? [];

  const toggleActive = (idx: number) => {
    const currently = Boolean(active[idx]);
    const nextValue = !currently;

    // Activating a node costs 1 credit. Deactivating never refunds.
    if (nextValue) {
      const currentEmpire = store.getCurrentEmpire();
      const owner = store.planets[planetId]?.owner ?? 'free';
      const payEmpire: EmpireId | null = isEmpireId(owner)
        ? owner
        : (currentEmpire ?? null);

      if (!payEmpire) {
        setNotice('No hay un imperio activo para aplicar el coste del nodo.');
        return;
      }

      const credits = store.credits[payEmpire] ?? 0;
      if (credits < 1) {
        setNotice('No hay créditos suficientes para activar este nodo.');
        return;
      }
      store.incCredits(payEmpire, -1);
    }

    // Clearing a node never refunds credits.
    setNotice('');

    const next = points.map((_, i) => (i === idx ? nextValue : Boolean(active[i])));
    store.savePlanet(planetId, { nodeActive: next });
  };

  const addPointFromClick = (ev: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!editMode) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const clientX = 'touches' in ev ? ev.touches[0]?.clientX : (ev as React.MouseEvent).clientX;
    const clientY = 'touches' in ev ? ev.touches[0]?.clientY : (ev as React.MouseEvent).clientY;
    if (clientX == null || clientY == null) return;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return;

    // Avoid duplicates: if close to existing point, ignore.
    const tooClose = points.some((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 0.03;
    });
    if (tooClose) return;

    const nextPoints = [...points, { x, y }];
    const nextActive = [...active, false];
    store.savePlanet(planetId, { nodePoints: nextPoints, nodeActive: nextActive });
  };

  const removePoint = (idx: number) => {
    const nextPoints = points.filter((_, i) => i !== idx);
    const nextActive = active.filter((_, i) => i !== idx);
    store.savePlanet(planetId, { nodePoints: nextPoints, nodeActive: nextActive });
  };

  const resetPoints = () => {
    store.savePlanet(planetId, { nodePoints: [], nodeActive: [] });
  };

  return (
    <div className="nodes-panel">
      <div className="row between">
        <div className="nodes-title">Ramificación de nodos</div>
        <div className="row wrap">
          <button className="ghost" type="button" onClick={() => setEditMode((v) => !v)} disabled={!planetNumber}>
            {editMode ? 'Terminar edición' : 'Editar nodos'}
          </button>
          {editMode ? (
            <button className="ghost" type="button" onClick={resetPoints}>
              Reiniciar
            </button>
          ) : null}
        </div>
      </div>

      {!planetNumber ? (
        <div className="muted small">Introduce el número del planeta para mostrar la ramificación.</div>
      ) : (
        <div
          className="nodes-image-wrap"
          ref={wrapRef}
          onClick={addPointFromClick as any}
          onTouchStart={addPointFromClick as any}
        >
          {imgOk ? (
            <img
              key={src}
              ref={imgRef}
              src={src}
              alt={`Nodos planeta ${planetNumber}`}
              draggable={false}
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="muted small">No se ha encontrado la imagen de nodos para el planeta {planetNumber}.</div>
          )}

          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              className={`node-dot ${active[i] ? 'active' : ''}`}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              onClick={(e) => {
                e.stopPropagation();
                if (editMode) removePoint(i);
                else toggleActive(i);
              }}
              title={editMode ? 'Quitar nodo' : active[i] ? 'Desactivar nodo' : 'Activar nodo'}
            />
          ))}
        </div>
      )}

      {planetNumber ? (
        <div className="muted small">
          {editMode ? (
            <>
              Pulsa sobre cada círculo blanco del PNG para crear un punto. En modo edición, tocar un punto lo elimina.
              <br />
              Fuera de edición, tocar un punto lo marca como activo/inactivo.
            </>
          ) : (
            'Toca los círculos para marcar nodos activos/inactivos. Si aún no has calibrado este planeta, pulsa “Editar nodos”.'
          )}
        </div>
      ) : null}

      {notice ? <div className="danger small" style={{ marginTop: 8 }}>{notice}</div> : null}
    </div>
  );
}

export function PlanetSheet(props: { planetId: string; mode?: 'full' | 'inline' }) {
  const { planetId, mode = 'full' } = props;
  const store = useGameStore();
  const planet = store.planets[planetId];
  const [msg, setMsg] = useState<string>('');

  if (!planet) return null;

  const [numInput, setNumInput] = useState<string>(planet.number != null ? String(planet.number) : '');

  useEffect(() => {
    // Keep input in sync when opening an existing planet.
    setNumInput(planet.number != null ? String(planet.number) : '');
  }, [planetId, planet.number]);

  const bindNumber = (num?: number) => {
    if (num == null) {
      store.unbindPlanetNumber(planetId);
      return;
    }
    // Planet numbers must be unique for the whole partida.
    const existingId = store.planetByNumber[num];
    if (existingId && existingId !== planetId) {
      const existing = store.planets[existingId];
      if (existing?.destroyedPermanently || existing?.owner === 'destroyed') {
        setMsg('Este planeta está destruido permanentemente y su número no puede volver a usarse en la partida.');
      } else {
        setMsg('Ese número de planeta ya está registrado en la partida.');
      }
      return;
    }
    setMsg('');
    store.bindPlanetNumber(planetId, num);
  };

  const toggleDestroyed = () => {
    if (!planet.destroyedPermanently) {
      const ok = confirm('Este planeta quedará destruido permanentemente y no podrá volver a usarse en la partida. ¿Confirmar?');
      if (!ok) return;
      store.setPlanetDestroyed(planetId, true);
      setMsg('Planeta marcado como DESTRUIDO permanentemente.');
    }
  };

  return (
    <div className="planet-sheet">
      {mode === 'inline' ? (
        <div className="row between">
          <h3>Planeta</h3>
          <a className="ghost" href={`#/planet/${planetId}`}>Abrir ficha</a>
        </div>
      ) : null}

      <div className="grid two">
        <label className="field">
          <span>Número de planeta</span>
          <input
            type="number"
            value={numInput}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '');
              setNumInput(v);
            }}
            onBlur={() => {
              const trimmed = numInput.trim();
              if (trimmed === '') {
                bindNumber(undefined);
              } else {
                bindNumber(Math.floor(Number(trimmed)));
              }
            }}
          />
        </label>

        <label className="field">
          <span>Propietario</span>
          <input value={planet.owner as PlanetOwner} readOnly />
          <small className="muted">Se gestiona mediante “Planeta conquistado” en combate planetario.</small>
        </label>

        <label className="field">
          <span>Producción (actual)</span>
          <input
            type="number"
            value={planet.prod ?? ''}
            onChange={(e) => store.savePlanet(planetId, { prod: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span>Ataque (actual)</span>
          <input
            type="number"
            value={planet.atk ?? ''}
            onChange={(e) => store.savePlanet(planetId, { atk: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span>Defensa (actual)</span>
          <input
            type="number"
            value={planet.def ?? ''}
            onChange={(e) => store.savePlanet(planetId, { def: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span>PR máximos</span>
          <input
            type="number"
            value={planet.prMax ?? ''}
            onChange={(e) => store.savePlanet(planetId, { prMax: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span>PR marcados</span>
          <input
            type="number"
            value={planet.prMarked ?? 0}
            onChange={(e) => store.savePlanet(planetId, { prMarked: Math.floor(Number(e.target.value) || 0) })}
          />
        </label>
      </div>

      <div className="subpanel">
        <h4>Habilidad especial (texto)</h4>
        <textarea
          value={planet.abilityText ?? ''}
          onChange={(e) => store.savePlanet(planetId, { abilityText: e.target.value })}
          rows={3}
        />
      </div>

      <PlanetNodesPanel planetId={planetId} planetNumber={planet.number} />

      <div className="subpanel">
        <h4>Planeta destruido</h4>
        <div className="row between">
          <div>
            <strong>Estado:</strong>{' '}
            {planet.destroyedPermanently ? 'DESTRUIDO (permanente)' : 'Operativo'}
          </div>
          {!planet.destroyedPermanently ? (
            <button className="danger" onClick={toggleDestroyed}>Marcar como destruido</button>
          ) : null}
        </div>
        <p className="muted small">Si se destruye permanentemente, ningún imperio podrá conquistarlo.</p>
      </div>

      {msg ? <p className="notice">{msg}</p> : null}
    </div>
  );
}
