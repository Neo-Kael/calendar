const authPage = document.getElementById('authPage');
const appShell = document.getElementById('appShell');
const loginForm = document.getElementById('loginForm');
const recoverForm = document.getElementById('recoverForm');
const recoverStatus = document.getElementById('recoverStatus');
const loginCard = document.getElementById('login');
const recoverCard = document.getElementById('recover-password');
const signupCard = document.getElementById('signup');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginLink = document.getElementById('backToLoginLink');
const createAccountLink = document.getElementById('createAccountLink');
const signupBackLink = document.getElementById('signupBackLink');
const signupForm = document.getElementById('signupForm');
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
const signupStatus = document.getElementById('signupStatus');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const monthLabel = document.getElementById('monthLabel');
const calendarDays = document.getElementById('calendarDays');
const eventForm = document.getElementById('eventForm');
const eventTitle = document.getElementById('eventTitle');
const eventDate = document.getElementById('eventDate');
const eventDescription = document.getElementById('eventDescription');
const eventStatus = document.getElementById('eventStatus');
const selectedEvents = document.getElementById('selectedEvents');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const eventCount = document.getElementById('eventCount');
const todayText = document.getElementById('todayText');
const todayBtn = document.getElementById('todayBtn');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const calendarView = document.getElementById('calendarView');
const settingsView = document.getElementById('settingsView');
const settingsForm = document.getElementById('settingsForm');
const themeSetting = document.getElementById('themeSetting');
const dateFormatSetting = document.getElementById('dateFormatSetting');
const weekStartSetting = document.getElementById('weekStartSetting');
const settingsStatus = document.getElementById('settingsStatus');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const navButtons = document.querySelectorAll('.nav-btn[data-view]');

const SETTINGS_KEY = 'calendario.preferences.v1';
const EVENTS_KEY = 'calendario.events.v1';
const DEFAULT_SETTINGS = {
    theme: 'light',
    dateFormat: 'long',
    weekStart: 0
};
let viewTransitionId = 0;
let calendarTransitionId = 0;

function createDefaultEvents() {
    return [
        { id: 1, title: 'Reunión del equipo', date: todayISO(), description: 'Planificación semanal' },
        { id: 2, title: 'Entrega del proyecto', date: addDaysISO(3), description: 'Subir archivos finales' },
        { id: 3, title: 'Cita médica', date: addDaysISO(-2), description: 'Consulta a las 10:00' }
    ];
}

function loadEvents() {
    try {
        const saved = localStorage.getItem(EVENTS_KEY);
        if (saved === null) return createDefaultEvents();

        const events = JSON.parse(saved);
        if (!Array.isArray(events)) {
            throw new Error('El formato de los eventos guardados no es válido.');
        }

        return events.filter(event =>
            event &&
            (typeof event.id === 'number' || typeof event.id === 'string') &&
            typeof event.title === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
            typeof event.description === 'string'
        );
    } catch (error) {
        console.error('No se pudieron cargar los eventos guardados.', error);
        return createDefaultEvents();
    }
}

function persistEvents() {
    try {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(state.events));
        return true;
    } catch (error) {
        console.error('No se pudieron guardar los eventos.', error);
        return false;
    }
}

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (!saved || typeof saved !== 'object') return { ...DEFAULT_SETTINGS };

        return {
            theme: saved.theme === 'dark' ? 'dark' : 'light',
            dateFormat: ['long', 'dmy', 'mdy', 'ymd'].includes(saved.dateFormat) ? saved.dateFormat : DEFAULT_SETTINGS.dateFormat,
            weekStart: saved.weekStart === 1 ? 1 : 0
        };
    } catch (error) {
        console.error('No se pudieron cargar los ajustes guardados.', error);
        return { ...DEFAULT_SETTINGS };
    }
}

const state = {
    currentDate: new Date(),
    selectedDate: new Date(),
    currentView: 'agenda',
    settings: loadSettings(),
    userEmail: '',
    events: loadEvents()
};

function todayISO() {
    const d = new Date();
    return formatISODate(d);
}

function addDaysISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatISODate(d);
}

function formatISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return formatDate(new Date(year, month - 1, day));
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (state.settings.dateFormat === 'dmy') return `${day}/${month}/${year}`;
    if (state.settings.dateFormat === 'mdy') return `${month}/${day}/${year}`;
    if (state.settings.dateFormat === 'ymd') return `${year}-${month}-${day}`;

    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function renderWeekdays() {
    const weekdays = document.querySelector('.calendar-weekdays');
    if (!weekdays) return;

    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const start = state.settings.weekStart;
    weekdays.replaceChildren();
    for (let offset = 0; offset < names.length; offset++) {
        const label = document.createElement('span');
        label.textContent = names[(start + offset) % names.length];
        weekdays.appendChild(label);
    }
}

function updateNavigation(view) {
    if (view === state.currentView) return;

    const previousView = state.currentView;
    state.currentView = view;
    navButtons.forEach(button => {
        const isActive = button.dataset.view === view;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    const previousPanel = previousView === 'settings' ? settingsView : calendarView;
    const nextPanel = view === 'settings' ? settingsView : calendarView;
    const transitionId = ++viewTransitionId;

    if (previousPanel === nextPanel) {
        previousPanel.classList.remove('view-enter', 'view-exit', 'hidden');
        const otherPanel = previousPanel === settingsView ? calendarView : settingsView;
        otherPanel.classList.add('hidden');
        otherPanel.classList.remove('view-enter', 'view-exit');
        return;
    }

    [calendarView, settingsView].forEach(panel => {
        panel.classList.remove('view-enter', 'view-exit', 'hidden');
    });
    previousPanel.classList.add('view-exit');
    nextPanel.classList.add('view-enter');

    window.setTimeout(() => {
        if (transitionId !== viewTransitionId) return;
        previousPanel.classList.add('hidden');
        previousPanel.classList.remove('view-exit');
        nextPanel.classList.remove('view-enter');
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
}

function updateSettingsForm(settings) {
    themeSetting.checked = settings.theme === 'dark';
    dateFormatSetting.value = settings.dateFormat;
    weekStartSetting.value = String(settings.weekStart);
}

function saveSettings(settings, statusMessage) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('No se pudieron guardar los ajustes.', error);
        settingsStatus.textContent = 'No se pudieron guardar los ajustes en este navegador.';
        settingsStatus.classList.add('error');
        return false;
    }

    state.settings = settings;
    document.documentElement.dataset.theme = settings.theme;
    updateSettingsForm(settings);
    renderWeekdays();
    renderCalendar();
    renderSelectedEvents();
    settingsStatus.textContent = statusMessage;
    settingsStatus.classList.remove('error');
    return true;
}

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() - state.settings.weekStart + 7) % 7;
    const totalDays = lastDay.getDate();

    monthLabel.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(state.currentDate);

    calendarDays.innerHTML = '';

    for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarDays.appendChild(emptyCell);
    }

    for (let dayNumber = 1; dayNumber <= totalDays; dayNumber++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'calendar-day';
        cell.dataset.date = formatISODate(new Date(year, month, dayNumber));
        cell.style.setProperty('--day-index', String(dayNumber % 14));

        const date = new Date(year, month, dayNumber);
        const isoDate = formatISODate(date);
        const isToday = isoDate === formatISODate(new Date());
        const isSelected = isoDate === formatISODate(state.selectedDate);

        if (isToday) cell.classList.add('today');
        if (isSelected) cell.classList.add('selected');

        const dayLabel = document.createElement('span');
        dayLabel.className = 'day-number';
        dayLabel.textContent = dayNumber;
        cell.appendChild(dayLabel);

        const dayEvents = state.events.filter(event => event.date === isoDate);
        dayEvents.slice(0, 2).forEach(event => {
            const pill = document.createElement('span');
            pill.className = 'event-pill';
            pill.textContent = event.title;
            cell.appendChild(pill);
        });

        if (dayEvents.length > 2) {
            const more = document.createElement('span');
            more.className = 'event-pill';
            more.textContent = '+' + (dayEvents.length - 2);
            cell.appendChild(more);
        }

        cell.addEventListener('click', () => {
            state.selectedDate = new Date(year, month, dayNumber);
            eventDate.value = isoDate;
            if (eventStatus) eventStatus.textContent = '';
            if (state.currentView === 'today') updateNavigation('agenda');
            renderCalendar();
            renderSelectedEvents();
        });

        calendarDays.appendChild(cell);
    }
}

