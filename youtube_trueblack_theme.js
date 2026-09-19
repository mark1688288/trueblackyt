// ==UserScript==
// @name         trueblackyt
// @namespace    https://github.com/mark1688288/trueblackyt
// @version      1.3.8
// @description  Restyle YouTube into a "Lights Out" look: pure black, chat-bar search, blue accents, pill chips. Keeps original YouTube logo.
// @author       mark1688288
// @homepageURL  https://github.com/mark1688288/trueblackyt
// @supportURL   https://github.com/mark1688288/trueblackyt/issues
// @downloadURL  https://raw.githubusercontent.com/mark1688288/trueblackyt/main/youtube_trueblack_theme.js
// @updateURL    https://raw.githubusercontent.com/mark1688288/trueblackyt/main/youtube_trueblack_theme.js
// @match        https://youtube.com/*
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @match        https://youtube-nocookie.com/*
// @match        https://www.youtube-nocookie.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 *
 * - Pure black canvas (#000)
 * - White CTA pills (Post-button style)
 * - System / Chirp-like font stack
 * - Original YouTube logo left untouched
 *
 * v1.3.8 (playlist mode-switch ghosting, 2026-09-20):
 * 1) Playlist: opt #secondary out of its named View Transition while expanded
 *    so default / theater switches do not retain an old panel snapshot
 *
 * v1.3.7 (playlist fixed-panel overlay, 2026-09-20):
 * 1) Default view: keep the full-viewport fixed #secondary shell transparent
 *    while preserving interaction inside the playlist panel
 * 2) Playlist: align the publisher and header elevated surfaces
 *
 * v1.3.6 (dropdown viewport height, 2026-09-20):
 * 1) Dropdowns: let #contentWrapper use the full available viewport height
 *    instead of capping it at 70vh / 480px
 *
 * v1.3.5 (segmented action rim light, 2026-09-19):
 * 1) Like / dislike: remove the full-width decorative rim light that drew a
 *    hairline across the top of both buttons
 *
 * v1.3.4 (account menu header surface, 2026-09-19):
 * 1) Account menu: keep channel-page paint scoped and align the active-account
 *    header with the elevated menu surface
 *
 * v1.3.3 (live chat fixed-panel overlay, 2026-09-19):
 * 1) Default view: keep the full-viewport fixed #secondary shell transparent
 *    and click-through while preserving interaction inside live chat
 *
 * v1.3.2 (live chat default-view player, 2026-09-19):
 * 1) Player: leave video positioning / stacking to YouTube so live-chat
 *    ytd-watch-flexy layout updates cannot hide the default-view player
 *
 * How it works:
 * 1) Override YouTube CSS custom properties on :root / html[dark]
 *    (these inherit into Polymer/Lit shadow roots)
 * 2) Light-DOM component polish for masthead, guide, chips, cards
 * 3) Optional toggle via Tampermonkey menu
 */

