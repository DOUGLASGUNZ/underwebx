import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const cssSource = path.resolve(process.argv[3] || 'polish/rc7-premium.css');

const file = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8').replace(/\r\n/g, '\n');
const write = (rel, value) => fs.writeFileSync(file(rel), value.replace(/\r\n/g, '\n'), 'utf8');

function replaceOnce(rel, from, to) {
    const value = read(rel);
    if (!value.includes(from)) {
        throw new Error(`RC7 polish: expected text not found in ${rel}`);
    }
    write(rel, value.replace(from, to));
}

replaceOnce('UWX_VERSION', '0.4.6-rc6', '0.4.7-rc7');
replaceOnce(
    'src/shared/constants/uwx.js',
    "export const UWX_VERSION = '0.4.6-rc6';",
    "export const UWX_VERSION = '0.4.7-rc7';"
);

const changelog = read('CHANGELOG_UWX.md');
if (!changelog.includes('## 0.4.7-rc7')) {
    const section = `# UnderWeb X changelog

## 0.4.7-rc7 — Premium interface polish

- Unified the app around the OSC Lab visual language with premium cards, spacing, borders, and motion.
- Refined sidebar and navigation states with clearer active, hover, notification, and collapsed behavior.
- Added a custom shimmer skeleton treatment and upgraded global loading feedback.
- Restyled empty states to feel intentional instead of unfinished.
- Restyled Sonner notifications with glassy surfaces, status accents, and tighter typography.
- Added consistent icon motion, focus treatment, scrollbars, overlays, and popover/dialog transitions.
- Added reduced-motion support so the polish does not compromise accessibility.

`;
    write('CHANGELOG_UWX.md', changelog.replace('# UnderWeb X changelog\n\n', section));
}

replaceOnce(
    'src/components/ui/card/Card.vue',
    "cn('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm', props.class)",
    "cn('uwx-premium-card bg-card text-card-foreground flex flex-col gap-5 rounded-[14px] border py-5 shadow-sm', props.class)"
);
replaceOnce(
    'src/components/ui/card/CardHeader.vue',
    "'@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6'",
    "'@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-5'"
);
replaceOnce(
    'src/components/ui/card/CardContent.vue',
    "<div data-slot=\"card-content\" :class=\"cn('px-6', props.class)\">",
    "<div data-slot=\"card-content\" :class=\"cn('px-5', props.class)\">"
);
replaceOnce(
    'src/components/ui/card/CardTitle.vue',
    "<h3 data-slot=\"card-title\" :class=\"cn('leading-none font-semibold', props.class)\">",
    "<h3 data-slot=\"card-title\" :class=\"cn('tracking-[-0.01em] leading-none font-semibold', props.class)\">"
);
replaceOnce(
    'src/components/ui/card/CardDescription.vue',
    "<p data-slot=\"card-description\" :class=\"cn('text-muted-foreground text-sm', props.class)\">",
    "<p data-slot=\"card-description\" :class=\"cn('text-muted-foreground text-[13px] leading-relaxed', props.class)\">"
);
replaceOnce(
    'src/components/ui/skeleton/Skeleton.vue',
    "<div data-slot=\"skeleton\" :class=\"cn('animate-pulse rounded-md bg-primary/10', props.class)\" />",
    "<div data-slot=\"skeleton\" :class=\"cn('uwx-skeleton rounded-md', props.class)\" />"
);
replaceOnce(
    'src/components/ui/empty/Empty.vue',
    "'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12'",
    "'uwx-empty-state flex min-w-0 flex-1 flex-col items-center justify-center gap-5 text-balance rounded-xl border border-dashed p-6 text-center md:p-10'"
);
replaceOnce(
    'src/components/ui/spinner/Spinner.vue',
    "<Loader2Icon role=\"status\" aria-label=\"Loading\" :class=\"cn('size-4 animate-spin', props.class)\" />",
    "<Loader2Icon role=\"status\" aria-label=\"Loading\" :class=\"cn('uwx-spinner size-4 animate-spin', props.class)\" />"
);
replaceOnce(
    'src/components/ui/sonner/Sonner.vue',
    ":class=\"cn('toaster group', props.class)\"",
    ":class=\"cn('toaster uwx-toaster group', props.class)\""
);

const app = read('src/App.vue');
const polishImport = "    import '@/styles/uwx-premium.css';";
if (!app.includes(polishImport)) {
    const anchor = "    import '@/styles/globals.css';";
    if (!app.includes(anchor)) {
        throw new Error('RC7 polish: globals.css import anchor missing in App.vue');
    }
    write('src/App.vue', app.replace(anchor, `${anchor}\n${polishImport}`));
}

fs.copyFileSync(cssSource, file('src/styles/uwx-premium.css'));

console.log('Applied UWX 0.4.7-rc7 premium interface polish.');
