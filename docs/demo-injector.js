/* demo-injector.js
 * Lightweight demo injector for editable, scoped CSS/HTML examples.
 * Place contenteditable <code class="demo-source" data-target="#result-id">...source...</code>
 * It extracts a single <style> block (optional) and the remaining HTML, expands simple one-level
 * nested rules inside a top-level selector (e.g. .examples { a:hover { ... } ul li { ... } })
 * and prefixes final selectors with a per-demo scope class so demo styles don't leak.
 *
 * Usage: include this script on a page with demo-source blocks. It auto-initializes on DOMContentLoaded.
 */
(function () {
    'use strict';

    const debounce = (fn, ms = 150) => {
        let t;
        return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    };

    // Expand one-level nested rules. Returns array of {sel, body}.
    function expandNested(css) {
        const rules = [];
        let i = 0, len = css.length;
        while (i < len) {
            const open = css.indexOf('{', i);
            if (open === -1) break;
            const selector = css.slice(i, open).trim();
            let j = open + 1, depth = 1;
            while (j < len && depth > 0) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
            const content = css.slice(open + 1, j - 1).trim();

            // find nested blocks inside content
            let k = 0, saw = false;
            while (k < content.length) {
                const childOpen = content.indexOf('{', k);
                if (childOpen === -1) break;
                saw = true;
                const childSel = content.slice(k, childOpen).trim();
                let c = childOpen + 1, d = 1;
                while (c < content.length && d > 0) { if (content[c] === '{') d++; else if (content[c] === '}') d--; c++; }
                const childBody = content.slice(childOpen + 1, c - 1).trim();
                // combine selector + childSel (support comma separated parent selectors)
                const parents = selector.split(',').map(s => s.trim());
                const full = parents.map(p => (p + ' ' + childSel).trim()).join(', ');
                rules.push({ sel: full, body: childBody });
                k = c;
            }

            if (!saw && content) {
                // No nested blocks: treat content as declarations for selector
                rules.push({ sel: selector, body: content });
            }

            i = j;
        }
        return rules;
    }

    function parseStyleAndHtml(src) {
        const m = src.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const css = m ? m[1] : '';
        const html = src.replace(/<style[^>]*>[\s\S]*?<\/style>/i, '').trim();
        return { css, html };
    }

    function stripScripts(html) {
        return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    }

    function applyTo(codeEl) {
        const targetSelector = codeEl.dataset.target;
        if (!targetSelector) return;
        const target = document.querySelector(targetSelector);
        if (!target) return;

        let scope = target.dataset.scope || ('mi-scope-' + Math.random().toString(36).slice(2, 9));
        target.dataset.scope = scope;

        const src = codeEl.textContent || '';
        const { css, html } = parseStyleAndHtml(src);

        target.innerHTML = '';

        if (css) {
            const rules = expandNested(css);
            const s = document.createElement('style');
            s.textContent = rules.map(r => {
                const pref = r.sel.split(',').map(s2 => `.${scope} ` + s2.trim()).join(', ');
                return `${pref} { ${r.body} }`;
            }).join('\n');
            target.appendChild(s);
        }

        const wrapper = document.createElement('div');
        wrapper.className = scope;
        wrapper.innerHTML = stripScripts(html);
        target.appendChild(wrapper);
    }

    function init(selector = '.demo-source') {
        document.querySelectorAll(selector).forEach(el => {
            applyTo(el);
            el.addEventListener('input', debounce(() => applyTo(el)));
        });
    }

    document.addEventListener('DOMContentLoaded', () => init());

    // expose for manual init if needed
    window.DemoInjector = { init };
})();
