function adjustGHP(selector = 'base') {
    if (!location.hostname.endsWith('.github.io')) return;

    if (typeof selector !== 'string') return;
    var nodes = document.querySelectorAll(selector);
    if (!nodes || !nodes.length) return;
    var r = (location.pathname.split('/')[1] || '').trim();
    if (!r) return;
    Array.prototype.forEach.call(nodes, function (el) {
        if (!el || !el.getAttribute) return;
        el.setAttribute('href', '/' + r + '/' + (el.getAttribute('href') || '').replace(/^\/+/, ''));
    });

}
adjustGHP()