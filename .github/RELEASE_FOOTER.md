
---

### Manual installation (without the Raycast Store)

Raycast has no single-file installer — there is no `.vsix`-style artifact. A local
extension is a **source folder** that Raycast compiles on your machine. Download the
`clessira-raycast-*.zip` asset below, unzip it, then in the folder:

```sh
npm install
npm run dev      # builds and loads it into Raycast — top of the root search
# or: npm run build, then run Raycast's "Import Extension" command and pick the folder
```

Requires macOS with Raycast and Node ≥ 20. Locally-installed extensions are managed
by you and do not auto-update from the Store.
