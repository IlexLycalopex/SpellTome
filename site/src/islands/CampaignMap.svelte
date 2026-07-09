<script lang="ts">
  import { onMount } from 'svelte';
  import { tomeSync } from '@lib/sync.svelte';
  import { get as storeGet, set as storeSet } from '@lib/store';

  /**
   * Pan/zoom campaign map with fractional-coordinate markers, stored in the
   * same synced `mapMarkers` collection as the old page:
   * { campaigns: { [name]: { markers: [{id,name,x,y,note}] } } }.
   * The map image still ships with the old site during the transition; it
   * moves to the private campaign-media bucket at cutover.
   */
  interface Marker {
    id: string;
    name: string;
    x: number; // 0..1
    y: number;
    note: string;
  }
  interface MapStore {
    campaigns: Record<string, { markers: Marker[] }>;
  }

  let store = $state<MapStore>({ campaigns: {} });
  let campaign = $state('');
  let scale = $state(1);
  let tx = $state(0);
  let ty = $state(0);
  let addMode = $state(false);
  let selected = $state<Marker | null>(null);
  let viewport: HTMLDivElement;

  const markers = $derived(store.campaigns[campaign]?.markers ?? []);
  // Served by the old site during the transition; moves to the private
  // campaign-media bucket (signed URL) at cutover.
  const mapSrc = '/assets/img/sword-coast-map.jpg';

  onMount(() => {
    tomeSync.init();
    load();
    campaign = storeGet<string>('activeCampaign', '') || Object.keys(store.campaigns)[0] || "Storm King's Thunder";
    window.addEventListener('tome:remote-update', load);
  });

  function load() {
    const raw = storeGet<MapStore>('mapMarkers', null);
    if (raw?.campaigns) store = raw;
  }
  function persist() {
    store = { ...store };
    storeSet('mapMarkers', store);
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const next = Math.min(Math.max(scale * factor, 0.5), 8);
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    tx = cx - ((cx - tx) * next) / scale;
    ty = cy - ((cy - ty) * next) / scale;
    scale = next;
  }
  function onDown(e: PointerEvent) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    viewport.setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onUp() {
    dragging = false;
  }

  function onMapClick(e: MouseEvent) {
    if (!addMode) return;
    const img = e.currentTarget as HTMLElement;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const name = prompt('Marker name?');
    if (!name) return;
    store.campaigns[campaign] ??= { markers: [] };
    store.campaigns[campaign]!.markers.push({ id: crypto.randomUUID(), name, x, y, note: '' });
    addMode = false;
    persist();
  }

  function removeMarker(m: Marker) {
    if (!confirm(`Remove marker "${m.name}"?`)) return;
    store.campaigns[campaign]!.markers = markers.filter((x) => x.id !== m.id);
    selected = null;
    persist();
  }

  function saveNote(m: Marker, note: string) {
    m.note = note;
    persist();
  }
</script>

<div class="row bar">
  <input type="text" bind:value={campaign} aria-label="Campaign" placeholder="Campaign name" />
  <button class="btn" class:ghost={!addMode} onclick={() => (addMode = !addMode)}>
    {addMode ? 'Click the map…' : 'Add marker'}
  </button>
  <button class="btn quiet" onclick={() => { scale = 1; tx = 0; ty = 0; }}>Reset view</button>
  <span class="muted">Scroll to zoom, drag to pan.</span>
</div>

<div
  class="viewport card"
  bind:this={viewport}
  onwheel={onWheel}
  onpointerdown={onDown}
  onpointermove={onMove}
  onpointerup={onUp}
  role="application"
  aria-label="Campaign map"
>
  <div class="world" style:transform={`translate(${tx}px, ${ty}px) scale(${scale})`}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <img src={mapSrc} alt="Campaign map" draggable="false" onclick={onMapClick} class:crosshair={addMode} />
    {#each markers as m (m.id)}
      <button
        class="marker"
        style:left={`${m.x * 100}%`}
        style:top={`${m.y * 100}%`}
        onclick={(e) => { e.stopPropagation(); selected = selected?.id === m.id ? null : m; }}
        title={m.name}
      >
        <span class="pin"></span>
        <span class="lbl" style:font-size={`${Math.max(0.6, 0.85 / scale)}rem`}>{m.name}</span>
      </button>
    {/each}
  </div>
</div>

{#if selected}
  <div class="card popup">
    <h3>{selected.name}</h3>
    <textarea rows="3" value={selected.note} placeholder="Notes for this place…" onchange={(e) => saveNote(selected!, (e.target as HTMLTextAreaElement).value)}></textarea>
    <div class="row">
      <button class="btn ghost danger" onclick={() => removeMarker(selected!)}>Remove marker</button>
      <span style="flex:1"></span>
      <button class="btn quiet" onclick={() => (selected = null)}>Close</button>
    </div>
  </div>
{/if}

<style>
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .bar { margin-bottom: .8rem; }
  .bar input { min-width: 180px; }
  .bar .muted { font-size: .78rem; }

  .viewport { height: 70vh; overflow: hidden; padding: 0; touch-action: none; position: relative; }
  .world { transform-origin: 0 0; position: relative; width: fit-content; }
  .world img { display: block; max-width: none; width: 1400px; user-select: none; }
  .world img.crosshair { cursor: crosshair; }

  .marker { position: absolute; transform: translate(-50%, -100%); background: none; border: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 0; }
  .pin { width: 12px; height: 12px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: var(--accent); border: 2px solid var(--accent-ink); box-shadow: var(--shadow-1); }
  .lbl { color: #fff; text-shadow: 0 1px 3px rgb(0 0 0 / .9); font-weight: 600; white-space: nowrap; }

  .popup { margin-top: .8rem; gap: .6rem; max-width: 480px; }
  .popup textarea { width: 100%; resize: vertical; }
  .danger { color: var(--danger); border-color: var(--danger); }
</style>
