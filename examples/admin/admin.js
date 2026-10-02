import { customers, plans, revenue } from './records.js';

const blankCustomer = () => ({ name: '', email: '', company: '', plan: 'studio', status: 'trial', notes: '', updates: false });
const titles = { overview: 'Overview', customers: 'Customers', segments: 'Segments', subscriptions: 'Subscriptions', plans: 'Plans', revenue: 'Revenue', activity: 'Activity', settings: 'Workspace settings' };
const groups = { customers: 'customers', segments: 'customers', customer: 'customers', subscriptions: 'billing', plans: 'billing', revenue: 'reports', activity: 'reports', settings: 'settings' };
const detailTabs = ['profile', 'subscription', 'activity'];

export function adminDemo() {
  return {
    customers: structuredClone(customers), plans, revenue,
    view: 'overview', navigationOpen: false, customerId: null, customerTab: 'profile', pendingFocus: 'title',
    query: '', statusFilter: 'all', planFilter: 'all', sortKey: 'joined', sortDirection: 'desc', page: 1, pageSize: 5,
    subscriptionQuery: '', subscriptionStatus: 'all',
    selectedIds: [], period: '6', selectedMonth: 'Sep',
    editingId: null, form: blankCustomer(), formError: '', deletionIds: [],
    settings: { workspace: 'Forma', email: 'alex@forma.example', trialDays: 14, signature: '<p>Thanks,<br><strong>Alex Morgan</strong></p>', digest: true, security: true },
    savedSettings: { workspace: 'Forma', email: 'alex@forma.example', trialDays: 14, signature: '<p>Thanks,<br><strong>Alex Morgan</strong></p>', digest: true, security: true },
    activity: [], notice: '', nextId: 1021,

    init() {
      this.hashListener = () => this.applyRoute(true);
      window.addEventListener('hashchange', this.hashListener);
      this.applyRoute(false);
    },
    destroy() { window.removeEventListener('hashchange', this.hashListener); },
    get title() { return this.view === 'customer' ? this.selectedCustomer?.name || 'Customer' : titles[this.view]; },
    get subtitle() {
      if (this.view === 'customer') return this.selectedCustomer?.company || '';
      return { overview: 'Small details. A bigger picture.', customers: 'Good relationships start with a little context.',
        segments: 'Find the people at each stage of their journey.', subscriptions: 'Every subscription, in one place.',
        plans: 'A little room for every kind of team.', revenue: 'The historical picture, alongside today’s subscriptions.',
        activity: 'A record of the changes you make here.', settings: 'Make this workspace your own.' }[this.view];
    },
    get selectedCustomer() { return this.customers.find(customer => customer.id === this.customerId) || null; },
    get customerActivity() { return this.activity.filter(event => event.customerId === this.customerId); },
    get segments() {
      return ['active', 'trial', 'paused'].map(status => ({ status, name: this.statusName(status),
        count: this.customers.filter(customer => customer.status === status).length,
        description: { active: 'Customers with a current paid subscription.', trial: 'Customers exploring their next step.', paused: 'Customers whose subscription is on hold.' }[status] }));
    },
    get subscriptions() {
      const query = this.subscriptionQuery.trim().toLowerCase();
      return this.customers.filter(customer => (this.subscriptionStatus === 'all' || customer.status === this.subscriptionStatus)
        && (!query || [customer.name, customer.company, this.subscriptionId(customer.id)].some(value => value.toLowerCase().includes(query))));
    },
    get breadcrumbs() {
      const result = [{ label: 'Overview', path: '/overview' }];
      if (this.view === 'overview') return result;
      if (['customer', 'segments'].includes(this.view)) result.push({ label: 'Customers', path: '/customers' });
      if (['subscriptions', 'plans'].includes(this.view)) result.push({ label: 'Billing', path: '/subscriptions' });
      if (['revenue', 'activity'].includes(this.view)) result.push({ label: 'Reports', path: '/revenue' });
      if (this.view === 'settings') result.push({ label: 'Settings', path: null });
      result.push({ label: this.title, path: this.view === 'customer' ? this.customerPath(this.customerId) : null });
      if (this.view === 'customer' && this.customerTab !== 'profile') result.push({ label: this.customerTab === 'subscription' ? 'Subscription' : 'Activity', path: null });
      return result;
    },
    get activeCustomers() { return this.customers.filter(customer => customer.status === 'active'); },
    get monthlyRevenue() { return this.activeCustomers.reduce((sum, customer) => sum + this.plan(customer.plan).price, 0); },
    get trialCount() { return this.customers.filter(customer => customer.status === 'trial').length; },
    get filteredCustomers() {
      const query = this.query.trim().toLowerCase();
      return this.customers.filter(customer => (this.statusFilter === 'all' || customer.status === this.statusFilter)
        && (this.planFilter === 'all' || customer.plan === this.planFilter)
        && (!query || [customer.name, customer.email, customer.company].some(value => value.toLowerCase().includes(query))))
        .sort((a, b) => {
          const first = a[this.sortKey];
          const second = b[this.sortKey];
          const result = first.localeCompare(second, 'en', { sensitivity: 'base' });
          return (this.sortDirection === 'asc' ? result : -result) || a.id.localeCompare(b.id);
        });
    },
    get pageCount() { return Math.max(1, Math.ceil(this.filteredCustomers.length / this.pageSize)); },
    get pageCustomers() { return this.filteredCustomers.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); },
    get pageSelected() { return this.pageCustomers.length > 0 && this.pageCustomers.every(customer => this.selectedIds.includes(customer.id)); },
    get pagePartlySelected() { return !this.pageSelected && this.pageCustomers.some(customer => this.selectedIds.includes(customer.id)); },
    get rangeLabel() {
      const count = this.filteredCustomers.length;
      return count ? `${(this.page - 1) * this.pageSize + 1}–${Math.min(this.page * this.pageSize, count)} of ${count} customers` : '0 customers';
    },
    get planDistribution() {
      return this.plans.map(plan => ({ ...plan, count: this.activeCustomers.filter(customer => customer.plan === plan.id).length }));
    },
    get chartPoints() {
      return this.revenue.slice(-Number(this.period)).map((point, index, points) => ({
        ...point, x: 48 + index * (552 / (points.length - 1)), y: 190 - point.value / 2000 * 170,
      }));
    },
    get chartLine() { return this.chartPoints.map(point => `${point.x},${point.y}`).join(' '); },
    get chartArea() { return `48,190 ${this.chartLine} 600,190`; },
    get chartSelection() { return this.chartPoints.find(point => point.month === this.selectedMonth) || this.chartPoints.at(-1); },
    get chartSummary() { return `Monthly recurring revenue, historical sample. ${this.chartPoints.map(point => `${point.label}: ${this.money(point.value)}`).join('; ')}.`; },
    get deleteDescription() {
      if (this.deletionIds.length === 1) return this.customers.find(customer => customer.id === this.deletionIds[0])?.name || 'this customer';
      return `${this.deletionIds.length} customers`;
    },

    plan(id) { return this.plans.find(plan => plan.id === id); },
    subscriptionId(id) { return id.replace('cus_', 'sub_'); },
    customerPath(id, tab = 'profile') { return `/customers/${encodeURIComponent(id)}/${tab}`; },
    money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); },
    date(value) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)); },
    initials(name) { return name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase(); },
    statusName(status) { return { active: 'Active', trial: 'Trial', paused: 'Paused' }[status]; },
    sortAria(key) { return this.sortKey === key ? (this.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'; },
    followLink(event) {
      const link = event.target.closest('a[href^="#/"]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      this.go(link.getAttribute('href').slice(1));
    },
    go(path, focus = 'title') {
      this.pendingFocus = focus;
      if (window.location.hash === `#${path}`) this.applyRoute(true);
      else window.location.hash = path;
    },
    navigate(view) { this.go(`/${view}`); },
    applyRoute(focus) {
      const refs = this.$refs;
      const parts = window.location.hash.slice(1).split('/').filter(Boolean);
      let view = parts[0] || 'overview';
      let id = null;
      let tab = 'profile';
      if (view === 'customers' && parts.length > 1) {
        try { id = decodeURIComponent(parts[1]); } catch { id = null; }
        tab = parts[2] || 'profile';
        if (!this.customers.some(customer => customer.id === id) || !detailTabs.includes(tab) || parts.length > 3) {
          view = 'customers'; id = null;
          history.replaceState(null, '', '#/customers');
          this.notify('That customer view is no longer available.');
        } else view = 'customer';
      } else if (!Object.hasOwn(titles, view) || parts.length > 1) {
        view = 'overview';
        history.replaceState(null, '', '#/overview');
      }
      this.view = view;
      this.customerId = id;
      this.customerTab = tab;
      this.navigationOpen = false;
      const target = this.pendingFocus;
      this.pendingFocus = 'title';
      this.$nextTick(() => {
        this.revealDestination(refs.navigation);
        if (!focus) return;
        if (target === 'tab') refs.content.querySelector('[role="tab"][aria-selected="true"]')?.focus();
        else refs.title.focus();
      });
    },
    revealDestination(navigation) {
      const group = navigation.querySelector(`[data-admin-group="${groups[this.view]}"]`);
      if (group) group.open = true;
    },
    selectCustomerTab(tab) { this.go(this.customerPath(this.customerId, tab), 'tab'); },
    tabKeydown(event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = detailTabs.indexOf(this.customerTab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? detailTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + detailTabs.length) % detailTabs.length;
      this.selectCustomerTab(detailTabs[next]);
    },
    openSegment(status) {
      this.query = ''; this.statusFilter = status; this.planFilter = 'all'; this.resetList();
      this.navigate('customers');
    },
    openPlan(id) {
      this.query = ''; this.statusFilter = 'all'; this.planFilter = id; this.resetList();
      this.navigate('customers');
    },
    toggleNavigation() {
      const refs = this.$refs;
      this.navigationOpen = !this.navigationOpen;
      this.$nextTick(() => {
        if (this.navigationOpen) { this.revealDestination(refs.navigation); refs.navigation.querySelector('[aria-current="page"]').focus(); }
        else refs.navigationToggle.focus();
      });
    },
    resetList() { this.page = 1; this.selectedIds = []; },
    sortBy(key) {
      this.sortDirection = this.sortKey === key && this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.sortKey = key;
      this.page = 1;
    },
    changePage(page) {
      const refs = this.$refs;
      this.page = Math.max(1, Math.min(page, this.pageCount));
      this.$nextTick(() => refs.tableRegion.focus());
    },
    selectPage(checked) {
      const ids = this.pageCustomers.map(customer => customer.id);
      this.selectedIds = checked ? [...new Set([...this.selectedIds, ...ids])] : this.selectedIds.filter(id => !ids.includes(id));
    },
    openCustomer(id = null) {
      const refs = this.$refs;
      this.editingId = id;
      this.form = id ? { ...this.customers.find(customer => customer.id === id) } : blankCustomer();
      this.formError = '';
      this.$nextTick(() => refs.customerDialog.showModal());
    },
    saveCustomer() {
      const refs = this.$refs;
      const name = this.form.name.trim();
      const company = this.form.company.trim();
      const email = this.form.email.trim().toLowerCase();
      if (!name || !company) {
        this.formError = 'Enter a name and a company.';
        (!name ? refs.customerName : refs.customerCompany).focus();
        return;
      }
      if (this.customers.some(customer => customer.id !== this.editingId && customer.email.toLowerCase() === email)) {
        this.formError = 'A customer with this email address already exists.';
        refs.customerEmail.focus();
        return;
      }
      const editing = !!this.editingId;
      const customer = { ...this.form, name, company, email, notes: this.form.notes.trim() };
      const id = editing ? this.editingId : `cus_${this.nextId++}`;
      if (editing) this.customers = this.customers.map(existing => existing.id === id ? customer : existing);
      else this.customers.unshift({ ...customer, id, joined: new Date().toISOString().slice(0, 10) });
      this.page = Math.min(this.page, this.pageCount);
      this.log(`${editing ? 'Updated' : 'Created'} ${name}`, `${company} · ${this.plan(customer.plan).name} · ${this.statusName(customer.status)}`, editing ? 'compose' : 'plus', id);
      refs.customerDialog.close();
      this.notify(`${name} ${editing ? 'updated' : 'created'}.`);
      this.$nextTick(() => {
        if (this.view === 'customer') refs.content.querySelector('[data-customer-edit]')?.focus();
        else refs.addCustomer.focus();
      });
    },
    confirmDelete(ids) {
      const refs = this.$refs;
      this.deletionIds = [...ids];
      this.$nextTick(() => refs.deleteDialog.showModal());
    },
    deleteCustomers() {
      const refs = this.$refs;
      const count = this.deletionIds.length;
      const description = this.deleteDescription;
      this.customers = this.customers.filter(customer => !this.deletionIds.includes(customer.id));
      this.selectedIds = this.selectedIds.filter(id => !this.deletionIds.includes(id));
      this.page = Math.min(this.page, this.pageCount);
      this.log(`Deleted ${description}`, `${count} ${count === 1 ? 'record' : 'records'} removed from this workspace`, 'trash');
      refs.deleteDialog.close();
      this.deletionIds = [];
      this.notify(`${count} ${count === 1 ? 'customer' : 'customers'} deleted.`);
      if (this.view === 'customer' && !this.selectedCustomer) this.navigate('customers');
      else this.$nextTick(() => refs.addCustomer.focus());
    },
    saveSettings() {
      const workspace = this.settings.workspace.trim();
      if (!workspace) {
        this.$refs.workspaceName.setCustomValidity('Enter a workspace name.');
        this.$refs.workspaceName.reportValidity();
        return;
      }
      this.settings.workspace = workspace;
      this.settings.email = this.settings.email.trim().toLowerCase();
      this.savedSettings = { ...this.settings };
      this.log('Updated workspace settings', `${workspace} · ${this.settings.email}`, 'settings');
      this.notify('Workspace settings saved.');
    },
    resetSettings() {
      this.settings = { ...this.savedSettings };
      this.$refs.workspaceName.setCustomValidity('');
    },
    log(title, detail, icon, customerId = null) {
      this.activity.unshift({ id: this.activity.length + 1, title, detail, icon, customerId, time: new Date().toISOString() });
    },
    activityTime(value) { return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)); },
    notify(message) {
      this.notice = message;
      setTimeout(() => { if (this.notice === message) this.notice = ''; }, 4500);
    },
    exportCustomers() {
      // Quote fields and neutralize spreadsheet formulas in user-entered content.
      const escape = value => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
      const rows = [['Name', 'Email', 'Company', 'Plan', 'Status', 'Monthly USD', 'Joined'],
        ...this.filteredCustomers.map(customer => [customer.name, customer.email, customer.company, this.plan(customer.plan).name,
          this.statusName(customer.status), customer.status === 'active' ? this.plan(customer.plan).price : 0, customer.joined])];
      const url = URL.createObjectURL(new Blob([rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fruitui-customers.csv';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.notify(`Exported ${this.filteredCustomers.length} customers.`);
    },
  };
}