function renderSelectedEvents() {
    const isoSelected = formatISODate(state.selectedDate);
    const events = state.events.filter(event => event.date === isoSelected);

    const dateLabel = formatDate(state.selectedDate);
    selectedDateLabel.textContent = state.currentView === 'today'
        ? `Hoy, ${dateLabel}`
        : `Eventos del ${dateLabel}`;

    if (!events.length) {
        const emptyMessage = state.currentView === 'today' ? 'No hay eventos para hoy.' : 'No hay eventos para este día.';
        selectedEvents.innerHTML = `<li class="empty-events">${emptyMessage}</li>`;
    } else {
        selectedEvents.replaceChildren();
        events.forEach(event => {
            const item = document.createElement('li');
            item.className = 'event-item';

            const title = document.createElement('strong');
            title.textContent = event.title;

            const description = document.createElement('small');
            description.textContent = event.description || 'Sin descripción';

            item.append(title, description);
            selectedEvents.appendChild(item);
        });
    }

    const totalEvents = state.events.length;
    eventCount.textContent = `${totalEvents} evento${totalEvents !== 1 ? 's' : ''}`;
    const today = formatISODate(new Date());
    const todayEvents = state.events.filter(event => event.date === today);
    todayText.textContent = todayEvents.length
        ? `${todayEvents.length} tarea${todayEvents.length !== 1 ? 's' : ''} para hoy (${formatDisplayDate(today)})`
        : `Sin tareas para hoy (${formatDisplayDate(today)})`;
}

function showToday() {
    const now = new Date();
    updateNavigation('today');
    state.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    state.selectedDate = now;
    eventDate.value = formatISODate(now);
    if (eventStatus) eventStatus.textContent = '';
    renderCalendar();
    renderSelectedEvents();
    const todayCell = calendarDays.querySelector('.calendar-day.today');
    if (todayCell) {
        todayCell.classList.add('today-focus');
        todayCell.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }
}

function refreshForCurrentDay() {
    if (state.currentView === 'today') {
        const now = new Date();
        state.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
        state.selectedDate = now;
    }
    renderCalendar();
    renderSelectedEvents();
}

function scheduleDayRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    window.setTimeout(() => {
        refreshForCurrentDay();
        scheduleDayRefresh();
    }, nextMidnight.getTime() - now.getTime() + 50);
}

function changeMonth(offset) {
    state.currentDate = new Date(
        state.currentDate.getFullYear(),
        state.currentDate.getMonth() + offset,
        1
    );
    calendarDays.classList.remove('month-next', 'month-previous');
    renderCalendar();

    const transitionId = ++calendarTransitionId;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.requestAnimationFrame(() => {
        if (transitionId !== calendarTransitionId) return;
        const transitionClass = offset > 0 ? 'month-next' : 'month-previous';
        calendarDays.classList.add(transitionClass);
        window.setTimeout(() => {
            if (transitionId === calendarTransitionId) {
                calendarDays.classList.remove(transitionClass);
            }
        }, 260);
    });
}

function loginSuccess(email, displayName = email) {
    state.userEmail = email;
    userGreeting.textContent = `Bienvenido, ${displayName}`;
    authPage.classList.add('hidden');
    appShell.classList.remove('hidden');
    renderCalendar();
    renderSelectedEvents();
}

function showAuthPanel(panelToShow) {
    [loginCard, recoverCard, signupCard].forEach(panel => {
        const isVisible = panel === panelToShow;
        panel.classList.toggle('hidden', !isVisible);
        panel.setAttribute('aria-hidden', String(!isVisible));
    });
    authPage.classList.toggle('recover-mode', panelToShow === recoverCard);
}

if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            alert('Ingresa un correo y una contraseña válida.');
            return;
        }

        loginSuccess(email);
        loginForm.reset();
    });
}

if (createAccountLink && signupCard) {
    createAccountLink.addEventListener('click', event => {
        event.preventDefault();
        showAuthPanel(signupCard);
        signupName.focus();
    });
}

if (signupBackLink && loginCard) {
    signupBackLink.addEventListener('click', event => {
        event.preventDefault();
        showAuthPanel(loginCard);
        loginEmail.focus();
    });
}

