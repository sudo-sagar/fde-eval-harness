# Cursor-Powered PR Review Loop Results

## pr_cos_23.diff
**Change:** Widens counter configSchema with new admin fields (enabled, estimatedUsers, specialDates, pending, etc.) and sets additionalProperties:true, plus a GET test that the form’s arrays exist.
**AI Misses:** specialDates/pending items stay untyped catch-alls and new scalars lack null/bounds checks, so bad shapes persist past the API and break rate logic or the admin form at runtime.
**Label:** Loose schema, deferred runtime config failure

## pr_gvtools_23.diff
**Change:** Guards parseStats so data.data uses an empty array when nullish before calling reduce.
**AI Misses:** Null/undefined API payloads now silently render as empty/zero stats instead of surfacing fetch or backend failures.
**Label:** Silent empty stats on null payload

## pr_hardhat_8463.diff
**Change:** The downloader test now awaits getCompiler for versions 0.5.0 and 0.5.1 instead of calling it synchronously.
**AI Misses:** Only these two asserts were updated; any remaining sync call sites still treat the Promise as the compiler and will fail or silently misuse it at runtime.
**Label:** Incomplete async migration of getCompiler

## pr_hass_183263.diff
**Change:** Sofar button setup drops the inverter_type-is-not-None guard and the coordinator/entity paths remove assert serial is not None before building device identifiers and unique_ids.
**AI Misses:** A None serial still flows into DeviceInfo identifiers and f"{serial}_{key}" unique_ids, creating unstable or colliding entity/device identities instead of a controlled unavailable state.
**Label:** None serial identity collision risk

## pr_helsinki_375.diff
**Change:** Adds optional chaining and an early return so favouriteUnit reads/writes skip when localStorage is missing.
**AI Misses:** Accessing localStorage can still throw SecurityError when storage is disabled, and toggleFavourite now silently no-ops so favourites look broken with no persistence or error.
**Label:** Incomplete localStorage null-guard

## pr_madie_274.diff
**Change:** getNewestLibraryInstance now optional-chains version splits and returns library a whenever either version is null/undefined.
**AI Misses:** If only one instance has a version, the guard still returns a, so an unversioned library can be chosen as newest over a real semver depending on argument order.
**Label:** Null version wrongly preferred as newest

## pr_oak_4498.diff
**Change:** The SearchActiveFilters tests now await userEvent.click before asserting analytics callbacks fired.
**AI Misses:** Production filter-removal behavior is unchanged, so real click/handler races stay unfixed while tests only look safer.
**Label:** Test-only await; no prod fix

## pr_profiler_6346.diff
**Change:** Adds await when returning processedChromeProfile so the Chrome profile conversion Promise is resolved before leaving unserializeProfileOfArbitraryFormat.
**AI Misses:** The if (processedChromeProfile) guard still treats the Promise as always truthy, so a conversion that resolves to null/falsy returns that value and never falls through to DHAT or other format handlers.
**Label:** Async guard skips format fallthrough

## pr_stirling_8619.diff
**Change:** Storybook's viteFinal now sets config.publicDir to false so Vite stops using the same public/ folder already copied via staticDirs.
**AI Misses:** Any Storybook story, addon, or Vite plugin that still expects publicDir as a real path (or assets only emitted by Vite's public copy, not staticDirs) can 404 or break in built/Chromatic Storybook without a clear local-dev signal.
**Label:** Storybook publicDir disable asset gap

## pr_syscenter_981.diff
**Change:** Null-safe assignment now checks whether deserialized XElement data is null before calling ToString, returning "" instead of using ToString() ?? "".
**AI Misses:** Still NREs if results[index]["Data"] itself is null before DeserializeObject, and still throws on malformed Data; successful null deserializes become silent empty strings that may break downstream consumers expecting real XML.
**Label:** Partial null fix; Data access still brittle

## pr_TinySA-Monitor_3.diff
**Change:** v7.3.0 adds LineCheckDialog (Ctrl+L), PIN-gated POST /acquitter for remote alarm ack, and rewrites im_scan so wide TX blocks produce band products with per-class EazyRF tolerances.
**AI Misses:** The web ack path stores the PIN in browser localStorage in plaintext with only a time.time()-based 5-try/60s lockout, so a shared crew phone or NTP clock jump can leak the code or reset lockout and clear critical alarms without the PC operator noticing.
**Label:** Feature drop with weak web PIN security

## pr_tutanota_11681.diff
**Change:** Routes liboqs WASM header install/clean/include paths from a local include/ tree to a build-dir path supplied via WASM_INCLUDE_DIR.
**AI Misses:** WASM_INCLUDE_DIR has no Makefile default, so any make invocation outside buildLibOqs resolves INCLUDE_OQS_DIR to /oqs and can fail, write to root, or rm -rf an empty path.
**Label:** Missing env default breaks make

## pr_unovis_967.diff
**Change:** Hardens isAClassInstance with optional chaining so null, undefined, and null-prototype objects no longer throw when reading constructor.name, plus license/version doc bumps and removal of the react package tsc script.
**AI Misses:** Null-prototype objects are still not treated as plain objects so cloneDeep/merge keep the same reference (shared mutable state), and anonymous classes with an empty constructor.name are now falsely treated as non-instances and can be deep-merged incorrectly.
**Label:** Shared null-proto merge reference leak

## pr_xenflow_5.diff
**Change:** Adds ConfigValidator for early param/path checks, gates MAP_REFERENCE behind a new map_reference flag (default false), and restricts xenium_dir channel inputs to directories.
**AI Misses:** Validation uses java.nio Files.isRegularFile on Nextflow paths, so remote/object-store inputs that previously worked will be rejected as missing, while map_reference defaulting to false also silently skips mapping for existing runs that never set the flag.
**Label:** Remote path check + silent skip regression

