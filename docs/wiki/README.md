# Wiki source

This folder is the **source of truth** for the [RankMySEO GitHub Wiki](https://github.com/madebyaris/rankmyseo/wiki).

Browse these files on GitHub anytime: [docs/wiki](https://github.com/madebyaris/rankmyseo/tree/main/docs/wiki).

## Publish to GitHub Wiki

### First time only (initialize wiki)

GitHub does not create the wiki git repository until the first page exists:

1. Open [Create wiki page](https://github.com/madebyaris/rankmyseo/wiki/_new) (must be signed in as a repo admin)
2. Title: `Home`
3. Body: `# RankMySEO` (any placeholder is fine)
4. Click **Save Page**

After that, the wiki git remote exists and automation works.

### Automatic sync (CI)

On every push to `main` that touches `docs/wiki/**`, the [Publish Wiki](https://github.com/madebyaris/rankmyseo/actions/workflows/publish-wiki.yml) workflow syncs all `.md` files to the wiki.

Re-run manually: **Actions → Publish Wiki → Run workflow**.

### Manual push (local)

```bash
export HOME="$HOME"   # ensure HOME is valid
git clone https://github.com/madebyaris/rankmyseo.wiki.git /tmp/rankmyseo.wiki
cp docs/wiki/*.md /tmp/rankmyseo.wiki/
cd /tmp/rankmyseo.wiki
git add -A
git commit -m "Update wiki"
git push
```

## Pages

| File | Wiki page |
| --- | --- |
| `Home.md` | Home |
| `Getting-Started.md` | Getting-Started |
| `Architecture.md` | Architecture |
| `Packages.md` | Packages |
| `Configuration.md` | Configuration |
| `API-Reference.md` | API-Reference |
| `Schema-Generator.md` | Schema-Generator |
| `Dashboard-and-Widgets.md` | Dashboard-and-Widgets |
| `Blog-Module.md` | Blog-Module |
| `Data-Sources.md` | Data-Sources |
| `React-Hooks.md` | React-Hooks |
| `AI-Agent.md` | AI-Agent |
| `Development.md` | Development |
| `Roadmap-and-License.md` | Roadmap-and-License |
