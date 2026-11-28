import { memo, useMemo, useRef, useState } from 'react';
import { geoCircle, geoDistance, geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';

const W = 400;

// The average longitude of some places (so the map can turn to face them;
// works across the Pacific, where longitudes jump from 180 to -180).
function centerLng(points) {
  let x = 0;
  let y = 0;
  for (const [lng] of points) {
    x += Math.cos((lng * Math.PI) / 180);
    y += Math.sin((lng * Math.PI) / 180);
  }
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// How far a country reaches from its middle, in degrees.
function reachDeg(main, center) {
  if (main.type === 'Point') return 0;
  let far = 0;
  for (const poly of main.coordinates) {
    const ring = poly[0];
    const step = Math.max(1, Math.floor(ring.length / 60));
    for (let i = 0; i < ring.length; i += step) far = Math.max(far, geoDistance(center, ring[i]));
  }
  return (far * 180) / Math.PI;
}

// A map of the world, drawn in SVG with d3-geo.
//   view: { focus: id } zooms in on one country with some of the land
//         around it; { fit: [ids] } fits those countries; { world: lng }
//         shows the whole world turned to face that longitude.
//   colorOf(id) -> a CSS class for each country's fill.
//   onTap(id) when a country is tapped.
//   pannable: drag to move, buttons to zoom (Explore).
function WorldMap({ world, view, height = 260, colorOf, onTap, homeId, pannable = false, dots = [] }) {
  const H = height;
  const projection = useMemo(() => {
    const p = geoNaturalEarth1().precision(0.3);
    let fitObject;
    if (view.focus) {
      const info = world.info[view.focus];
      const c = info.centroid;
      const r = Math.min(40, Math.max(7, reachDeg(info.main, c) * 1.9));
      p.rotate([-c[0], 0]);
      fitObject = { type: 'GeometryCollection', geometries: [info.main, geoCircle().center(c).radius(r)()] };
    } else if (view.fit) {
      const mains = view.fit.map((id) => world.info[id]).filter(Boolean);
      p.rotate([-centerLng(mains.map((m) => m.centroid)), 0]);
      fitObject = { type: 'GeometryCollection', geometries: mains.map((m) => m.main) };
    } else {
      p.rotate([-(view.world || 0), 0]);
      fitObject = { type: 'Sphere' };
    }
    p.fitExtent(
      [
        [12, 12],
        [W - 12, H - 12],
      ],
      fitObject,
    );
    // A very small country alone would zoom in too far: keep some world
    // around it.
    p.clipExtent([
      [-50, -50],
      [W + 50, H + 50],
    ]);
    return p;
  }, [world, view.focus, view.fit, view.world, H]);

  const path = useMemo(() => geoPath(projection), [projection]);

  const shapes = useMemo(
    () =>
      world.features.map((f, i) => ({
        key: i,
        id: f.properties.id,
        d: path(f) || '',
      })),
    [world, path],
  );

  // Tiny countries get a dot, so they can be seen and tapped.
  const tiny = useMemo(() => {
    const out = [];
    for (const [id, info] of Object.entries(world.info)) {
      if (info.main.type !== 'Point') {
        const [[x0, y0], [x1, y1]] = path.bounds(info.main);
        if ((x1 - x0) * (y1 - y0) > 30) continue;
      }
      const xy = projection(info.centroid);
      if (xy && xy[0] > -10 && xy[0] < W + 10 && xy[1] > -10 && xy[1] < H + 10) out.push({ id, xy });
    }
    return out;
  }, [world, path, projection, H]);

  const sphere = useMemo(() => path({ type: 'Sphere' }), [path]);
  const graticule = useMemo(() => path(geoGraticule10()), [path]);
  const homeXY = homeId && world.info[homeId] ? projection(world.info[homeId].centroid) : null;

  // Panning and zooming (Explore only): an SVG transform on top of the
  // projection, so dragging doesn't redraw the shapes.
  const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef(null);
  const svgRef = useRef(null);
  const toSvg = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  function tapAt(e, id) {
    if (drag.current?.moved) return;
    if (id && onTap) onTap(id, e);
  }
  function zoomBy(f) {
    setZoom((z) => {
      const k = Math.min(12, Math.max(1, z.k * f));
      const cx = W / 2;
      const cy = H / 2;
      return { k, x: cx - ((cx - z.x) / z.k) * k, y: cy - ((cy - z.y) / z.k) * k };
    });
  }
  const panHandlers = pannable
    ? {
        onPointerDown: (e) => {
          drag.current = { start: toSvg(e), z: zoom, moved: false };
        },
        onPointerMove: (e) => {
          if (!drag.current) return;
          const [x, y] = toSvg(e);
          const dx = x - drag.current.start[0];
          const dy = y - drag.current.start[1];
          if (Math.abs(dx) + Math.abs(dy) > 6) drag.current.moved = true;
          if (drag.current.moved) setZoom({ ...drag.current.z, x: drag.current.z.x + dx, y: drag.current.z.y + dy });
        },
        onPointerUp: () => {
          setTimeout(() => {
            drag.current = null;
          }, 0);
        },
        onPointerLeave: () => {
          drag.current = null;
        },
      }
    : {};
  const k = pannable ? zoom.k : 1;

  return (
    <div className={`world-map${pannable ? ' world-map-pan' : ''}`}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="world-map-svg" {...panHandlers}>
        <rect width={W} height={H} className="map-ocean" />
        <g transform={pannable ? `translate(${zoom.x} ${zoom.y}) scale(${zoom.k})` : undefined}>
          <path d={sphere} className="map-sphere" />
          <path d={graticule} className="map-graticule" vectorEffect="non-scaling-stroke" />
          {shapes.map((s) => (
            <path
              key={s.key}
              d={s.d}
              className={`map-land ${s.id ? colorOf?.(s.id) || '' : 'map-other'}`}
              vectorEffect="non-scaling-stroke"
              onClick={(e) => tapAt(e, s.id)}
            />
          ))}
          {tiny.map((t) => {
            const cls = colorOf?.(t.id) || '';
            if (!dots.includes(t.id) && !/map-(target|right|wrong|level|home)/.test(cls) && !pannable) return null;
            return (
              <circle
                key={t.id}
                cx={t.xy[0]}
                cy={t.xy[1]}
                r={(cls.includes('map-target') || cls.includes('map-right') || cls.includes('map-wrong') ? 6 : 4.5) / k}
                className={`map-dot ${cls}`}
                strokeWidth={1.5 / k}
                onClick={(e) => tapAt(e, t.id)}
              />
            );
          })}
          {homeXY && (
            <text x={homeXY[0]} y={homeXY[1]} className="map-home" fontSize={16 / k} textAnchor="middle" dominantBaseline="central">
              ★
            </text>
          )}
        </g>
      </svg>
      {pannable && (
        <div className="map-zoom">
          <button onClick={() => zoomBy(1.6)} aria-label="Zoom in">
            +
          </button>
          <button onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out">
            −
          </button>
          <button onClick={() => setZoom({ k: 1, x: 0, y: 0 })} aria-label="Whole map">
            ⟲
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(WorldMap);
