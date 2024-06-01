# extension-v1.8.1

- Tiny bugfix.

# extension-v1.8.0

- Implemented "problematic" reqres flag, its tracking, UI, and documentation.

    This flag gets set for "no_response" and "incomplete" reqres by default but, unlike "Archive reqres with" settings, it does not influence archival.
    Instead pWebArc displays "error" as its icon and its badge gets "!" at the end.

    This is needed because, normally, browsers provide no indication when some parts of the page failed to load properly --- they expect you to actually look at the page with your eyes to notice something looking broken instead --- which is not a proper way to do this when you want to be sure that the whole page with all its resources was archived.

- Implemented currently active tab's limbo mode indication via the icon.

- Added more shortcuts, changed defaults for others:

    - Added `toggle-tabconfig-limbo`, `toggle-tabconfig-children-limbo`, and `show-tab-state` shortcuts,

    - Changed the default shortcut for `collect-all-tab-inlimbo` from `Alt+A` to `Alt+Shift+A` for uniformity.

- Renamed reqres states:

    - `noresponse` -\> `no_response`,
    - `incomplete-fc` -\> `incomplete_fc`.

- Added a separate state for reqres that are completed from cache: `complete_fc`.

- Improved UI, the internal state/log page is much nicer now, but the popup UI in its default state might have become a bit too long...

- Improved performance when using limbo mode.

- Improved documentation.

- Bugfixes.

(Actually, this releases about half of the new changes in my local branches, so expect a new release soonish.)

# tool-v0.11.2

- Bugfixes.

# extension-v1.7.0

- Implement "in limbo" reqres processing stage and toggles.

    "Limbo" is an optional pre-archival-queue stage for finished reqres that are ready to be archived but, unlike non-limbo reqres, are not to be archived automatically.

    Which is useful in cases when you need to actually look at a page before deciding if you want to archive it.

    E.g., you enable limbo mode, reload the page, notice there were no updates to the interesting parts of the page, and so you discard all of the reqres newly generated by that tab via appropriate button in the add-on popup, or via the new keyboard shortcut.

- The "Log" page became the "Internal State" page, now shows in-flight and in-limbo reqres. It also allows narrowing to data belonging to a single tab now.

- Improved UI.

- Improved performance.

# tool-v0.11.1

- Improved default batching parameters.
- Improved documentation.

# tool-v0.11.0

- Implemented `scrub` `--expr` atom for rewriting links/references and wiping inner evils out from HTML, JavaScript, and CSS values.

    CSS scrubbing is not finished yet, so all CSS gets censored out by default at the moment.

    HTML processing uses `html5lib`, which is pretty nice (though, rather slow), but overall the complexity of this thing and the time it took to debug it into working is kind of unamusing.

- Implemented `export mirror` subcommand generating static website mirrors from previously archived WRR files, kind of similar to what `wget -mpk` does, but offline and the outputs are properly `scrub`bed.

- A bunch of `--expr` atoms were renamed, a bunch more were added.

- A bunch of `--output` formats changed, most notably `flat` is now named `flat_ms`.

- Improved performance.

- Bugfixes.

- Improved documentation.

# tool-v0.9.0

- Updated `wrrarms` to build with newer `nixpkgs` and `cbor2` modules, the latter of which is now vendored, at least until upstream solves the custom encoders issue.

- Made more improvements to `--output` option of `organize` and `import` with IDNA and component-wise quoting/unquoting of tool-v0.8:

    - Added `pretty_url`, `mq_path`, `mq_query`, `mq_nquery` to substitutions and made pre-defined `--output` formats use them.

        `mq_nquery`, and `pretty_url` do what `nquery` and `nquery_url` did before v0.8.0, but better.

    - Dropped `shpq`, `hpq`, `shpq_msn`, and `hpq_msn` `--output` formats as they are now equivalent to their `hup` versions.

- Bugfixed `--expr` option of `run`, and the `clock` line in `pprint`.

- Tiny improvements to performance.

# tool-v0.8.1

- Bugfix #1:

    `tool-v0.8` might have skipped some of the updates when `import`ing and forgot to do some actions when doing `organize`, which was not the case for `tool-v0.6`.

    These bugs should have not been triggered ever (and with the default `--output` they are impossible to trigger) but to be absolutely sure you can re-run `import mitmproxy` and `organize` with the same arguments you used before.

- Bugfix #2:

    `organize --output` `num`bering is deterministic again, like it was in `tool-v0.6`.

- Added `--output flat_n`.

# extension-v1.6.0

- Replaced icons with a cuter set.

# tool-v0.8

- Implemented import for `mitmproxy` dumps.

- Improved `net_url` normalization and components handling, added support for IDNA hostnames.

- Improved most `--output` formats, custom `--output` formats now require `format:` prefix to distinguish them from the built-in ones, like in `git`.

- Renamed response status codes:

    - `N` -\> `I` for "Incomplete"
    - `NR` -\> `N` for "None"

- Renamed

    - `organize --action rename` -\> `organize --move` (as it can now atomically move files between file systems, see below),
    - `--action hardlink` -\> `--hardlink`,
    - `--action symlink` -\> `--symlink`,
    - `--action symlink-update` -\> `--symlink --latest`.

- Added `organize --copy`.

- `organize` now performs changes atomically: it writes to newly created files first, `fsync` them, replaces old destination files, `fsync`s touched directories, reports changes to `stdout` (for consumption by subsequent commands' `--stdin0`), and only then (when doing `--move`) deletes source files.

- Made many internal changes to simplify things in the future.

Paths produced by `wrrarms organize` are expected to change:

- with the default `--output` format you will only see changes to WRR files with international (IDNA) hostnames and those with the above response statuses;

- names of files generated by most other `--output` formats will change quite a lot, since the path abbreviation algorithm is much smarter now.

# dumb_server-v1.6.0

- Implemented `--uncompressed` option.
- Renamed `--no-cbor` option to `--no-print-cbors`.

# dumb_server-v1.5.5

- Improved documentation.

# tool-v0.6

- `organize`: implemented `--quiet`, `--batch-number`, and `--lazy` options.
- `organize`: implemented `--output flat` and improved other `--output` formats a bit.
- `get` and `run` now allow multiple `--expr` arguments.
- Improved performance.
- Improved documentation.

# tool-v0.5

- Initial public release.

# dumb_server-v1.5

- Generated filenames for partial files now have `.part` extension.
- Generated filenames now include PID to allow multiple process instances of this to dump to the same directory.
- Added `--default-profile` option, changed semantics of `--ignore-profiles` a bit.
- Added `--no-cbor` option.
- Packaged as both Python and Nix package.

# extension-v1.5

- Added keyboard shortcuts toggling tab-related config settings.
- Improved UI.
- Improved documentation.
- Bugfixes.

# extension-v1.4

- Implemented context menu actions.
- Improved UI.
- Improved performance of dumping to CBOR.
- Improved documentation.

# extension-v1.3.5

- Improved `document_url` and `origin_url` handling.
- Improved documentation.

# extension-v1.3

- Experimental Chromium support.
- Improved UI.
- Bugfixes

# extension-v1.1

- Improved handling of "304 Not Modified" responses.
- Improved UI and the "Help" page.
- Bugfixes.

# dumb_server-v1.1

- Implemented `--ignore-profiles` option.

# dumb_server-v1.0

- All planned features are complete now.

# extension-v1.0

- Improved popup UI.
- Improved the "Help" page: it's much more helpful now.
- Improved the "Log" page: it's an interactive page that gets updated automatically now.
- Some small bugfixes.

# extension-v0.1

- Initial public release.