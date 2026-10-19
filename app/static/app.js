(() => {
    const ICONS = {
        email: '<svg viewBox="0 0 24 24"><path d="M2 5h20v14H2V5zm2 2v.5l8 5 8-5V7H4zm16 2.8-8 5-8-5V17h16V9.8z"/></svg>',
        github: '<svg viewBox="0 0 24 24"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24"><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13.2 1.8 11.7c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.13V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.1 1.43-2.1 2.9V21h-4V9z"/></svg>',
        link: '<svg viewBox="0 0 24 24"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM8.5 19a4.5 4.5 0 0 1-3.2-7.7l2-2a1 1 0 1 1 1.4 1.4l-2 2a2.5 2.5 0 0 0 3.6 3.6l2-2a1 1 0 0 1 1.4 1.4l-2 2A4.5 4.5 0 0 1 8.5 19zm8.8-6.3a1 1 0 0 1-.7-1.7l2-2a2.5 2.5 0 0 0-3.6-3.6l-2 2a1 1 0 1 1-1.4-1.4l2-2a4.5 4.5 0 0 1 6.4 6.4l-2 2a1 1 0 0 1-.7.3z"/></svg>'
    };

    const el = (tag, attrs = {}, children = []) => {
        const node = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'text') node.textContent = value;
            else if (key === 'html') node.innerHTML = value;
            else node.setAttribute(key, value);
        }
        [].concat(children).filter(Boolean).forEach(child => node.append(child));
        return node;
    };

    const tags = items => el('ul', { class: 'tags' }, (items || []).map(item => el('li', { class: 'tag', text: item })));

    const isExternal = url => /^https?:/.test(url);

    function renderProfile(p) {
        document.querySelectorAll('[data-field]').forEach(node => {
            node.textContent = p[node.dataset.field] || '';
        });

        document.getElementById('heroContacts').replaceChildren(...(p.contacts || []).map(c =>
            el('a', {
                class: 'chip', href: c.url,
                ...(isExternal(c.url) ? { target: '_blank', rel: 'noopener' } : {})
            }, [el('span', { html: ICONS[c.type] || ICONS.link }).firstChild, c.label])
        ));

        document.getElementById('skills-list').replaceChildren(...(p.skills || []).map(g =>
            el('div', { class: 'skill-group' }, [el('h3', { text: g.group }), tags(g.items)])
        ));

        document.getElementById('projects-list').replaceChildren(...(p.projects || []).map(pr =>
            el('a', { class: 'project', href: pr.url || '#', target: '_blank', rel: 'noopener' }, [
                el('div', { class: 'project__head' }, [
                    el('h3', { class: 'project__name', text: pr.name }),
                    pr.status ? el('span', { class: 'project__status', text: pr.status }) : null
                ]),
                el('p', { class: 'project__desc', text: pr.description }),
                tags(pr.stack)
            ])
        ));

        document.getElementById('education-list').replaceChildren(...(p.education || []).map(e =>
            el('li', {}, [
                e.url ? el('a', { href: e.url, target: '_blank', rel: 'noopener', text: e.title }) : el('strong', { text: e.title }),
                el('span', { class: 'muted', text: [e.organization, e.period].filter(Boolean).join(' · ') })
            ])
        ));
    }

    async function loadProfile() {
        try {
            const res = await fetch('/api/profile');
            if (!res.ok) throw new Error(res.status);
            renderProfile(await res.json());
        } catch (e) {
            document.querySelector('.hero__name').textContent = 'Не удалось загрузить профиль';
            console.error(e);
        }
    }

    function setupForm() {
        const form = document.getElementById('contactForm');
        const status = document.getElementById('formStatus');
        const button = form.querySelector('button');

        const clearErrors = () => form.querySelectorAll('[data-error]').forEach(n => n.textContent = '');

        form.addEventListener('submit', async event => {
            event.preventDefault();
            clearErrors();
            status.className = 'form__status';
            status.textContent = '';
            button.disabled = true;

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                });
                if (res.ok) {
                    form.reset();
                    status.classList.add('ok');
                    status.textContent = 'Спасибо! Сообщение отправлено.';
                    return;
                }
                const problem = await res.json().catch(() => ({}));
                Object.entries(problem.errors || {}).forEach(([field, msg]) => {
                    const node = form.querySelector(`[data-error="${field}"]`);
                    if (node) node.textContent = msg;
                });
                status.classList.add('fail');
                status.textContent = problem.detail || 'Не удалось отправить сообщение.';
            } catch (e) {
                status.classList.add('fail');
                status.textContent = 'Сервер недоступен, попробуйте позже.';
            } finally {
                button.disabled = false;
            }
        });
    }

    function setupTheme() {
        const root = document.documentElement;
        let saved = null;
        try { saved = localStorage.getItem('theme'); } catch (e) { /* хранилище недоступно */ }
        if (saved) root.dataset.theme = saved;

        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = root.dataset.theme
                || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            root.dataset.theme = current === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* ignore */ }
        });
    }

    document.getElementById('year').textContent = new Date().getFullYear();
    setupTheme();
    setupForm();
    loadProfile();
})();