(function () {
    'use strict';

    const VERSION = '1.3.8';
    const STYLE_ID = 'yt-trueblack-theme';
    const ENABLED_KEY = 'yt-trueblack-theme-enabled';
    const MARKER = Symbol.for('yt-trueblack-theme-installed');

    const W = globalThis;
    if (W[MARKER]) return;
    Object.defineProperty(W, MARKER, {
        configurable: false,
        enumerable: false,
        value: VERSION,
        writable: false
    });

    const store = {
        get(key, fallback) {
            try {
                if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
            } catch (_) { /* ignore */ }
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) return fallback;
                return JSON.parse(raw);
            } catch (_) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                if (typeof GM_setValue === 'function') {
                    GM_setValue(key, value);
                    return;
                }
            } catch (_) { /* ignore */ }
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (_) { /* ignore */ }
        }
    };

    let enabled = store.get(ENABLED_KEY, true) !== false;

    // ── Palette (Lights Out) ─────────────────────────────────────
    const C = {
        bg: '#000000',
        bgElevated: '#16181c',
        bgHover: 'rgba(231, 233, 234, 0.1)',
        bgHoverStrong: 'rgba(231, 233, 234, 0.15)',
        bgChip: '#16181c',
        bgChipActive: '#e7e9ea',
        border: '#2f3336',
        borderSubtle: 'rgba(47, 51, 54, 0.85)',
        text: '#e7e9ea',
        textSecondary: '#71767b',
        textInverse: '#0f1419',
        accent: '#1d9bf0',
        accentHover: '#1a8cd8',
        accentMuted: 'rgba(29, 155, 240, 0.12)',
        danger: '#f4212e',
        success: '#00ba7c',
        cta: '#eff3f4',
        ctaText: '#0f1419',
        red: '#f4212e', // keep YT red muted toward X danger
        thumbnailBg: '#16181c',
        shadow: 'none',
        /* Chat composer */
        composerBg: '#212121',
        composerRing: '#2a2a2a',
        composerRingFocus: '#4a4a4a',
        composerPlaceholder: '#8b8b8b',
        composerSend: '#ffffff',
        composerSendIcon: '#0d0d0d',
        composerRadius: '24px',
        composerHeight: '40px',
        composerSendSize: '32px'
    };

    const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    const CSS = /* css */ `
/* ═══════════════════════════════════════════════════════════════════════════
   trueblackyt ${VERSION}
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1) Design tokens → YouTube variables (pierce shadow DOM) ───────────── */
html,
html[dark],
html[darker-dark-theme],
html[dark][darker-dark-theme],
:root {
  /* Core surfaces */
  --yt-spec-base-background: ${C.bg} !important;
  --yt-spec-general-background-a: ${C.bg} !important;
  --yt-spec-general-background-b: ${C.bg} !important;
  --yt-spec-general-background-c: ${C.bg} !important;
  /* Chrome / app shell stay pure black; menus keep elevated */
  --yt-spec-brand-background-solid: ${C.bg} !important;
  --yt-spec-brand-background-primary: ${C.bg} !important;
  --yt-spec-brand-background-secondary: ${C.bg} !important;
  --yt-spec-raised-background: ${C.bg} !important;
  --yt-spec-menu-background: ${C.bgElevated} !important;
  --yt-spec-inverted-background: ${C.text} !important;
  --yt-spec-additive-background: ${C.bgHover} !important;
  --yt-spec-outline: ${C.border} !important;
  --yt-spec-10-percent-layer: ${C.bgHover} !important;
  --yt-spec-badge-chip-background: ${C.bgChip} !important;
  --yt-spec-suggested-action: ${C.bgElevated} !important;
  --yt-spec-button-chip-background-hover: ${C.bgHoverStrong} !important;

  /* Text */
  --yt-spec-text-primary: ${C.text} !important;
  --yt-spec-text-secondary: ${C.textSecondary} !important;
  --yt-spec-text-primary-inverse: ${C.textInverse} !important;
  --yt-spec-text-disabled: ${C.textSecondary} !important;
  --yt-spec-wordmark-text: ${C.text} !important;
  --yt-spec-selected-nav-text: ${C.text} !important;
  --yt-spec-brand-link-text: ${C.accent} !important;
  --yt-spec-call-to-action: ${C.accent} !important;
  --yt-spec-themed-blue: ${C.accent} !important;
  --yt-spec-themed-green: ${C.success} !important;

  /* Icons */
  --yt-spec-icon-active-other: ${C.text} !important;
  --yt-spec-icon-inactive: ${C.textSecondary} !important;
  --yt-spec-icon-disabled: ${C.textSecondary} !important;
  --yt-spec-brand-icon-active: ${C.text} !important;
  --yt-spec-brand-icon-inactive: ${C.textSecondary} !important;
  --yt-spec-icon-active: ${C.text} !important;

  /* Brand red → muted X-style (less "YouTube", still recognizable) */
  --yt-spec-static-brand-red: ${C.red} !important;
  --yt-spec-static-brand-white: ${C.text} !important;
  --yt-spec-static-brand-black: ${C.bg} !important;
  --yt-spec-brand-button-text: ${C.ctaText} !important;

  /* Deprecated / paper fallbacks */
  --yt-swatch-primary: ${C.bg} !important;
  --yt-swatch-primary-darker: ${C.bg} !important;
  --yt-swatch-text: ${C.text} !important;
  --yt-swatch-input-text: ${C.text} !important;
  --yt-swatch-textbox-bg: ${C.bgElevated} !important;
  /* Do not override logo colors — keep official red wordmark */
  --yt-swatch-icon-color: ${C.text} !important;
  --yt-main-app-background-tmp: ${C.bg} !important;
  --yt-main-app-background: ${C.bg} !important;
  --ytd-searchbox-background: ${C.composerBg} !important;
  --ytd-searchbox-legacy-border-color: transparent !important;
  --ytd-searchbox-legacy-border-shadow-color: transparent !important;
  --ytd-searchbox-legacy-button-color: transparent !important;
  --ytd-searchbox-legacy-button-border-color: transparent !important;
  --ytd-searchbox-legacy-button-hover-color: transparent !important;
  --ytd-searchbox-legacy-button-icon-color: ${C.composerSendIcon} !important;
  --ytd-searchbox-text-color: ${C.text} !important;
  --ytd-searchbox-focus-border-color: transparent !important;

  /* Guide / mini-guide */
  --yt-guide-background: ${C.bg} !important;
  --yt-spec-touch-response: ${C.bgHover} !important;

  /* Modern sys tokens (when present) */
  --yt-sys-color-background: ${C.bg} !important;
  --yt-sys-color-surface: ${C.bg} !important;
  --yt-sys-color-surface-container: ${C.bgElevated} !important;
  --yt-sys-color-surface-container-high: ${C.bgElevated} !important;
  --yt-sys-color-on-surface: ${C.text} !important;
  --yt-sys-color-on-surface-variant: ${C.textSecondary} !important;
  --yt-sys-color-outline: ${C.border} !important;
  --yt-sys-color-outline-variant: ${C.border} !important;
  --yt-sys-color-primary: ${C.accent} !important;
  --yt-sys-color-on-primary: ${C.text} !important;
  --yt-sys-color-error: ${C.danger} !important;
  --yt-sys-color-baseline--text-primary: ${C.text} !important;

  /* Saturated / experimental */
  --yt-saturated-base-background: ${C.bg} !important;
  --yt-saturated-raised-background: ${C.bgElevated} !important;
  --yt-saturated-text-primary: ${C.text} !important;
  --yt-saturated-text-secondary: ${C.textSecondary} !important;
  --yt-saturated-outline: transparent !important;
  --yt-saturated-card-outline: transparent !important;

  /* App chrome */
  --app-drawer-content-container_-_background-color: ${C.bg} !important;
  --paper-listbox-background-color: ${C.bgElevated} !important;
  --paper-menu-background-color: ${C.bgElevated} !important;

  color-scheme: dark !important;
  background-color: ${C.bg} !important;
  font-family: ${FONT} !important;
}

html,
html[dark] {
  background-color: ${C.bg} !important;
}

/* Force dark shell even if light flash */
html:not([dark]) {
  background-color: ${C.bg} !important;
}

body,
ytd-app {
  background: ${C.bg} !important;
  color: ${C.text} !important;
  font-family: ${FONT} !important;
}

/* ── 2) Masthead (top bar) — solid pure black (no translucent gray wash) ── */
ytd-masthead,
#masthead-container,
#masthead-container.ytd-app,
ytd-masthead.shell,
ytd-masthead.shell.dark,
#masthead-container ytd-masthead {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

#background.ytd-masthead,
#container.ytd-masthead,
#masthead.ytd-masthead {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
}

/* Logo: intentionally NOT restyled — keep official YouTube red mark */

/* ── Legacy ytd-searchbox ───────────────────────────────────────────────── */
ytd-searchbox {
  font-family: ${FONT} !important;
  display: flex !important;
  align-items: center !important;
  height: ${C.composerHeight} !important;
  max-height: ${C.composerHeight} !important;
}

/* Outer shell: composer pill — single row, clip overflow */
ytd-searchbox form,
ytd-searchbox #search-form,
ytd-searchbox[has-focus] form {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  background: ${C.composerBg} !important;
  border: none !important;
  border-radius: ${C.composerRadius} !important;
  box-shadow: inset 0 0 0 1px ${C.composerRing} !important;
  height: ${C.composerHeight} !important;
  min-height: ${C.composerHeight} !important;
  max-height: ${C.composerHeight} !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 1px 0 14px !important;
  box-sizing: border-box !important;
  transition: box-shadow 0.15s ease, background 0.15s ease !important;
}

ytd-searchbox form:focus-within,
ytd-searchbox[has-focus] form,
ytd-searchbox[has-focus] #search-form {
  background: ${C.composerBg} !important;
  box-shadow:
    inset 0 0 0 1px ${C.composerRingFocus},
    0 0 0 3px ${C.accentMuted} !important;
}

/* Input half — transparent, no own height (parent owns the pill) */
ytd-searchbox #container.ytd-searchbox,
ytd-searchbox[has-focus] #container.ytd-searchbox,
#container.ytd-searchbox {
  background: transparent !important;
  border: none !important;
  border-width: 0 !important;
  outline: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
  width: auto !important;
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
  padding: 0 8px 0 0 !important;
  display: flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
  position: relative !important;
}

ytd-searchbox #search-input,
ytd-searchbox #search-input.ytd-searchbox-spt {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
  background: transparent !important;
  margin: 0 !important;
  padding: 0 !important;
}

ytd-searchbox #search-input input,
ytd-searchbox input#search,
#search-input.ytd-searchbox-spt input {
  color: ${C.text} !important;
  caret-color: ${C.accent} !important;
  font-family: ${FONT} !important;
  font-size: 15px !important;
  font-weight: 400 !important;
  line-height: normal !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  height: 24px !important;
  min-height: 0 !important;
  max-height: 24px !important;
  width: 100% !important;
}

ytd-searchbox input#search::placeholder,
ytd-searchbox #search-input input::placeholder {
  color: ${C.composerPlaceholder} !important;
  opacity: 1 !important;
}

/*
 * Search button → white disc + native YT magnifying glass 🔍
 */
ytd-searchbox #search-icon-legacy.ytd-searchbox,
#search-icon-legacy,
.ytSearchboxComponentSearchButton,
.ytSearchboxComponentSearchButtonDark,
button.ytSearchboxComponentSearchButton,
yt-searchbox button[aria-label*="Search"],
yt-searchbox button[aria-label*="搜尋"],
yt-searchbox button[aria-label*="搜索"] {
  background: ${C.composerSend} !important;
  background-image: none !important;
  border: none !important;
  border-width: 0 !important;
  outline: none !important;
  border-radius: 9999px !important;
  box-shadow: none !important;
  width: ${C.composerSendSize} !important;
  min-width: ${C.composerSendSize} !important;
  max-width: ${C.composerSendSize} !important;
  height: ${C.composerSendSize} !important;
  min-height: ${C.composerSendSize} !important;
  max-height: ${C.composerSendSize} !important;
  margin: 0 0 0 4px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 ${C.composerSendSize} !important;
  align-self: center !important;
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  float: none !important;
  cursor: pointer !important;
  overflow: hidden !important;
  color: ${C.composerSendIcon} !important;
  fill: ${C.composerSendIcon} !important;
  transition: transform 0.12s ease, background 0.12s ease !important;
  box-sizing: border-box !important;
  --yt-spec-icon-active-other: ${C.composerSendIcon} !important;
  --yt-spec-icon-inactive: ${C.composerSendIcon} !important;
  --ytd-searchbox-legacy-button-icon-color: ${C.composerSendIcon} !important;
}

.ytSearchboxComponentSearchButton,
.ytSearchboxComponentSearchButtonDark,
button.ytSearchboxComponentSearchButton {
  transform: translateX(10px) !important;
}

ytd-searchbox #search-icon-legacy.ytd-searchbox:hover,
#search-icon-legacy:hover,
.ytSearchboxComponentSearchButton:hover,
.ytSearchboxComponentSearchButtonDark:hover,
button.ytSearchboxComponentSearchButton:hover {
  background: #e8e8e8 !important;
  transform: scale(1.04) !important;
}

.ytSearchboxComponentSearchButton:hover,
.ytSearchboxComponentSearchButtonDark:hover,
button.ytSearchboxComponentSearchButton:hover {
  transform: translateX(10px) scale(1.04) !important;
}

/* Keep 🔍 icon visible + dark on white disc */
ytd-searchbox #search-icon-legacy yt-icon,
ytd-searchbox #search-icon-legacy .yt-spec-icon-shape,
ytd-searchbox #search-icon-legacy svg,
ytd-searchbox #search-icon-legacy .yt-icon-shape,
#search-icon-legacy yt-icon,
#search-icon-legacy svg,
.ytSearchboxComponentSearchButton yt-icon,
.ytSearchboxComponentSearchButton .yt-spec-icon-shape,
.ytSearchboxComponentSearchButton svg,
.ytSearchboxComponentSearchButton .yt-icon-shape,
.ytSearchboxComponentSearchButtonDark yt-icon,
.ytSearchboxComponentSearchButtonDark svg,
button.ytSearchboxComponentSearchButton yt-icon,
button.ytSearchboxComponentSearchButton svg {
  display: inline-flex !important;
  opacity: 1 !important;
  visibility: visible !important;
  width: 20px !important;
  height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  color: ${C.composerSendIcon} !important;
  fill: ${C.composerSendIcon} !important;
  pointer-events: none !important;
}

/* No custom ::before/::after glyphs on search button */
ytd-searchbox #search-icon-legacy::before,
ytd-searchbox #search-icon-legacy::after,
#search-icon-legacy::before,
#search-icon-legacy::after,
.ytSearchboxComponentSearchButton::before,
.ytSearchboxComponentSearchButton::after,
.ytSearchboxComponentSearchButtonDark::before,
.ytSearchboxComponentSearchButtonDark::after,
button.ytSearchboxComponentSearchButton::before,
button.ytSearchboxComponentSearchButton::after {
  content: none !important;
  display: none !important;
}

/* Leading 🔍 inside input (focused / suggestions) — remove; trailing 🔍 is enough */
ytd-searchbox #search-icon,
ytd-searchbox #search-icon.ytd-searchbox,
#search-icon.ytd-searchbox,
ytd-searchbox #container > yt-icon,
ytd-searchbox #container.ytd-searchbox > yt-icon,
ytd-searchbox #container yt-icon#search-icon,
.ytSearchboxComponentInputBoxIcon,
.ytSearchboxComponentInnerSearchIcon,
.ytSearchboxComponentSearchIcon,
.ytSearchboxComponentInputBox > yt-icon,
.ytSearchboxComponentInputContainer > yt-icon,
.ytSearchboxComponentInputWrapper > yt-icon {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

/* ── Modern yt-searchbox / ytSearchboxComponent* (2024–2026) ───────────── */
yt-searchbox.ytSearchboxComponentHost,
.ytSearchboxComponentHost {
  font-family: ${FONT} !important;
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  background: ${C.composerBg} !important;
  border: none !important;
  border-radius: ${C.composerRadius} !important;
  box-shadow: inset 0 0 0 1px ${C.composerRing} !important;
  height: ${C.composerHeight} !important;
  min-height: ${C.composerHeight} !important;
  max-height: ${C.composerHeight} !important;
  overflow: visible !important;
  padding: 0 1px 0 14px !important;
  outline: none !important;
  box-sizing: border-box !important;
  transition: box-shadow 0.15s ease, background 0.15s ease !important;
}

.ytSearchboxComponentHost:focus-within,
yt-searchbox.ytSearchboxComponentHost:focus-within {
  box-shadow:
    inset 0 0 0 1px ${C.composerRingFocus},
    0 0 0 3px ${C.accentMuted} !important;
}

.ytSearchboxComponentInputWrapper,
.ytSearchboxComponentInputBox,
.ytSearchboxComponentInputBoxDark,
.ytSearchboxComponentInputContainer {
  background: transparent !important;
  border: none !important;
  border-width: 0 !important;
  outline: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: ${C.text} !important;
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
  display: flex !important;
  align-items: center !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
  padding: 0 8px 0 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

.ytSearchboxComponentHost:focus-within .ytSearchboxComponentInputBox,
.ytSearchboxComponentHost:focus-within .ytSearchboxComponentInputBoxDark,
.ytSearchboxComponentInputBox:focus-within {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

input.ytSearchboxComponentInput,
.ytSearchboxComponentInput,
input.yt-searchbox-input {
  color: ${C.text} !important;
  caret-color: ${C.accent} !important;
  font-family: ${FONT} !important;
  font-size: 15px !important;
  font-weight: 400 !important;
  line-height: normal !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  height: 24px !important;
  min-height: 0 !important;
  max-height: 24px !important;
  width: 100% !important;
}

input.ytSearchboxComponentInput::placeholder,
.ytSearchboxComponentInput::placeholder,
input.yt-searchbox-input::placeholder {
  color: ${C.composerPlaceholder} !important;
  opacity: 1 !important;
}

/* Suggestions are an absolutely positioned child of the 40px search host. */
.ytSearchboxComponentSuggestionsContainer {
  background: ${C.bgElevated} !important;
  border: 1px solid ${C.border} !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55) !important;
  color: ${C.text} !important;
}

.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentSuggestion,
.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentText,
.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentIcon,
.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentIcon svg {
  color: ${C.text} !important;
  fill: ${C.text} !important;
}

.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentSuggestion:hover,
.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentSuggestion[aria-selected="true"] {
  background: ${C.bgHover} !important;
}

.ytSearchboxComponentSuggestionsContainer .ytSearchboxComponentReportButton,
.ytSearchboxComponentSuggestionsContainer .ytSearchboxComponentSuggestionsContainerFooter {
  color: ${C.textSecondary} !important;
}

/* Voice / create / notifications — circular, X-like */
ytd-masthead #voice-search-button,
ytd-masthead ytd-button-renderer,
ytd-masthead ytd-notification-topbar-button-renderer,
ytd-masthead ytd-topbar-menu-button-renderer {
  --yt-spec-icon-active-other: ${C.text} !important;
}

ytd-masthead tp-yt-paper-icon-button,
ytd-masthead yt-icon-button,
ytd-masthead button.yt-spec-button-shape-next {
  border-radius: 9999px !important;
}

/* ── 3) Left guide / mini-guide — no vertical rail line ─────────────────── */
#guide-content,
ytd-guide-renderer,
#guide-inner-content,
tp-yt-app-drawer #header,
#guide-wrapper,
#contentContainer.tp-yt-app-drawer,
#guide-button {
  background: ${C.bg} !important;
  border: none !important;
  border-right: none !important;
  box-shadow: none !important;
}

/* The drawer host and scrim span the viewport; only its 240px panel is black. */
tp-yt-app-drawer#guide {
  background: transparent !important;
  background-color: transparent !important;
}

tp-yt-app-drawer#guide #scrim {
  background: rgba(0, 0, 0, 0.35) !important;
}

ytd-mini-guide-renderer,
ytd-mini-guide-renderer.ytd-app,
#mini-guide-content,
#guide-content.ytd-app {
  background: ${C.bg} !important;
  border: none !important;
  border-right: none !important;
  box-shadow: none !important;
}

/* Guide items: pill hover nav */
ytd-guide-entry-renderer,
ytd-mini-guide-entry-renderer {
  border-radius: 9999px !important;
}

ytd-guide-entry-renderer[active],
ytd-guide-entry-renderer:hover,
ytd-mini-guide-entry-renderer[active],
ytd-mini-guide-entry-renderer:hover {
  background: ${C.bgHover} !important;
}

ytd-guide-entry-renderer[active] .title,
ytd-guide-entry-renderer[active] yt-formatted-string {
  font-weight: 700 !important;
  color: ${C.text} !important;
}

#sections.ytd-guide-renderer > *.ytd-guide-renderer:not(:last-child),
ytd-guide-renderer #sections > * {
  border-bottom: none !important;
  border-bottom-color: transparent !important;
}

/* ── 4) Filter chips — pill tabs ───────────────────────────────────────── */
yt-chip-cloud-chip-renderer,
iron-selector#chips yt-chip-cloud-chip-renderer {
  --yt-spec-badge-chip-background: ${C.bgChip} !important;
  border-radius: 9999px !important;
}

yt-chip-cloud-chip-renderer[selected],
yt-chip-cloud-chip-renderer.iron-selected,
yt-chip-cloud-chip-renderer[chip-style="STYLE_HOME_FILTER"][selected] {
  --yt-spec-text-primary: ${C.textInverse} !important;
  background: ${C.bgChipActive} !important;
  color: ${C.textInverse} !important;
  border-radius: 9999px !important;
}

/* 2026 chip shape (visible host is .ytChipShapeChip, not the renderer) */
.ytChipShapeChip.ytChipShapeInactive {
  background: ${C.bgChip} !important;
  color: ${C.text} !important;
  border-radius: 9999px !important;
}

.ytChipShapeChip.ytChipShapeActive,
yt-chip-cloud-chip-renderer[selected] .ytChipShapeChip,
yt-chip-cloud-chip-renderer.iron-selected .ytChipShapeChip {
  background: ${C.bgChipActive} !important;
  color: ${C.textInverse} !important;
  -webkit-text-fill-color: ${C.textInverse} !important;
  border-radius: 9999px !important;
}

.ytChipShapeChip.ytChipShapeActive .ytAttributedStringHost,
.ytChipShapeChip.ytChipShapeActive .yt-core-attributed-string,
yt-chip-cloud-chip-renderer[selected] .ytChipShapeChip .ytAttributedStringHost {
  color: ${C.textInverse} !important;
  -webkit-text-fill-color: ${C.textInverse} !important;
}

ytd-feed-filter-chip-bar-renderer,
#chips-wrapper,
#chips {
  background: ${C.bg} !important;
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

#right-arrow-button.ytd-feed-filter-chip-bar-renderer,
#left-arrow-button.ytd-feed-filter-chip-bar-renderer,
#left-arrow.ytd-feed-filter-chip-bar-renderer,
#right-arrow.ytd-feed-filter-chip-bar-renderer {
  background: linear-gradient(to right, ${C.bg} 20%, transparent) !important;
}

#right-arrow.ytd-feed-filter-chip-bar-renderer {
  background: linear-gradient(to left, ${C.bg} 20%, transparent) !important;
}

/* ── 5) Video cards — clean media cards (no list frames / row rules) ───── */
ytd-rich-item-renderer,
ytd-rich-grid-media,
ytd-video-renderer,
ytd-compact-video-renderer,
ytd-grid-video-renderer,
yt-lockup-view-model {
  font-family: ${FONT} !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Home feed: kill outer frames + horizontal row dividers */
ytd-rich-grid-renderer,
ytd-rich-section-renderer,
ytd-rich-shelf-renderer,
ytd-reel-shelf-renderer,
ytd-rich-grid-row,
ytd-rich-grid-row > #contents,
#contents.ytd-rich-grid-renderer,
#contents.ytd-rich-section-renderer,
#contents.ytd-rich-shelf-renderer,
ytd-rich-section-renderer > #content,
ytd-browse[page-subtype="home"] ytd-rich-grid-renderer,
ytd-browse[page-subtype="home"] #contents,
ytd-two-column-browse-results-renderer,
#primary.ytd-two-column-browse-results-renderer {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: none !important;
  outline: none !important;
}

ytd-rich-section-renderer,
ytd-rich-shelf-renderer,
ytd-reel-shelf-renderer,
ytd-rich-grid-row,
ytd-horizontal-card-list-renderer,
ytd-rich-list-header-renderer {
  border-top: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

/* Thumbnail rounding + border (home grid + secondary lockups) */
ytd-thumbnail a.ytd-thumbnail,
ytd-thumbnail #thumbnail,
a#thumbnail,
ytd-playlist-thumbnail a,
yt-image img,
.ytCoreImageHost,
#secondary img,
#secondary yt-image img,
#related img,
ytd-compact-video-renderer img,
ytd-compact-video-renderer ytd-thumbnail,
yt-lockup-view-model img,
yt-lockup-view-model yt-image,
yt-lockup-view-model .ytCoreImageHost,
.yt-lockup-view-model-wiz img,
.ytThumbnailViewModelHost,
.ytThumbnailViewModelImage {
  border-radius: 12px !important;
  background: ${C.thumbnailBg} !important;
}

ytd-thumbnail,
ytd-playlist-thumbnail,
yt-lockup-view-model,
#secondary ytd-compact-video-renderer #thumbnail {
  border-radius: 12px !important;
  overflow: hidden !important;
}

/* Duration badge */
ytd-thumbnail-overlay-time-status-renderer,
#time-status.ytd-thumbnail-overlay-time-status-renderer,
.yt-badge-shape--thumbnail-badge {
  background: rgba(0, 0, 0, 0.75) !important;
  border: 1px solid ${C.border} !important;
  border-radius: 4px !important;
  color: ${C.text} !important;
  font-weight: 600 !important;
  backdrop-filter: blur(4px);
}

/* Titles (home + watch + related lockups) */
#video-title,
#video-title.ytd-rich-grid-media,
#video-title-link,
a#video-title,
h3.ytd-rich-grid-media,
.yt-lockup-metadata-view-model-wiz__title,
h1.ytd-watch-metadata,
h1.ytd-watch-metadata yt-formatted-string,
ytd-watch-metadata h1,
ytd-watch-metadata h1 yt-formatted-string,
ytd-watch-metadata #title,
ytd-watch-metadata #title yt-formatted-string,
#title h1,
#title yt-formatted-string,
yt-lockup-metadata-view-model h3,
.yt-lockup-metadata-view-model__title,
#secondary #video-title,
#secondary a#video-title-link {
  color: ${C.text} !important;
  font-family: ${FONT} !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em !important;
  line-height: 1.3 !important;
}

/* No underline on title hover (search results / lists) */
#video-title:hover,
a#video-title:hover,
#secondary #video-title:hover,
ytd-video-renderer #video-title:hover,
ytd-video-renderer a#video-title:hover,
ytd-video-renderer #video-title-link:hover,
ytd-video-renderer h3 a:hover,
ytd-video-renderer .style-scope.ytd-video-renderer:hover,
.style-scope.ytd-video-renderer:hover #video-title {
  color: ${C.text} !important;
  text-decoration: none !important;
  text-underline-offset: unset !important;
}

/* Meta (channel · views · age) */
#metadata-line,
#metadata-line span,
ytd-video-meta-block[rich] #metadata-line,
.ytd-video-meta-block,
#byline-container,
ytd-channel-name,
#channel-name,
.yt-content-metadata-view-model-wiz__metadata-text,
ytd-watch-metadata #owner,
ytd-watch-metadata ytd-channel-name,
ytd-watch-metadata #channel-name,
ytd-watch-metadata yt-formatted-string.ytd-channel-name,
ytd-video-owner-renderer,
ytd-video-owner-renderer yt-formatted-string,
#owner-sub-count,
ytd-watch-info-text,
ytd-watch-info-text yt-formatted-string,
#info-container,
#info-strings,
#info-strings yt-formatted-string,
.yt-content-metadata-view-model-wiz__metadata-row,
#secondary #metadata-line,
#secondary .ytd-video-meta-block {
  color: ${C.textSecondary} !important;
  font-family: ${FONT} !important;
}

/*
 * Search results channel name:
 * Do NOT force display:flex/inline-flex on yt-formatted-string —
 * YT keeps a hidden clone; forcing display = double channel name.
 */
ytd-video-renderer ytd-channel-name,
ytd-video-renderer #channel-name,
ytd-video-renderer #byline-container,
ytd-video-renderer ytd-video-meta-block {
  margin-top: 0 !important;
  padding-top: 0 !important;
  line-height: 1.25 !important;
}

ytd-video-renderer ytd-channel-name a,
ytd-video-renderer #channel-name a {
  line-height: 1.25 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Prefer one channel name: if byline has it, hide metadata-line channel clone */
ytd-video-renderer:has(#byline-container ytd-channel-name) #metadata-line ytd-channel-name,
ytd-video-renderer:has(#byline-container #channel-name) #metadata-line #channel-name,
ytd-video-renderer:has(#channel-info ytd-channel-name) #byline-container ytd-channel-name {
  display: none !important;
}

/* Respect YT hidden clones (do not force them visible) */
ytd-video-renderer ytd-channel-name yt-formatted-string[hidden],
ytd-video-renderer #channel-name yt-formatted-string[hidden],
ytd-video-renderer ytd-channel-name #text[hidden],
ytd-video-renderer ytd-channel-name [hidden] {
  display: none !important;
}

/* Force system stack on common formatted-string hosts */
yt-formatted-string,
.yt-core-attributed-string {
  font-family: ${FONT} !important;
}

ytd-channel-name a:hover,
#channel-name a:hover,
ytd-video-owner-renderer a:hover,
ytd-watch-metadata a.yt-simple-endpoint:hover {
  color: ${C.accent} !important;
}

/* Accent links: description / comments “show more”, hashtags, timestamps */
ytd-text-inline-expander a,
#description a,
#description-inline-expander a,
ytd-comment-view-model a,
ytd-comment-thread-renderer a,
tp-yt-paper-button#expand,
tp-yt-paper-button#collapse,
#expand,
#collapse,
.yt-core-attributed-string a,
.attributed-string a {
  color: ${C.accent} !important;
}

ytd-text-inline-expander a:hover,
#description a:hover,
.yt-core-attributed-string a:hover {
  color: ${C.accentHover} !important;
  text-decoration: underline !important;
}

/* Avatar rings */
#avatar img,
yt-img-shadow#avatar img,
ytd-channel-renderer #avatar img {
  border-radius: 9999px !important;
}

/* ── 6) Watch page ──────────────────────────────────────────────────────── */
/* Shell: pure black page bg — do NOT paint #columns pure-black in a way that
   swallows secondary/related after expand (v1.1.5 regression fix). */
ytd-watch-flexy,
ytd-watch-flexy[flexy],
ytd-watch-flexy[theater],
ytd-watch-flexy[full-bleed-player],
ytd-watch-flexy[default-layout],
ytd-watch-metadata,
#columns.ytd-watch-flexy,
#columns,
#primary.ytd-watch-flexy,
#primary,
#primary-inner,
#secondary.ytd-watch-flexy,
#secondary,
#secondary-inner,
#below,
#related,
#related-inner,
ytd-watch-next-secondary-results-renderer {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
}

/* Keep related / secondary content visible after description expand */
#secondary,
#secondary-inner,
#related,
#related-inner,
ytd-watch-next-secondary-results-renderer,
#secondary ytd-compact-video-renderer,
#secondary yt-lockup-view-model,
#items.ytd-watch-next-secondary-results-renderer {
  opacity: 1 !important;
  visibility: visible !important;
  color: ${C.text} !important;
}

/*
 * Player surround → pure black (player chrome only — not #columns / #secondary).
 * Root causes of non-black (screenshot audit 2026-08-05):
 *  A) Ambient Mode (#cinematics canvas) spills video-tinted glow
 *  B) YT hardcoded surfaces #0f0f0f / #212121 on chrome we didn't cover
 *  C) full-bleed layout wrappers still on default dark gray
 */
/* Player chrome black — NOT html5-video-container (was covering video paint) */
#player,
#player-container,
#player-container-inner,
#player-container-outer,
#player-container-outer.ytd-watch-flexy,
#ytd-player,
ytd-player,
ytd-player #container,
#full-bleed-container,
#full-bleed-container.ytd-watch-flexy,
#player-full-bleed-container,
#movie_player,
#movie_player.html5-video-player,
.html5-video-player,
#container.ytd-player,
#ytd-player.ytd-watch-flexy,
ytd-watch-flexy[full-bleed-player] #full-bleed-container,
ytd-watch-flexy[theater] #player-theater-container,
#player-theater-container,
#player-wide-container,
#primary.ytd-watch-flexy #player {
  background: #000 !important;
  background-color: #000 !important;
}

/* Keep video paint visible without replacing YouTube's player layout/stacking. */
.html5-video-container {
  background: transparent !important;
  background-color: transparent !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.html5-video-player video,
video.html5-main-video,
.html5-video-container video {
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  max-height: none !important;
}

/*
 * Poster plate under the player:
 * MUST stay visible as fallback (opacity:0 made menu/error states pure black).
 * Only clear solid fill; do not hide the node.
 */
.player-container-background,
.player-container-background.ytd-watch-flexy,
#player .player-container-background {
  background-color: transparent !important;
  pointer-events: none !important;
}
.player-container-background-image,
ytd-thumbnail.player-container-background-image {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: none !important;
}

/* Kill Ambient Mode / cinematic lighting around the player */
#cinematics,
#cinematics-container,
#cinematics.ytd-watch-flexy,
ytd-watch-flexy #cinematics,
ytd-watch-flexy #cinematics-container,
#cinematics canvas,
.ytp-cinematics,
.ytp-cinematics-container,
#player-cinematics,
ytd-watch-flexy[cinematic] #cinematics,
ytd-watch-flexy[ambient] #cinematics {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  background: transparent !important;
}

/* Engagement scrim must not solid-black the player */
#engagement-panel-scrim,
#engagement-panel-scrim.ytd-watch-flexy {
  background: transparent !important;
  pointer-events: none !important;
}
#engagement-panel-scrim:not([hidden]) {
  background: rgba(0, 0, 0, 0.4) !important;
  pointer-events: auto !important;
}

/*
 * Engagement / side panels: elevated + readable text (never empty pure-black void).
 * When a panel takes #secondary, related may hide — panel itself must look intentional.
 */
#panels.ytd-watch-flexy,
ytd-watch-flexy #panels,
#engagement-panel-container,
#panels-wrapper {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
  color: ${C.text} !important;
}

ytd-engagement-panel-section-list-renderer,
ytd-engagement-panel-title-header-renderer,
ytd-engagement-panel-section-list-renderer #content,
ytd-engagement-panel-section-list-renderer #body {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  color: ${C.text} !important;
  opacity: 1 !important;
  visibility: visible !important;
  border: none !important;
}

ytd-engagement-panel-section-list-renderer yt-formatted-string,
ytd-engagement-panel-title-header-renderer yt-formatted-string,
ytd-engagement-panel-section-list-renderer .yt-core-attributed-string,
ytd-engagement-panel-section-list-renderer #title,
ytd-engagement-panel-title-header-renderer #title {
  color: ${C.text} !important;
  opacity: 1 !important;
}

ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"] {
  display: none !important;
}

/*
 * Right rail visibility (from HTML audit):
 * - Modern layout: #related lives under #primary #below (not only #secondary)
 * - #secondary often only has empty #persistent-panel-container → pure black void
 * - Playlist panel uses --yt-lightsource-* which our pure-black parents kill
 */
ytd-watch-flexy #secondary,
ytd-watch-flexy #secondary-inner,
ytd-watch-flexy #related,
ytd-watch-flexy #related-inner,
ytd-watch-flexy ytd-watch-next-secondary-results-renderer,
ytd-watch-flexy #items.ytd-watch-next-secondary-results-renderer,
ytd-watch-flexy #below #related,
ytd-watch-flexy #primary #related {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
  opacity: 1 !important;
  visibility: visible !important;
  color: ${C.text} !important;
  pointer-events: auto !important;
}

/*
 * Fixed live chat uses #secondary as a full-viewport overlay in default view.
 * Keep that layout shell transparent/click-through; only the chat stays active.
 */
ytd-watch-flexy[default-layout][fixed-default-panels][live-chat-present-and-expanded] #secondary.ytd-watch-flexy {
  background: transparent !important;
  background-color: transparent !important;
  pointer-events: none !important;
}

ytd-watch-flexy[default-layout][fixed-default-panels][live-chat-present-and-expanded] #chat-container,
ytd-watch-flexy[default-layout][fixed-default-panels][live-chat-present-and-expanded] ytd-live-chat-frame#chat {
  pointer-events: auto !important;
}

/* Fixed playlists use the same full-viewport #secondary shell as live chat. */
ytd-watch-flexy[default-layout][fixed-default-panels][playlist-panel-expanded] #secondary.ytd-watch-flexy {
  background: transparent !important;
  background-color: transparent !important;
  pointer-events: none !important;
}

/* Avoid cross-fading a stale secondary-column snapshot between player modes. */
ytd-watch-flexy[playlist-panel-expanded] #secondary.ytd-watch-flexy {
  view-transition-name: none !important;
}

ytd-watch-flexy[default-layout][fixed-default-panels][playlist-panel-expanded] ytd-playlist-panel-renderer#playlist,
ytd-watch-flexy[default-layout][fixed-default-panels][playlist-panel-expanded] ytd-playlist-panel-renderer #container {
  pointer-events: auto !important;
}

/* Related lockups (grid / sidebar) — force readable chrome */
ytd-watch-flexy #related yt-lockup-view-model,
ytd-watch-flexy #related .ytLockupViewModelHost,
ytd-watch-flexy #secondary yt-lockup-view-model,
ytd-watch-flexy #secondary ytd-compact-video-renderer,
ytd-watch-flexy ytd-watch-next-secondary-results-renderer yt-lockup-view-model {
  opacity: 1 !important;
  visibility: visible !important;
  background: transparent !important;
  color: ${C.text} !important;
}

ytd-watch-flexy #related a,
ytd-watch-flexy #related h3,
ytd-watch-flexy #related span,
ytd-watch-flexy #related yt-formatted-string,
ytd-watch-flexy #related .yt-core-attributed-string,
ytd-watch-flexy #related #video-title,
ytd-watch-flexy #related .ytLockupMetadataViewModelTitle,
ytd-watch-flexy #related .yt-lockup-metadata-view-model-wiz__title,
ytd-watch-flexy #related .yt-lockup-metadata-view-model__title,
ytd-watch-flexy #secondary #video-title,
ytd-watch-flexy #secondary a,
ytd-watch-flexy #secondary yt-formatted-string,
ytd-watch-flexy #secondary .yt-core-attributed-string {
  opacity: 1 !important;
  visibility: visible !important;
  color: ${C.text} !important;
}

ytd-watch-flexy #related .yt-content-metadata-view-model-wiz__metadata-text,
ytd-watch-flexy #related #metadata-line,
ytd-watch-flexy #related .ytLockupMetadataViewModelMetadata {
  color: ${C.textSecondary} !important;
  opacity: 1 !important;
}

/* Playlist panel (often the right rail on playlist watch) */
ytd-playlist-panel-renderer,
#playlist.ytd-watch-flexy,
ytd-playlist-panel-renderer #container,
ytd-playlist-panel-renderer #header,
ytd-playlist-panel-renderer #header-content,
ytd-playlist-panel-renderer #publisher-container,
ytd-playlist-panel-renderer #playlist-items,
ytd-playlist-panel-renderer #items,
ytd-playlist-panel-video-renderer {
  --yt-lightsource-section1-color: ${C.bg} !important;
  --yt-lightsource-section2-color: ${C.bgElevated} !important;
  --yt-lightsource-section3-color: ${C.bgElevated} !important;
  --yt-lightsource-section4-color: ${C.bgElevated} !important;
  --yt-lightsource-primary-title-color: ${C.text} !important;
  --yt-lightsource-secondary-title-color: ${C.textSecondary} !important;
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  color: ${C.text} !important;
  border: none !important;
  opacity: 1 !important;
  visibility: visible !important;
}

ytd-playlist-panel-renderer #title,
ytd-playlist-panel-renderer h3,
ytd-playlist-panel-renderer yt-formatted-string,
ytd-playlist-panel-video-renderer #video-title,
ytd-playlist-panel-video-renderer yt-formatted-string,
ytd-playlist-panel-video-renderer #byline {
  color: ${C.text} !important;
  opacity: 1 !important;
}

ytd-playlist-panel-video-renderer:hover {
  background: ${C.bgHover} !important;
}

ytd-playlist-panel-renderer .header,
ytd-playlist-panel-renderer yt-formatted-string.publisher {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
}

/* Don't let empty secondary rail paint a dead black slab over content */
ytd-watch-flexy #persistent-panel-container:empty {
  display: none !important;
}

/* Action row under player: kill YT #212121 tonal chips → pure black / subtle hover */
ytd-watch-metadata #actions,
ytd-watch-metadata #top-row,
ytd-watch-metadata #actions-inner,
#actions.ytd-watch-metadata,
ytd-menu-renderer.ytd-watch-metadata,
ytd-segmented-like-dislike-button-renderer,
like-button-view-model,
dislike-button-view-model,
.yt-spec-button-shape-next--tonal {
  --yt-spec-button-chip-background-hover: ${C.bgHoverStrong} !important;
}

.yt-spec-button-shape-next--tonal,
.ytSpecButtonShapeNextTonal {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
}

/* Remove the full-width rim light that draws a hairline over both segments. */
segmented-like-dislike-button-view-model
  yt-light-shape.ytSegmentedLikeDislikeButtonViewModelLightShape {
  display: none !important;
}

/* Action buttons under title */
ytd-menu-renderer,
ytd-segmented-like-dislike-button-renderer,
like-button-view-model,
dislike-button-view-model,
.yt-spec-button-shape-next--tonal {
  --yt-spec-button-chip-background-hover: ${C.bgHoverStrong} !important;
}

/* Pill action buttons */
.yt-spec-button-shape-next--tonal,
.yt-spec-button-shape-next--filled,
.ytSpecButtonShapeNextTonal,
.ytSpecButtonShapeNextFilled,
ytd-subscribe-button-renderer .yt-spec-button-shape-next,
ytd-subscribe-button-renderer .ytSpecButtonShapeNextHost {
  border-radius: 9999px !important;
  font-family: ${FONT} !important;
  font-weight: 700 !important;
}

/* Subscribe → white CTA
 * 2026 buttons use ytSpecButtonShapeNext* (old BEM yt-spec-button-shape-next--* still
 * appears on some hosts). Inner attributed-string inherits --yt-spec-text-primary
 * unless we paint the text host too — that was white-on-white. */
ytd-subscribe-button-renderer .yt-spec-button-shape-next--filled,
ytd-subscribe-button-renderer .ytSpecButtonShapeNextFilled,
#subscribe-button .yt-spec-button-shape-next--filled,
#subscribe-button .ytSpecButtonShapeNextFilled,
button.yt-spec-button-shape-next--filled[aria-label*="Subscribe"],
button.yt-spec-button-shape-next--filled[aria-label*="訂閱"],
button.ytSpecButtonShapeNextFilled[aria-label*="Subscribe"],
button.ytSpecButtonShapeNextFilled[aria-label*="訂閱"] {
  background: ${C.cta} !important;
  color: ${C.ctaText} !important;
  border: none !important;
}

ytd-subscribe-button-renderer .yt-spec-button-shape-next--filled:hover,
ytd-subscribe-button-renderer .ytSpecButtonShapeNextFilled:hover,
#subscribe-button .ytSpecButtonShapeNextFilled:hover {
  background: #d7dbdc !important;
}

ytd-subscribe-button-renderer .ytSpecButtonShapeNextFilled .ytSpecButtonShapeNextButtonTextContent,
ytd-subscribe-button-renderer .ytSpecButtonShapeNextFilled .ytAttributedStringHost,
#subscribe-button .ytSpecButtonShapeNextFilled .ytSpecButtonShapeNextButtonTextContent,
#subscribe-button .ytSpecButtonShapeNextFilled .ytAttributedStringHost,
.ytSpecButtonShapeNextFilled.ytSpecButtonShapeNextMono .ytSpecButtonShapeNextButtonTextContent,
.ytSpecButtonShapeNextFilled.ytSpecButtonShapeNextMono .ytAttributedStringHost {
  color: ${C.ctaText} !important;
  -webkit-text-fill-color: ${C.ctaText} !important;
}

/* Comments panels */
ytd-comments,
ytd-comments-header-renderer,
ytd-comment-thread-renderer,
ytd-comment-view-model {
  background: transparent !important;
  color: ${C.text} !important;
  border: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

/*
 * Watch description elevated card:
 * - Outer shell only; spacing from actions above + right column
 * - No 1px solid border
 */
#description,
#description.ytd-watch-metadata,
ytd-watch-metadata #description {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  border: none !important;
  border-width: 0 !important;
  border-color: transparent !important;
  border-style: none !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  outline: none !important;
  padding: 12px 14px !important;
  margin: 12px 12px 0 0 !important; /* top + right breathing room */
  box-sizing: border-box !important;
}

ytd-watch-metadata #bottom-row,
ytd-watch-metadata #description-inner {
  margin-top: 0 !important;
}

/* Keep description off the related column */
ytd-watch-metadata,
#primary-inner ytd-watch-metadata {
  padding-right: 0 !important;
  margin-right: 0 !important;
}

#below ytd-watch-metadata #description,
#primary ytd-watch-metadata #description {
  max-width: 100% !important;
}

/* Inner shells: transparent so padding doesn't stack */
ytd-watch-metadata #description-inner,
#description-inner,
#description-inline-expander,
ytd-text-inline-expander#description-inline-expander,
ytd-watch-metadata ytd-text-inline-expander,
#description ytd-text-inline-expander,
#description #description-inline-expander,
#description ytd-structured-description-content-renderer,
ytd-structured-description-content-renderer {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Linked-video lockups inside expanded description → elevated surface */
ytd-structured-description-video-lockup-renderer,
#description ytd-structured-description-video-lockup-renderer,
ytd-video-description-infocards-section-renderer ytd-structured-description-video-lockup-renderer,
ytd-horizontal-card-list-renderer ytd-structured-description-video-lockup-renderer {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  border: none !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}

/* Related sidebar cards */
ytd-compact-video-renderer,
ytd-watch-next-secondary-results-renderer,
#secondary yt-lockup-view-model,
#related yt-lockup-view-model {
  background: transparent !important;
  font-family: ${FONT} !important;
}

/* Watch meta thread spacing */
ytd-watch-metadata #title,
ytd-watch-metadata #top-row,
ytd-watch-metadata #middle-row,
ytd-watch-metadata #bottom-row {
  font-family: ${FONT} !important;
}

ytd-watch-metadata h1,
ytd-watch-metadata #title,
ytd-watch-metadata #title yt-formatted-string {
  -webkit-user-select: text !important;
  user-select: text !important;
}

/* ── 7) Buttons & menus ─────────────────────────────────────────────────── */
/*
 * Watch ⋮ open → player goes black:
 * Broad elevated/z-index on contentWrapper + list-view-model covered the player.
 * Keep hosts transparent; only size-constrained menu cards get elevated.
 */
ytd-popup-container,
tp-yt-iron-dropdown,
iron-dropdown {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Backdrop: soft dim, never solid black over player */
tp-yt-iron-overlay-backdrop,
.iron-overlay-backdrop {
  background-color: rgba(0, 0, 0, 0.25) !important;
}

/* Menu CARD only — compact, must not span the player */
ytd-menu-popup-renderer,
ytd-menu-popup-renderer tp-yt-paper-listbox,
tp-yt-iron-dropdown ytd-menu-popup-renderer,
tp-yt-iron-dropdown tp-yt-paper-listbox.ytd-menu-popup-renderer,
tp-yt-paper-listbox.ytd-menu-popup-renderer,
ytd-popup-container ytd-menu-popup-renderer,
ytd-menu-popup-renderer yt-list-view-model {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  border: 1px solid ${C.border} !important;
  border-radius: 16px !important;
  box-shadow: 0 0 0 1px ${C.border}, 0 8px 28px rgba(0, 0, 0, 0.55) !important;
  color: ${C.text} !important;
  opacity: 1 !important;
  visibility: visible !important;
  max-width: min(320px, 90vw) !important;
  width: max-content !important;
  min-width: 180px !important;
  max-height: min(70vh, 480px) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

/* contentWrapper: transparent shell; allow all available viewport height. */
tp-yt-iron-dropdown #contentWrapper,
#contentWrapper.style-scope.tp-yt-iron-dropdown {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  max-width: min(320px, 90vw) !important;
  max-height: 100vh !important;
  max-height: 100dvh !important;
}

/* Dialogs (settings etc.) — not full-screen black */
tp-yt-paper-dialog {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  border: 1px solid ${C.border} !important;
  border-radius: 16px !important;
  box-shadow: 0 0 0 1px ${C.border}, 0 8px 28px rgba(0, 0, 0, 0.55) !important;
  color: ${C.text} !important;
}

/* Menu item labels — scoped to menu popup only */
ytd-menu-popup-renderer ytd-menu-service-item-renderer,
ytd-menu-popup-renderer ytd-menu-navigation-item-renderer,
ytd-menu-popup-renderer ytd-toggle-menu-service-item-renderer,
ytd-menu-popup-renderer tp-yt-paper-item,
ytd-menu-popup-renderer yt-list-item-view-model,
ytd-menu-popup-renderer yt-formatted-string,
ytd-menu-popup-renderer .yt-core-attributed-string,
ytd-menu-service-item-renderer yt-formatted-string,
ytd-menu-service-item-renderer .yt-spec-icon-shape,
ytd-menu-service-item-renderer yt-icon {
  color: ${C.text} !important;
  fill: ${C.text} !important;
  background: transparent !important;
  opacity: 1 !important;
  visibility: visible !important;
}

ytd-menu-popup-renderer ytd-menu-service-item-renderer:hover,
ytd-menu-popup-renderer ytd-menu-navigation-item-renderer:hover,
ytd-menu-popup-renderer tp-yt-paper-item:hover,
ytd-menu-popup-renderer yt-list-item-view-model:hover {
  background: ${C.bgHover} !important;
  color: ${C.text} !important;
}

/* Player stays above page black while menus open */
ytd-watch-flexy #player,
ytd-watch-flexy #ytd-player,
ytd-watch-flexy ytd-player,
ytd-watch-flexy #movie_player {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Primary filled buttons → blue CTA */
.yt-spec-button-shape-next--filled.yt-spec-button-shape-next--call-to-action,
.yt-spec-button-shape-next--call-to-action.yt-spec-button-shape-next--filled,
.ytSpecButtonShapeNextFilled.ytSpecButtonShapeNextCallToAction {
  background: ${C.accent} !important;
  color: #fff !important;
  border-radius: 9999px !important;
}

.ytSpecButtonShapeNextFilled.ytSpecButtonShapeNextCallToAction .ytSpecButtonShapeNextButtonTextContent,
.ytSpecButtonShapeNextFilled.ytSpecButtonShapeNextCallToAction .ytAttributedStringHost {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

/* Mono filled (Save / Create / Subscribe) */
.yt-spec-button-shape-next--filled.yt-spec-button-shape-next--mono,
.ytSpecButtonShapeNextFilled.ytSpecButtonShapeNextMono {
  background: ${C.cta} !important;
  color: ${C.ctaText} !important;
  border-radius: 9999px !important;
}

.yt-spec-button-shape-next--outline {
  border-color: ${C.border} !important;
  color: ${C.text} !important;
  border-radius: 9999px !important;
}

/* ── 8) Scrollbars — thin ────────────────────────────────────────── */
html {
  scrollbar-color: ${C.border} ${C.bg} !important;
  scrollbar-width: thin !important;
}

::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}
::-webkit-scrollbar-track {
  background: ${C.bg} !important;
}
::-webkit-scrollbar-thumb {
  background: ${C.border} !important;
  border-radius: 9999px !important;
}
::-webkit-scrollbar-thumb:hover {
  background: ${C.textSecondary} !important;
}

/* ── 9) Links & selection ───────────────────────────────────────────────── */
a {
  color: inherit;
}
a:hover {
  color: inherit;
}

::selection {
  background: ${C.accentMuted} !important;
  color: ${C.text} !important;
}

/* Progress bar under masthead */
yt-page-navigation-progress,
#progress.yt-page-navigation-progress {
  background: ${C.accent} !important;
}

/* Skeleton / loading */
ytd-ghost-grid-renderer,
#home-page-skeleton,
.skeleton-bg-color {
  background: ${C.bg} !important;
  --yt-ghost-primary: ${C.bgElevated} !important;
}

/* ── 10) Search results page ────────────────────────────────────────────── */
ytd-search,
ytd-two-column-search-results-renderer,
ytd-section-list-renderer {
  background: ${C.bg} !important;
}

/* Results list top rule — remove */
ytd-search-sub-menu-renderer,
ytd-search-sub-menu-renderer #filter-menu,
#filter-menu.ytd-search-sub-menu-renderer,
ytd-search ytd-section-list-renderer,
ytd-search #header,
ytd-two-column-search-results-renderer #primary,
ytd-search ytd-item-section-renderer {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

ytd-search ytd-item-section-renderer,
ytd-search ytd-video-renderer {
  border: none !important;
  border-top: none !important;
  box-shadow: none !important;
}

/*
 * Official artist card (search): cinematic header fades a banner into the
 * extracted theme color on the host (e.g. rgb(66,66,66)). Channel chrome
 * paint was matching yt-page-header-view-model / .ytPageHeaderViewModelHost
 * here and filling the left of .ytOfficialCardViewModelHeaderContainer with
 * #000. Keep that header transparent so the card theme shows through.
 */
yt-official-card-view-model yt-page-header-view-model,
yt-official-card-view-model .ytPageHeaderViewModelHost,
.ytOfficialCardViewModelHeaderContainer {
  background: transparent !important;
  background-color: transparent !important;
}

yt-official-card-view-model .ytCinematicContainerViewModelFadeToThemeImage,
yt-official-card-view-model .ytCinematicContainerViewModelFadeToThemeImage.ytCoreImageHost {
  border-radius: 0 !important;
  background: transparent !important;
}

/* ── 11) Channel page ───────────────────────────────────────────────────── */
/*
 * Screenshot 12.44.45: banner letterbox + tab strip still #0f0f0f / #0c0c0c;
 * featured description card bottom washed to pure black. Force Lights Out.
 */
ytd-browse[page-subtype="channels"],
ytd-browse[page-subtype="channels"] #content,
ytd-browse[page-subtype="channels"] #page-manager,
ytd-browse[page-subtype="channels"] ytd-page-manager,
ytd-browse[page-subtype="channels"] ytd-two-column-browse-results-renderer,
ytd-browse[page-subtype="channels"] #columns,
ytd-browse[page-subtype="channels"] #primary,
ytd-browse[page-subtype="channels"] #primary-inner,
ytd-browse[page-subtype="channels"] #secondary,
ytd-browse[page-subtype="channels"] #contents,
ytd-browse[page-subtype="channels"] ytd-section-list-renderer,
ytd-browse[page-subtype="channels"] ytd-rich-grid-renderer,
ytd-browse[page-subtype="channels"] ytd-item-section-renderer,
/* Legacy + modern channel headers.
 * Do NOT unscoped-match yt-page-header-view-model / .ytPageHeaderViewModelHost
 * — search official cards reuse those as the cinematic header. */
ytd-c4-tabbed-header-renderer,
ytd-tabbed-page-header,
yt-page-header-renderer,
ytd-browse[page-subtype="channels"] yt-page-header-view-model,
ytd-browse[page-subtype="channels"] .ytPageHeaderViewModelHost,
#channel-header,
#channel-header-container,
ytd-browse[page-subtype="channels"] #channel-container,
#channel-header-content,
#page-header,
#page-header-container,
#header.ytd-c4-tabbed-header-renderer,
#contents.ytd-c4-tabbed-header-renderer,
#channel-container.ytd-c4-tabbed-header-renderer,
#banner-wrapper,
#header-banner,
#banner,
#channel-header-banner,
yt-image-banner-view-model,
#background.ytd-c4-tabbed-header-renderer,
#contentContainer.ytd-c4-tabbed-header-renderer,
#contentContainer.ytd-tabbed-page-header,
/* Letterbox beside banner image (was #0f0f0f) */
ytd-c4-tabbed-header-renderer::before,
ytd-tabbed-page-header::before,
#channel-header::before {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
  background-image: none !important;
}

/* Keep banner IMAGE visible — only paint the chrome around it */
ytd-c4-tabbed-header-renderer #banner img,
ytd-c4-tabbed-header-renderer yt-img-shadow img,
yt-image-banner-view-model img,
#banner img,
#channel-header-banner img {
  background: transparent !important;
}

/* Tab row: pure black bg + KEEP bottom divider (same as theme hairline) */
#tabs-inner-container,
#tabs-inner-container.ytd-c4-tabbed-header-renderer,
#tabs-inner-container.ytd-tabbed-page-header,
#tabs-container,
#tabs.ytd-c4-tabbed-header-renderer,
#tabs.ytd-tabbed-page-header,
ytd-c4-tabbed-header-renderer tp-yt-paper-tabs,
ytd-tabbed-page-header tp-yt-paper-tabs,
tp-yt-paper-tabs,
tp-yt-paper-tabs#tabs,
#tabsContent,
yt-tab-list-renderer,
yt-tab-list-view-model,
.ytTabListViewModelHost,
#tabs-container.ytd-c4-tabbed-header-renderer,
#channel-header #tabs,
ytd-browse[page-subtype="channels"] #tabs-inner-container,
ytd-browse[page-subtype="channels"] tp-yt-paper-tabs {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
  border: none !important;
  border-top: none !important;
  border-bottom: 1px solid ${C.border} !important; /* keep divider */
  box-shadow: none !important;
  --paper-tabs-selection-bar-color: ${C.text} !important;
}

yt-tab-shape,
yt-tab-shape-wizard {
  background: transparent !important;
  background-color: transparent !important;
}

/*
 * Featured top video:
 * - Page shell pure black (match rest of channel)
 * - ONLY description / meta card elevated (not the whole renderer)
 */
ytd-channel-video-player-renderer,
ytd-channel-featured-content-renderer,
ytd-item-section-renderer ytd-channel-video-player-renderer,
ytd-channel-video-player-renderer #container,
ytd-channel-video-player-renderer #contents,
ytd-channel-video-player-renderer #root,
ytd-channel-video-player-renderer #body {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
  border: none !important;
  box-shadow: none !important;
}

ytd-channel-video-player-renderer #player,
ytd-channel-video-player-renderer ytd-player,
ytd-channel-video-player-renderer #player-container,
ytd-channel-video-player-renderer #movie_player,
ytd-channel-video-player-renderer #media-container,
ytd-channel-video-player-renderer #media-container-link {
  background: #000 !important;
  background-color: #000 !important;
}

/* Description / title card only → elevated #16181c */
ytd-channel-video-player-renderer #content-section,
ytd-channel-video-player-renderer #description,
ytd-channel-video-player-renderer #description-container,
ytd-channel-video-player-renderer #description-inner,
ytd-channel-video-player-renderer ytd-expandable-video-description-body-renderer,
ytd-channel-video-player-renderer ytd-text-inline-expander,
ytd-expandable-video-description-body-renderer,
ytd-channel-video-player-renderer #meta,
ytd-channel-video-player-renderer #info-section,
ytd-channel-video-player-renderer #info,
ytd-channel-video-player-renderer #top-row,
ytd-channel-video-player-renderer #bottom-row {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  color: ${C.text} !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 12px !important;
}

ytd-channel-video-player-renderer #description yt-formatted-string,
ytd-channel-video-player-renderer #title,
ytd-channel-video-player-renderer h1,
ytd-channel-video-player-renderer h2,
ytd-channel-video-player-renderer #video-title,
ytd-expandable-video-description-body-renderer yt-formatted-string,
ytd-channel-video-player-renderer .yt-core-attributed-string {
  color: ${C.text} !important;
  background: transparent !important;
}

/* Channel page shells that still leak YT #0f0f0f */
ytd-browse[page-subtype="channels"] ytd-app,
ytd-browse[page-subtype="channels"] #page-header-inline-metadata,
ytd-browse[page-subtype="channels"] #inner-header-container,
#inner-header-container,
#meta.ytd-c4-tabbed-header-renderer,
#channel-tagline,
#channel-name.ytd-c4-tabbed-header-renderer {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
}

/* ── 12) Shorts shelf / rich shelves — no divider lines ─────────────────── */
ytd-rich-shelf-renderer,
ytd-reel-shelf-renderer,
ytd-rich-section-renderer {
  border: none !important;
  border-bottom: none !important;
  border-top: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* ── 13) Notifications panel ────────────────────────────────────────────── */
#channel-container.ytd-active-account-header-renderer {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
}

ytd-notification-renderer,
ytd-multi-page-menu-renderer {
  background: ${C.bgElevated} !important;
  color: ${C.text} !important;
  border-color: ${C.border} !important;
}

/* ── 14) Tooltips ───────────────────────────────────────────────────────── */
#tooltip.tp-yt-paper-tooltip {
  background: ${C.bgElevated} !important;
  color: ${C.text} !important;
  border: 1px solid ${C.border} !important;
  border-radius: 8px !important;
  font-family: ${FONT} !important;
}

/* ── 15) Live chat (when open) ──────────────────────────────────────────── */
yt-live-chat-renderer,
yt-live-chat-header-renderer,
yt-live-chat-item-list-renderer,
#chat {
  --yt-live-chat-background-color: ${C.bg} !important;
  --yt-live-chat-primary-text-color: ${C.text} !important;
  --yt-live-chat-secondary-text-color: ${C.textSecondary} !important;
  --yt-live-chat-tertiary-text-color: ${C.textSecondary} !important;
  --yt-live-chat-header-background-color: ${C.bgElevated} !important;
  --yt-live-chat-action-panel-background-color: ${C.bgElevated} !important;
  --yt-live-chat-vem-background-color: ${C.bgElevated} !important;
  --yt-live-chat-mode-change-background-color: ${C.bgElevated} !important;
  background: ${C.bg} !important;
  border-color: ${C.border} !important;
}

/* ── 16) Misc chrome polish ─────────────────────────────────────────────── */
/* Force pure black shell — YT dark defaults to #0f0f0f / #212121 otherwise */
ytd-app,
#content.ytd-app,
#page-manager,
#page-manager > *,
ytd-browse,
ytd-two-column-browse-results-renderer,
#primary,
#secondary,
#columns,
#contents.ytd-rich-grid-renderer,
#container.ytd-app {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
}

/* Catch common YT gray surfaces that ignore tokens */
ytd-browse[page-subtype],
ytd-watch-flexy[flexy],
#page-header,
#header.ytd-rich-grid-renderer,
#frosted-glass.ytd-app,
#chips-wrapper.ytd-feed-filter-chip-bar-renderer {
  background: ${C.bg} !important;
  background-color: ${C.bg} !important;
}

/* Guide hamburger hover */
#guide-button yt-icon-button,
#guide-button button {
  border-radius: 9999px !important;
}

/* Explicit ads / promotional commerce clutter */
ytd-mealbar-promo-renderer,
ytd-popup-container ytd-mealbar-promo-renderer,
ytd-banner-promo-renderer-legacy,
ytd-primetime-promo-renderer,
ytd-promo-panel-renderer,
#masthead-ad,
ytd-ad-slot-renderer,
ytd-in-feed-ad-layout-renderer,
ytd-display-ad-renderer,
ytd-promoted-sparkles-web-renderer,
ytd-promoted-video-renderer,
ytd-player-legacy-desktop-watch-ads-renderer,
#player-ads,
.ytp-ad-module,
ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
ytd-watch-flexy ytd-merch-shelf-renderer,
ytd-watch-metadata ytd-ticket-shelf-renderer,
/* NOTE: do NOT hide ytd-info-panel-content-renderer — expand panels need it */
yt-mealbar-promo-renderer {
  display: none !important;
}

/* Keep action feedback readable. */
tp-yt-paper-toast {
  background: ${C.bgElevated} !important;
  border: 1px solid ${C.border} !important;
  color: ${C.text} !important;
  border-radius: 16px !important;
}

/* Focus rings → blue */
:focus-visible {
  outline: 2px solid ${C.accent} !important;
  outline-offset: 2px !important;
}

/* Hide "YouTube" red brand intensity on some badges */
.badge-style-type-live-now,
.badge-style-type-simple.ytd-badge-supported-renderer {
  border-radius: 4px !important;
}

/* Resume / progress bars under thumbnails → blue accent */
#progress.ytd-thumbnail-overlay-resume-playback-renderer,
ytd-thumbnail-overlay-resume-playback-renderer #progress,
.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment,
.YtThumbnailOverlayProgressBarHostWatchedProgressBarSegment,
.ytThumbnailOverlayProgressBarHostProgressBar {
  background: ${C.accent} !important;
  height: 3px !important;
}

/* Player scrubber / played progress → subtle blue (still readable on video) */
.ytp-play-progress,
.ytp-swatch-background-color,
.ytp-swatch-color {
  background: ${C.accent} !important;
  background-color: ${C.accent} !important;
  color: ${C.accent} !important;
}

.ytp-scrubber-button,
.ytp-scrubber-button.ytp-swatch-background-color {
  background: ${C.accent} !important;
  border-color: ${C.accent} !important;
}

.ytp-volume-slider-handle:before,
.ytp-volume-slider-track {
  background: ${C.accent} !important;
}

/* Native played track ends at the handle centre; clip its last 6px so the
   recoloured line stops at the edge of the 12px white handle.
   Delhi still paints the level with this ::before (no .ytp-volume-slider-track). */
.ytp-volume-slider-handle:before,
.ytp-delhi-modern .ytp-volume-slider-handle:before,
.ytp-delhi-horizontal-volume-controls .ytp-volume-slider-handle:before {
  clip-path: inset(0 6px 0 0) !important;
}

/*
 * Delhi player (ytp-delhi-modern, 2025–2026 default web player).
 * Recolor overlay tokens on the player host so pills / popups follow Lights Out
 * without fighting Delhi layout (pill height, compact controls, fullscreen grid).
 */
.html5-video-player,
.html5-video-player.ytp-delhi-modern,
#movie_player,
#movie_player.ytp-delhi-modern {
  --yt-sys-color-baseline--overlay-background-medium-light: rgba(22, 24, 28, 0.72) !important;
  --yt-sys-color-baseline--overlay-background-medium: ${C.bgElevated} !important;
  --yt-sys-color-baseline--overlay-background-heavy: ${C.bgElevated} !important;
  --yt-sys-color-baseline--overlay-background-solid: ${C.bg} !important;
  --yt-sys-color-baseline--overlay-call-to-action: ${C.accent} !important;
  --yt-sys-color-baseline--overlay-call-to-action-hover: ${C.accentHover} !important;
  --yt-sys-color-baseline--overlay-text-primary: ${C.text} !important;
  --yt-sys-color-baseline--overlay-text-secondary: ${C.textSecondary} !important;
  --yt-sys-color-baseline--frosted-glass-desktop: rgba(22, 24, 28, 0.85) !important;
  --yt-sys-color-baseline--frosted-glass-mobile: rgba(22, 24, 28, 0.85) !important;
}

/* Settings / context cards: elevated, not 60% black glass over the video */
.ytp-popup.ytp-settings-menu,
.ytp-popup.ytp-contextmenu,
.ytp-popup.ytp-delhi-modern-contextmenu,
.ytp-delhi-modern .ytp-popup.ytp-settings-menu,
.ytp-delhi-modern .ytp-popup.ytp-contextmenu {
  background: ${C.bgElevated} !important;
  background-color: ${C.bgElevated} !important;
  border: 1px solid ${C.border} !important;
  border-radius: 16px !important;
  box-shadow: 0 0 0 1px ${C.border}, 0 8px 28px rgba(0, 0, 0, 0.55) !important;
  color: ${C.text} !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.ytp-settings-menu .ytp-menuitem,
.ytp-settings-menu .ytp-menuitem-label,
.ytp-contextmenu .ytp-menuitem,
.ytp-contextmenu .ytp-menuitem-label {
  color: ${C.text} !important;
}

.ytp-settings-menu .ytp-menuitem-content,
.ytp-contextmenu .ytp-menuitem-content {
  color: ${C.textSecondary} !important;
}

.ytp-settings-menu .ytp-menuitem:hover,
.ytp-contextmenu .ytp-menuitem:hover {
  background: ${C.bgHover} !important;
}

/* ── 17) Optional: slightly denser home grid like timeline ──────────────── */
ytd-rich-grid-renderer {
  --ytd-rich-grid-item-margin: 16px !important;
}

/* Mobile (m.youtube.com) light touches */
ytm-app,
.page-container {
  background: ${C.bg} !important;
  color: ${C.text} !important;
}

/* Mobile search — composer pill */
ytm-searchbox,
.mobile-topbar-header-content input {
  background: ${C.composerBg} !important;
  border: none !important;
  border-color: transparent !important;
  outline: none !important;
  box-shadow: inset 0 0 0 1px ${C.composerRing} !important;
  color: ${C.text} !important;
  border-radius: ${C.composerRadius} !important;
  font-family: ${FONT} !important;
  min-height: 44px !important;
  padding: 0 16px !important;
}
`;

  let styleElement = null;
  let staleStylesPurged = false;

  function isThemeStyle(node) {
    return !!(node.textContent && node.textContent.includes('trueblackyt'));
  }

    function injectStyle() {
    if (styleElement && styleElement.isConnected) return;

    // Purge version-upgrade / GM_addStyle orphans once, not on every SPA event.
    if (!staleStylesPurged) {
      try {
        document.querySelectorAll('style').forEach((node) => {
          if (node.id !== STYLE_ID && isThemeStyle(node)) node.remove();
        });
      } catch (_) { /* ignore */ }
      staleStylesPurged = true;
    }

        let el = document.getElementById(STYLE_ID);
        if (el) {
      if (el.textContent !== CSS) el.textContent = CSS;
      styleElement = el;
            return;
        }

        if (typeof GM_addStyle === 'function') {
            const created = GM_addStyle(CSS);
            if (created && created.nodeType === 1) {
                created.id = STYLE_ID;
              styleElement = created;
                return;
            }
            // GM_addStyle may not return the element — locate by marker text
            const styles = document.querySelectorAll('style');
            for (let i = styles.length - 1; i >= 0; i--) {
                const node = styles[i];
                if (node.textContent && node.textContent.includes(`trueblackyt ${VERSION}`)) {
                    node.id = STYLE_ID;
                  styleElement = node;
                    return;
                }
            }
        }

        el = document.createElement('style');
        el.id = STYLE_ID;
        el.textContent = CSS;
        (document.head || document.documentElement).appendChild(el);
        styleElement = el;
    }

    function removeStyle() {
        const el = styleElement || document.getElementById(STYLE_ID);
        if (el) el.remove();
        styleElement = null;
        // GM_addStyle may inject without our id; remove every legacy version on OFF.
        document.querySelectorAll('style').forEach((node) => {
            if (isThemeStyle(node)) node.remove();
        });
    }

    let managedGuide = null;
    let originalGuideSwipeOpen = false;
    let originalGuideSwipeAttribute = false;

    function restoreGuideSwipe() {
        if (!managedGuide) return;
        managedGuide.swipeOpen = originalGuideSwipeOpen;
        if (originalGuideSwipeAttribute) managedGuide.setAttribute('swipe-open', '');
        else managedGuide.removeAttribute('swipe-open');
        managedGuide = null;
    }

    function syncGuideSwipe() {
        const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
        const guide = document.querySelector('tp-yt-app-drawer#guide');
        if (!enabled || !finePointer || !guide || !('swipeOpen' in guide)) {
            restoreGuideSwipe();
            return;
        }

        if (managedGuide !== guide) {
            restoreGuideSwipe();
            managedGuide = guide;
            originalGuideSwipeOpen = guide.swipeOpen;
            originalGuideSwipeAttribute = guide.hasAttribute('swipe-open');
        }
        guide.swipeOpen = false;
        guide.removeAttribute('swipe-open');
    }

    const addedDarkAttrs = new Set();

    function ensureDarkAttr() {
        // Prefer native dark so YT's own dark tokens load; we override them
        try {
            const root = document.documentElement;
            ['dark', 'darker-dark-theme'].forEach((attr) => {
                if (root.hasAttribute(attr)) return;
                root.setAttribute(attr, '');
                addedDarkAttrs.add(attr);
            });
        } catch (_) { /* ignore */ }
    }

    function restoreDarkAttrs() {
        try {
            const root = document.documentElement;
            addedDarkAttrs.forEach((attr) => root.removeAttribute(attr));
            addedDarkAttrs.clear();
        } catch (_) { /* ignore */ }
    }

    function apply() {
        if (!enabled) {
            removeStyle();
            restoreGuideSwipe();
            restoreDarkAttrs();
            return;
        }
        ensureDarkAttr();
        injectStyle();
        syncGuideSwipe();
    }

    function setEnabled(next) {
        enabled = !!next;
        store.set(ENABLED_KEY, enabled);
        apply();
        console.info(`[trueblackyt ${VERSION}] ${enabled ? 'ON' : 'OFF'}`);
    }

    // Early inject (document-start)
    apply();

    // Re-assert after head appears / SPA navigations (YouTube may wipe styles rarely)
    const reassert = () => {
        if (!enabled) return;
        ensureDarkAttr();
        injectStyle();
        syncGuideSwipe();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', reassert, { once: true });
    } else {
        reassert();
    }

    document.addEventListener('yt-navigate-finish', reassert);
    document.addEventListener('yt-page-data-updated', reassert);

    if (typeof customElements !== 'undefined') {
        customElements.whenDefined('tp-yt-app-drawer').then(syncGuideSwipe).catch(() => {});
    }

    // MutationObserver: if YT replaces <html> attributes
    try {
        const obs = new MutationObserver(() => {
            if (enabled) ensureDarkAttr();
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['dark', 'darker-dark-theme'] });
    } catch (_) { /* ignore */ }

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('trueblackyt Theme: Toggle ON/OFF', () => setEnabled(!enabled));
        GM_registerMenuCommand('trueblackyt Theme: Force ON', () => setEnabled(true));
        GM_registerMenuCommand('trueblackyt Theme: Force OFF', () => setEnabled(false));
    }

    // Debug handle
    try {
        W.trueblackytTheme = {
            version: VERSION,
            get enabled() { return enabled; },
            enable: () => setEnabled(true),
            disable: () => setEnabled(false),
            toggle: () => setEnabled(!enabled),
            colors: C
        };
    } catch (_) { /* ignore */ }

    console.info(`[trueblackyt ${VERSION}] Ready (${enabled ? 'ON' : 'OFF'})`);
})();
