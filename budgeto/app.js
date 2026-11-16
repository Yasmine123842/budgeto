(() => {
  'use strict';

  // ---------- Configuration ----------
  const STORAGE_KEY = 'budgeto.transactions';
  const THEME_KEY = 'budgeto.theme';

  const CATEGORIES = {
    expense: ['Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Factures', 'Autre'],
    income: ['Salaire', 'Freelance', 'Cadeau', 'Autre'],
  };

  const COLORS = ['#3d5afe', '#00a88f', '#f59e0b', '#e5484d', '#8e4ec6', '#0091c2', '#7c8493'];

  // Modifiez la devise ici (ex. 'EUR', 'USD', 'XOF', 'NGN').
  const CURRENCY = 'EUR';
  const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: CURRENCY });

  // ---------- Éléments ----------
  const $ = (id) => document.getElementById(id);
  const form = $('form');
  const monthInput = $('month');
  const categorySelect = $('category');
  const list = $('list');
  const empty = $('empty');
  const chart = $('chart');
  const legend = $('legend');
  const themeToggle = $('theme-toggle');

  // ---------- Stockage ----------
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      /* stockage indisponible : les données restent en mémoire */
    }
  }

  let transactions = load();

  // ---------- Utilitaires ----------
  function todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function currentType() {
    return form.elements.type.value;
  }

  function visibleTransactions() {
    return transactions
      .filter((t) => t.date.startsWith(monthInput.value))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // ---------- Rendu ----------
  function renderCategories() {
    categorySelect.replaceChildren(
      ...CATEGORIES[currentType()].map((name) => new Option(name, name))
    );
  }

  function renderSummary(items) {
    const income = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    $('total-income').textContent = money.format(income);
    $('total-expense').textContent = money.format(expense);
    const balanceEl = $('balance');
    balanceEl.textContent = money.format(balance);
    balanceEl.classList.toggle('income', balance > 0);
    balanceEl.classList.toggle('expense', balance < 0);
  }

  function renderList(items) {
    list.replaceChildren(
      ...items.map((t) => {
        const li = document.createElement('li');

        const main = document.createElement('div');
        main.className = 'tx-main';
        const label = document.createElement('p');
        label.className = 'tx-label';
        label.textContent = t.label;
        const meta = document.createElement('p');
        meta.className = 'tx-meta';
        meta.textContent = `${t.category} · ${formatDate(t.date)}`;
        main.append(label, meta);

        const amount = document.createElement('span');
        amount.className = `tx-amount ${t.type}`;
        amount.textContent = (t.type === 'expense' ? '− ' : '+ ') + money.format(t.amount);

        const del = document.createElement('button');
        del.className = 'tx-delete';
        del.type = 'button';
        del.textContent = '✕';
        del.setAttribute('aria-label', `Supprimer « ${t.label} »`);
        del.addEventListener('click', () => {
          transactions = transactions.filter((x) => x.id !== t.id);
          save();
          render();
        });

        li.append(main, amount, del);
        return li;
      })
    );
    empty.hidden = items.length > 0;
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function renderChart(items) {
    const totals = new Map();
    for (const t of items) {
      if (t.type === 'expense') totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
    }
    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    const R = 45;
    const C = 2 * Math.PI * R;
    chart.replaceChildren(
      svgEl('circle', { cx: 60, cy: 60, r: R, fill: 'none', stroke: 'var(--border)', 'stroke-width': 14 })
    );
    legend.replaceChildren();

    if (total === 0) {
      const text = svgEl('text', { x: 60, y: 62, 'text-anchor': 'middle', class: 'center-text' });
      text.textContent = 'Aucune dépense';
      chart.append(text);
      return;
    }

    let offset = 0;
    entries.forEach(([category, value], i) => {
      const color = COLORS[CATEGORIES.expense.indexOf(category) % COLORS.length] || COLORS[i % COLORS.length];
      const length = (value / total) * C;

      chart.append(
        svgEl('circle', {
          cx: 60, cy: 60, r: R,
          fill: 'none',
          stroke: color,
          'stroke-width': 14,
          'stroke-dasharray': `${length} ${C - length}`,
          'stroke-dashoffset': -offset,
          transform: 'rotate(-90 60 60)',
        })
      );
      offset += length;

      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = color;
      const name = document.createElement('span');
      name.textContent = category;
      const pct = document.createElement('span');
      pct.className = 'pct';
      pct.textContent = `${Math.round((value / total) * 100)} %`;
      li.append(dot, name, pct);
      legend.append(li);
    });
  }

  function render() {
    const items = visibleTransactions();
    renderSummary(items);
    renderList(items);
    renderChart(items);
  }

  // ---------- Export CSV ----------
  function csvCell(value) {
    let s = String(value);
    // Neutralise les formules pour les tableurs.
    if (/^[=+\-@]/.test(s) && typeof value === 'string') s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  }

  function exportCSV() {
    const rows = [['Date', 'Type', 'Libellé', 'Catégorie', 'Montant']];
    for (const t of visibleTransactions()) {
      rows.push([t.date, t.type === 'expense' ? 'Dépense' : 'Revenu', t.label, t.category, t.amount]);
    }
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgeto-${monthInput.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Thème ----------
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function initTheme() {
    let theme = null;
    try { theme = localStorage.getItem(THEME_KEY); } catch { /* ignoré */ }
    if (!theme) theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(theme);
  }

  // ---------- Événements ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const label = $('label').value.trim();
    const amount = Math.round(parseFloat($('amount').value) * 100) / 100;
    const date = $('date').value;
    if (!label || !(amount > 0) || !date) return;

    transactions.push({
      id: Date.now(),
      type: currentType(),
      label,
      amount,
      category: categorySelect.value,
      date,
    });
    save();

    // Affiche le mois de la transaction ajoutée.
    monthInput.value = date.slice(0, 7);
    $('label').value = '';
    $('amount').value = '';
    $('label').focus();
    render();
  });

  form.querySelectorAll('input[name="type"]').forEach((radio) =>
    radio.addEventListener('change', renderCategories)
  );

  monthInput.addEventListener('change', () => {
    if (!monthInput.value) monthInput.value = todayISO().slice(0, 7);
    render();
  });

  $('export').addEventListener('click', exportCSV);

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignoré */ }
  });

  // ---------- Démarrage ----------
  initTheme();
  monthInput.value = todayISO().slice(0, 7);
  $('date').value = todayISO();
  renderCategories();
  render();
})();
