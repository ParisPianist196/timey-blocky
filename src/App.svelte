<script lang="ts">
  import Timeline from "@lib/components/timeline/Timeline.svelte";
  import { getSession, signIn, signOut } from "@lib/db/auth";

  let email = $state("");
  let password = $state("");
  let loggedIn = $state(false);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function checkSession() {
    try {
      const session = getSession();
      loggedIn = !!session;
    } catch (err) {
      console.error("Failed to check session:", err);
      loggedIn = false;
    } finally {
      loading = false;
    }
  }

  async function login() {
    if (!email || !password) {
      error = "Please enter your email and password.";
      return;
    }

    loading = true;
    error = null;

    try {
      await signIn(email, password);

      loggedIn = true;
      password = "";
    } catch (err) {
      console.error("Login failed:", err);

      error =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";
    } finally {
      loading = false;
    }
  }

  async function logout() {
    try {
      await signOut();
      loggedIn = false;
    } catch (err) {
      console.error("Logout failed:", err);

      error = err instanceof Error ? err.message : "Logout failed.";
    }
  }

  checkSession();
</script>

<main>
  {#if loading}
    <div class="password-page">
      <p>Loading...</p>
    </div>
  {:else if !loggedIn}
    <div class="password-page">
      <form
        class="login-form"
        onsubmit={(event) => {
          event.preventDefault();
          login();
        }}
      >
        <h1>🕰️TimeyBlocky🕰️</h1>

        <input
          type="email"
          bind:value={email}
          placeholder="Email"
          autocomplete="email"
          disabled={loading}
        />

        <input
          type="password"
          bind:value={password}
          placeholder="Password"
          autocomplete="current-password"
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        {#if error}
          <p class="error">{error}</p>
        {/if}
      </form>
    </div>
  {:else}
    <div class="container">
      <h1>🕰️TimeyBlocky🕰️</h1>

      <button class="logout-button" type="button" onclick={logout}>
        Log out
      </button>

      <Timeline />
    </div>
  {/if}
</main>

<style>
  h1 {
    text-align: center;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100vw;
  }

  .logout-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    border: none;
    border-radius: 12px;
    padding: 8px 12px;
    background-color: var(--font-color);
    color: var(--contrast-color);
    margin-bottom: 20px;
    cursor: pointer;
  }

  .password-page {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--contrast-color);
    color: white;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(320px, 90vw);
  }

  .login-form h1 {
    margin-bottom: 12px;
  }

  .login-form input {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 12px;
    background: white;
    color: black;
  }

  .login-form input:focus {
    outline: 2px solid var(--font-color);
  }

  .login-form button {
    padding: 10px 12px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    background-color: var(--font-color);
    color: var(--contrast-color);
  }

  .login-form button:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  .error {
    margin: 0;
    color: #ff6b6b;
    text-align: center;
  }
</style>
