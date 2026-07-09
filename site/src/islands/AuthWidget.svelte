<script lang="ts">
  import { onMount } from 'svelte';
  import { tomeSync } from '@lib/sync.svelte';

  let email = $state('');
  let inviteEmail = $state('');
  let inviteRole = $state<'player' | 'gm'>('player');
  let message = $state('');
  let vaults = $state<{ id: string; name: string }[]>([]);

  onMount(() => tomeSync.init());

  async function signIn(e: SubmitEvent) {
    e.preventDefault();
    message = '';
    try {
      await tomeSync.signIn(email.trim());
      message = 'Magic link sent — check your inbox.';
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
  }

  async function invite(e: SubmitEvent) {
    e.preventDefault();
    message = '';
    try {
      await tomeSync.inviteMember(inviteEmail, inviteRole);
      message = `Invited ${inviteEmail} as ${inviteRole}.`;
      inviteEmail = '';
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
  }

  async function loadVaults() {
    try {
      vaults = await tomeSync.listVaults();
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
  }

  async function pickVault(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    if (id) await tomeSync.switchVault(id);
  }
</script>

<section class="card auth" aria-label="Account and sync">
  {#if tomeSync.state === 'signedout' || tomeSync.state === 'init' || tomeSync.state === 'unavailable'}
    <h3>Sign in</h3>
    <p class="muted">
      Sign in with a magic link to sync your group's campaigns, party and table state across devices.
    </p>
    <form class="row" onsubmit={signIn}>
      <input type="email" required placeholder="you@example.com" bind:value={email} aria-label="Email address" />
      <button class="btn" type="submit">Send magic link</button>
    </form>
  {:else}
    <h3>
      {tomeSync.user?.email}
      {#if tomeSync.isAdmin}<span class="chip on">Admin</span>{/if}
      {#if tomeSync.isGm}<span class="chip">GM</span>{/if}
    </h3>
    <p class="muted status">
      {#if tomeSync.state === 'syncing'}Syncing…{/if}
      {#if tomeSync.state === 'synced'}Synced{#if tomeSync.lastSyncAt} · {new Date(tomeSync.lastSyncAt).toLocaleTimeString()}{/if}{/if}
      {#if tomeSync.state === 'error'}Sync error: {tomeSync.errorDetail}{/if}
    </p>

    {#if tomeSync.isGm}
      <form class="row" onsubmit={invite}>
        <input type="email" required placeholder="invite by email" bind:value={inviteEmail} aria-label="Invite email" />
        <select bind:value={inviteRole} aria-label="Invite role">
          <option value="player">Player</option>
          <option value="gm">GM</option>
        </select>
        <button class="btn ghost" type="submit">Invite</button>
      </form>
    {/if}

    {#if tomeSync.isAdmin}
      <div class="row">
        <button class="btn quiet" onclick={loadVaults}>List vaults</button>
        {#if vaults.length}
          <select onchange={pickVault} aria-label="Switch vault">
            <option value="">Switch vault…</option>
            {#each vaults as v (v.id)}
              <option value={v.id} selected={v.id === tomeSync.vaultId}>{v.name}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/if}

    <div class="row">
      <button class="btn quiet" onclick={() => tomeSync.signOut()}>Sign out</button>
    </div>
  {/if}
  {#if message}<p class="msg" role="status">{message}</p>{/if}
</section>

<style>
  .auth { gap: .6rem; max-width: 560px; }
  .auth h3 { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
  .row { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
  .row input[type='email'] { flex: 1; min-width: 180px; }
  .status { margin: 0; font-size: .8rem; }
  .msg { margin: 0; font-size: .85rem; color: var(--info); }
</style>
