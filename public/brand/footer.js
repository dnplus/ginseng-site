/*
 * Ginseng Try Catch brand footer, shared by every product and Lab tool.
 *
 *   <script src="https://ginseng.dnplus.dev/brand/footer.js" defer></script>
 *   <ginseng-footer ref="urai" lang="en"></ginseng-footer>
 *
 * Attributes: `ref` (the tool's id, added as ?ref= so the site can tell which tool sent a visitor), `lang` (`zh-TW` or
 * `en`; defaults to the page's <html lang>), `theme` (`light` default, or `dark`). Styles live in a shadow root, so the
 * host page's CSS neither leaks in nor out. No tracking, no network requests beyond this file.
 */
(() => {
  if (customElements.get('ginseng-footer')) return;
  const SITE = 'https://ginseng.dnplus.dev';
  const TEXT = {
    'zh-TW': {project: '人蔘 Try Catch 的作品', tagline: '少一點內捲，多一點外掛。', home: '人蔘 Try Catch', lab: '實驗室', blog: '文章', newsletter: '訂閱電子報', community: '社群', prefix: ''},
    en: {project: 'A Ginseng Try Catch project', tagline: 'Less grind, more power-ups.', home: 'Ginseng Try Catch', lab: 'The Lab', blog: 'Writing', newsletter: 'Newsletter', community: 'Community', prefix: '/en'},
  };
  const CSS = `
    :host { display: block; font-family: 'Nunito Sans', 'Noto Sans TC', 'PingFang TC', system-ui, sans-serif; }
    footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; padding: 18px 24px;
      border-top: 2px solid #263f35; background: #fff4e2; color: #263f35; font-size: 14px; line-height: 1.6; }
    :host([theme="dark"]) footer { background: #263f35; color: #fff4e2; border-top-color: #9fd49a; }
    .brand { display: flex; align-items: center; gap: 12px; color: inherit; text-decoration: none; }
    .plaque { display: inline-flex; align-items: baseline; gap: .45em; padding: 4px 10px; border: 2px solid #263f35; border-radius: 9px;
      background: #f7d774; color: #263f35; font-size: 12px; font-weight: 900; letter-spacing: .04em; white-space: nowrap;
      box-shadow: 2px 2px 0 #263f35; transform: rotate(-2deg); }
    .plaque b { font-size: 14px; }
    .brand small { display: block; font-size: 12px; opacity: .8; }
    nav { display: flex; flex-wrap: wrap; gap: 6px 18px; }
    nav a { color: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: currentColor; text-decoration-thickness: 1px; }
    nav a:hover { text-decoration-thickness: 2px; }
    a:focus-visible { outline: 3px solid #9fd49a; outline-offset: 3px; border-radius: 4px; }
  `;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  class GinsengFooter extends HTMLElement {
    static observedAttributes = ['lang', 'ref', 'theme'];
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }
    render() {
      const requested = this.getAttribute('lang') || document.documentElement.lang || 'zh-TW';
      const lang = /^zh/i.test(requested) ? 'zh-TW' : 'en', t = TEXT[lang];
      const ref = (this.getAttribute('ref') || '').replace(/[^a-z0-9-]/gi, '').slice(0, 32);
      const link = path => `${SITE}${path === '/' ? t.prefix || '/' : t.prefix + path}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
      const root = this.shadowRoot || this.attachShadow({mode: 'open'});
      const plaque = lang === 'en' ? '<b>Ginseng</b> TRY CATCH' : '<b>人蔘</b> TRY CATCH';
      root.innerHTML = `<style>${CSS}</style><footer lang="${lang}">
        <a class="brand" href="${escape(link('/'))}" target="_blank" rel="noopener"><span class="plaque">${plaque}</span><span>${escape(t.project)}<small>${escape(t.tagline)}</small></span></a>
        <nav aria-label="${escape(t.home)}">
          <a href="${escape(link('/lab'))}" target="_blank" rel="noopener">${escape(t.lab)}</a>
          <a href="${escape(link('/blog'))}" target="_blank" rel="noopener">${escape(t.blog)}</a>
          <a href="${escape(link('/community'))}" target="_blank" rel="noopener">${escape(t.community)}</a>
          <a href="${escape(link('/newsletter'))}" target="_blank" rel="noopener">${escape(t.newsletter)}</a>
        </nav></footer>`;
    }
  }
  customElements.define('ginseng-footer', GinsengFooter);
})();