if (signupForm && signupStatus) {
    signupForm.addEventListener('submit', event => {
        event.preventDefault();
        signupStatus.textContent = '';
        signupStatus.classList.remove('error');

        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirmation = signupPasswordConfirm.value;

        if (name.length < 2) {
            signupStatus.textContent = 'Escribe un nombre de al menos 2 caracteres.';
            signupStatus.classList.add('error');
            signupName.focus();
            return;
        }

        if (password.length < 8) {
            signupStatus.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            signupStatus.classList.add('error');
            signupPassword.focus();
            return;
        }

        if (password !== confirmation) {
            signupStatus.textContent = 'Las contraseñas no coinciden.';
            signupStatus.classList.add('error');
            signupPasswordConfirm.focus();
            return;
        }

        signupForm.reset();
        loginSuccess(email, name);
    });
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        const email = loginEmail.value.trim();
        const googleSignInUrl = new URL('https://accounts.google.com/v3/signin/identifier');
        googleSignInUrl.searchParams.set('flowEntry', 'ServiceLogin');
        googleSignInUrl.searchParams.set('flowName', 'GlifWebSignIn');

        if (email) {
            googleSignInUrl.searchParams.set('Email', email);
        }

        window.location.assign(googleSignInUrl.toString());
    });
}

if (forgotPasswordLink && backToLoginLink && loginCard && recoverCard) {
    forgotPasswordLink.addEventListener('click', event => {
        event.preventDefault();
        loginCard.classList.add('hidden');
        recoverCard.classList.remove('hidden');
        authPage.classList.add('recover-mode');
        recoverCard.setAttribute('aria-hidden', 'false');
        loginCard.setAttribute('aria-hidden', 'true');
        recoverForm.querySelector('input[type="email"]').focus();
    });

    backToLoginLink.addEventListener('click', event => {
        event.preventDefault();
        recoverCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        authPage.classList.remove('recover-mode');
        recoverCard.setAttribute('aria-hidden', 'true');
        loginCard.setAttribute('aria-hidden', 'false');
        loginEmail.focus();
    });
}

if (recoverForm && recoverStatus) {
    recoverForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = recoverForm.querySelector('input[type="email"]').value.trim();

        if (!email) {
            recoverStatus.textContent = 'Ingresa un correo válido.';
            recoverStatus.style.color = '#b91c1c';
            return;
        }

        recoverStatus.textContent = 'Se envió un enlace de recuperación a ' + email;
        recoverStatus.style.color = '#15803d';
        recoverForm.reset();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        appShell.classList.add('hidden');
        authPage.classList.remove('hidden');
        loginForm.reset();
    });
}

if (todayBtn) {
    todayBtn.addEventListener('click', showToday);
}

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const view = button.dataset.view;
        if (view === 'today') {
            showToday();
        } else {
            updateNavigation(view);
        }
    });
});

if (settingsForm) {
    settingsForm.addEventListener('submit', event => {
        event.preventDefault();
        saveSettings({
            theme: themeSetting.checked ? 'dark' : 'light',
            dateFormat: dateFormatSetting.value,
            weekStart: Number(weekStartSetting.value)
        }, 'Ajustes guardados correctamente.');
    });
}

if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', () => {
        saveSettings({ ...DEFAULT_SETTINGS }, 'Se restauraron los ajustes predeterminados.');
    });
}

if (prevMonth) {
    prevMonth.addEventListener('click', () => {
        changeMonth(-1);
    });
}

if (nextMonth) {
    nextMonth.addEventListener('click', () => {
        changeMonth(1);
    });
}

if (eventForm) {
    eventForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const title = eventTitle.value.trim();
        const date = eventDate.value;
        const description = eventDescription.value.trim();

        if (!title || !date) {
            alert('Completa el título y la fecha.');
            return;
        }

        state.events.push({
            id: Date.now(),
            title,
            date,
            description
        });

        const saved = persistEvents();
        eventForm.reset();
        state.selectedDate = new Date(date + 'T00:00:00');
        eventDate.value = date;
        if (state.currentView === 'today') updateNavigation('agenda');
        renderCalendar();
        renderSelectedEvents();
        if (eventStatus) {
            eventStatus.textContent = saved
                ? `Se guardó “${title}” para el ${formatDisplayDate(date)}.`
                : 'El evento se añadió, pero no se pudo guardar en este navegador. Revisa el almacenamiento disponible.';
            eventStatus.classList.toggle('error', !saved);
        }
    });
}

document.documentElement.dataset.theme = state.settings.theme;
updateSettingsForm(state.settings);
renderWeekdays();

const revealElements = document.querySelectorAll(
    '.calendar-panel, .event-form-card, .event-list-card, .mini-card, .settings-panel'
);
if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    revealElements.forEach(element => {
        element.classList.add('scroll-reveal');
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach(element => element.classList.add('is-visible'));
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshForCurrentDay();
});

renderCalendar();
renderSelectedEvents();
eventDate.value = formatISODate(state.selectedDate);
scheduleDayRefresh();
