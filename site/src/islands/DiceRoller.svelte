<script lang="ts">
  import { RULESET_LIST, RULESETS, type RulesetId } from '@rulesets/index';
  import { parseSpec, rollSpec, d20Check, type AdvantageMode } from '@lib/dice/d20';
  import { rollPool, pushPool, type PoolResult } from '@lib/dice/year-zero';
  import { rollPercentile, pushPercentile, type PercentileResult } from '@lib/dice/percentile';
  import { rollDuality } from '@lib/dice/duality';

  interface HistoryEntry {
    system: string;
    summary: string;
    detail: string;
    tone: 'good' | 'bad' | 'plain';
    at: number;
  }

  let systemId = $state<RulesetId>('dnd5e');
  let history = $state<HistoryEntry[]>([]);
  let error = $state('');

  // d20 state
  let expression = $state('1d20');
  let advMode = $state<AdvantageMode>('normal');

  // pool state
  let poolSize = $state(5);
  let lastPool = $state<PoolResult | null>(null);

  // percentile state
  let skill = $state(50);
  let bonusDice = $state(0);
  let lastPercentile = $state<PercentileResult | null>(null);

  // duality state
  let dualityMod = $state(0);
  let dualityAdv = $state<'none' | 'advantage' | 'disadvantage'>('none');

  const system = $derived(RULESETS[systemId]);

  function selectSystem(id: RulesetId) {
    systemId = id;
    error = '';
    lastPool = null;
    lastPercentile = null;
    document.documentElement.dataset.skin = RULESETS[id].skin;
    localStorage.setItem('tome-active-skin', RULESETS[id].skin);
  }

  function push(entry: Omit<HistoryEntry, 'at' | 'system'>) {
    history = [{ ...entry, at: Date.now(), system: system.name }, ...history].slice(0, 30);
  }

  function doD20() {
    error = '';
    try {
      const spec = parseSpec(expression);
      const isSingleD20 = spec.terms.length === 1 && spec.terms[0]!.sides === 20 && Math.abs(spec.terms[0]!.count) === 1;
      if (isSingleD20) {
        const r = d20Check(spec.modifier, advMode);
        push({
          summary: `${r.total}`,
          detail: `${expression}${advMode !== 'normal' ? ` (${advMode})` : ''} → d20: ${r.kept}${r.dropped !== undefined ? ` / ${r.dropped}` : ''}${r.modifier ? ` ${r.modifier > 0 ? '+' : ''}${r.modifier}` : ''}`,
          tone: r.crit === 'hit' ? 'good' : r.crit === 'miss' ? 'bad' : 'plain',
        });
      } else {
        const r = rollSpec(spec);
        push({
          summary: `${r.total}`,
          detail: `${expression} → ${r.rolls.map((g) => `d${g.sides}: ${g.values.join(', ')}`).join(' · ')}${r.modifier ? ` · mod ${r.modifier}` : ''}`,
          tone: 'plain',
        });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  function doPool() {
    const keep = system.dice.kind === 'pool' && system.dice.keepBanesOnPush;
    lastPool = rollPool(poolSize);
    push({
      summary: `${lastPool.successes} ${lastPool.successes === 1 ? 'success' : 'successes'}`,
      detail: `${poolSize}d6 → ${lastPool.dice.join(', ')}${keep && lastPool.banes ? ` · ${lastPool.banes} banes` : ''}`,
      tone: lastPool.successes > 0 ? 'good' : 'plain',
    });
  }

  function doPush() {
    if (!lastPool || lastPool.pushed || system.dice.kind !== 'pool') return;
    lastPool = pushPool(lastPool, system.dice.keepBanesOnPush);
    push({
      summary: `${lastPool.successes} ${lastPool.successes === 1 ? 'success' : 'successes'} (pushed)`,
      detail: `push → ${lastPool.dice.join(', ')}${lastPool.banes ? ` · ${lastPool.banes} banes` : ''}`,
      tone: lastPool.successes > 0 ? 'good' : 'bad',
    });
  }

  function doPercentile(pushed = false) {
    lastPercentile = pushed ? pushPercentile(skill) : rollPercentile(skill, bonusDice);
    const r = lastPercentile;
    push({
      summary: `${r.total} — ${r.level}`,
      detail: `d100 vs ${skill}${bonusDice ? ` (${bonusDice > 0 ? '+' : ''}${bonusDice} die)` : ''}${pushed ? ' · pushed' : ''} → tens ${r.tensCandidates.join('/')}, units ${r.units}`,
      tone: r.level === 'failure' || r.level === 'fumble' ? 'bad' : 'good',
    });
  }

  function doDuality() {
    const r = rollDuality(dualityMod, dualityAdv);
    push({
      summary: `${r.total} with ${r.temper === 'critical' ? 'a critical!' : r.temper}`,
      detail: `Hope ${r.hope} · Fear ${r.fear}${r.advantageDie ? ` · d6 ${r.advantageDie > 0 ? '+' : ''}${r.advantageDie}` : ''}${r.modifier ? ` · mod ${r.modifier}` : ''}`,
      tone: r.temper === 'critical' || r.temper === 'hope' ? 'good' : 'bad',
    });
  }
</script>

<div class="chip-row systems">
  {#each RULESET_LIST as rs (rs.id)}
    <button class="chip" class:on={rs.id === systemId} onclick={() => selectSystem(rs.id)}>
      <span class="dot"></span>{rs.name}
    </button>
  {/each}
</div>

<div class="panel card">
  {#if system.dice.kind === 'd20'}
    <div class="row">
      <input type="text" bind:value={expression} aria-label="Dice expression" placeholder="e.g. 2d6+3" />
      <select bind:value={advMode} aria-label="Advantage mode">
        <option value="normal">Normal</option>
        <option value="advantage">Advantage</option>
        <option value="disadvantage">Disadvantage</option>
      </select>
      <button class="btn" onclick={doD20}>Roll</button>
    </div>
    <div class="row quick">
      {#each ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '1d100', '4d6', '8d6'] as q}
        <button class="chip" onclick={() => { expression = q; doD20(); }}>{q}</button>
      {/each}
    </div>
  {:else if system.dice.kind === 'pool'}
    <div class="row">
      <label>Pool <input type="number" min="1" max="15" bind:value={poolSize} aria-label="Pool size" /></label>
      <button class="btn" onclick={doPool}>Roll {poolSize}d6</button>
      <button class="btn ghost" onclick={doPush} disabled={!lastPool || lastPool.pushed}>
        Push{system.dice.keepBanesOnPush ? ' (banes stay)' : ''}
      </button>
    </div>
    {#if lastPool}
      <div class="dice-faces" aria-live="polite">
        {#each lastPool.dice as d}
          <span class="face num" class:six={d === 6} class:one={d === 1}>{d}</span>
        {/each}
      </div>
    {/if}
  {:else if system.dice.kind === 'percentile'}
    <div class="row">
      <label>Skill <input type="number" min="1" max="99" bind:value={skill} aria-label="Skill value" /></label>
      <select bind:value={bonusDice} aria-label="Bonus or penalty dice">
        <option value={0}>No bonus/penalty</option>
        <option value={1}>+1 bonus die</option>
        <option value={2}>+2 bonus dice</option>
        <option value={-1}>−1 penalty die</option>
        <option value={-2}>−2 penalty dice</option>
      </select>
      <button class="btn" onclick={() => doPercentile()}>Roll d100</button>
      <button class="btn ghost" onclick={() => doPercentile(true)} disabled={!lastPercentile || lastPercentile.pushed}>Push</button>
    </div>
  {:else if system.dice.kind === 'duality'}
    <div class="row">
      <label>Modifier <input type="number" min="-10" max="10" bind:value={dualityMod} aria-label="Modifier" /></label>
      <select bind:value={dualityAdv} aria-label="Advantage">
        <option value="none">No advantage</option>
        <option value="advantage">Advantage (+d6)</option>
        <option value="disadvantage">Disadvantage (−d6)</option>
      </select>
      <button class="btn" onclick={doDuality}>Roll 2d12</button>
    </div>
  {/if}
  {#if error}<p class="err" role="alert">{error}</p>{/if}
</div>

{#if history.length}
  <h2 class="hist-title">History</h2>
  <ol class="history">
    {#each history as h (h.at)}
      <li class="card" class:good={h.tone === 'good'} class:bad={h.tone === 'bad'}>
        <span class="sum">{h.summary}</span>
        <span class="det muted">{h.detail}</span>
        <span class="sys muted">{h.system}</span>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .systems { margin-bottom: 1rem; }
  .chip { cursor: pointer; }
  .panel { gap: .8rem; }
  .row { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
  .row label { display: flex; align-items: center; gap: .45rem; font-size: .85rem; color: var(--ink-muted); }
  .row input[type='number'] { width: 5rem; }
  .row input[type='text'] { min-width: 10rem; font-family: var(--font-mono); }
  .quick .chip { font-family: var(--font-mono); }
  .err { color: var(--danger); margin: 0; font-size: .85rem; }

  .dice-faces { display: flex; gap: .4rem; flex-wrap: wrap; }
  .face {
    width: 2.1rem; height: 2.1rem; display: grid; place-items: center;
    border: 1px solid var(--edge-strong); border-radius: var(--radius-sm);
    background: var(--surface-2); font-weight: 700;
  }
  .face.six { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .face.one { border-color: var(--danger); color: var(--danger); }

  .hist-title { font-size: .9rem; margin: 1.4rem 0 .6rem; color: var(--ink-muted); }
  .history { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
  .history li { flex-direction: row; align-items: baseline; gap: .8rem; padding: .55rem .9rem; }
  .history li.good { border-left: 3px solid var(--ok); }
  .history li.bad { border-left: 3px solid var(--danger); }
  .sum { font-weight: 700; font-variant-numeric: tabular-nums; min-width: 3.5rem; }
  .det { font-size: .8rem; flex: 1; }
  .sys { font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; }
</style>
