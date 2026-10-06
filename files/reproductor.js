function initApp(playlist, eventos, notasParaHoy) {
    const currentIndex = { value: 0 };
    const audioPlayer = document.getElementById('audioPlayer');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const iconPlay = document.getElementById('iconPlay');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const currentTrackTitle = document.getElementById('currentTrackTitle');
    const currentTimeText = document.getElementById('currentTimeText');
    const durationTimeText = document.getElementById('durationTimeText');
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const btnTogglePlaylist = document.getElementById('btnTogglePlaylist');
    const playlistDropdown = document.getElementById('playlistDropdown');
    const volumeControl = document.getElementById('volumeControl');
    const btnUploadLocal = document.getElementById('btnUploadLocal');
    const localAudioInput = document.getElementById('localAudioInput');
    const themeSelector = document.getElementById('themeSelector');

    if (!audioPlayer || !btnPlayPause || !currentTrackTitle || !progressContainer || !playlistDropdown) {
        return;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function renderPlaylistUI() {
        playlistDropdown.innerHTML = '';

        if (!playlist || playlist.length === 0) {
            playlistDropdown.innerHTML = '<div class="playlist-item">Sin canciones disponibles</div>';
            return;
        }

        playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === currentIndex.value ? 'active' : ''}`;
            item.innerHTML = `<i class="fa-solid ${index === currentIndex.value ? 'fa-music' : 'fa-play'} me-1"></i> ${track.title}`;

            item.addEventListener('click', () => {
                loadTrack(index, true);
                playlistDropdown.classList.remove('show');
                btnTogglePlaylist.setAttribute('aria-expanded', 'false');
            });

            playlistDropdown.appendChild(item);
        });
    }

    function loadTrack(index, autoPlay = false) {
        if (!playlist || playlist.length === 0) {
            currentTrackTitle.textContent = 'Sin canciones';
            return;
        }

        currentIndex.value = Number(index);
        currentTrackTitle.textContent = playlist[currentIndex.value].title;
        currentTrackTitle.title = playlist[currentIndex.value].title;
        audioPlayer.src = playlist[currentIndex.value].url;
        renderPlaylistUI();

        if (autoPlay) {
            audioPlayer.play();
            iconPlay.className = 'fa-solid fa-pause';
        }
    }

    btnPlayPause.addEventListener('click', () => {
        if (!playlist || playlist.length === 0) return;

        if (audioPlayer.paused) {
            if (!audioPlayer.src) {
                loadTrack(currentIndex.value);
            }
            audioPlayer.play();
            iconPlay.className = 'fa-solid fa-pause';
        } else {
            audioPlayer.pause();
            iconPlay.className = 'fa-solid fa-play';
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBarFill.style.width = `${percent}%`;
            currentTimeText.textContent = formatTime(audioPlayer.currentTime);
            durationTimeText.textContent = formatTime(audioPlayer.duration);
        }
    });

    progressContainer.addEventListener('click', (e) => {
        if (!audioPlayer.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        audioPlayer.currentTime = (clickX / rect.width) * audioPlayer.duration;
    });

    btnTogglePlaylist.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = playlistDropdown.classList.toggle('show');
        btnTogglePlaylist.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
        if (!playlistDropdown.contains(event.target) && event.target !== btnTogglePlaylist) {
            playlistDropdown.classList.remove('show');
            btnTogglePlaylist.setAttribute('aria-expanded', 'false');
        }
    });

    btnPrev.addEventListener('click', () => {
        if (!playlist || playlist.length === 0) return;
        currentIndex.value = (currentIndex.value - 1 + playlist.length) % playlist.length;
        loadTrack(currentIndex.value, true);
    });

    btnNext.addEventListener('click', () => {
        if (!playlist || playlist.length === 0) return;
        currentIndex.value = (currentIndex.value + 1) % playlist.length;
        loadTrack(currentIndex.value, true);
    });

    audioPlayer.addEventListener('ended', () => {
        if (!playlist || playlist.length === 0) return;
        currentIndex.value = (currentIndex.value + 1) % playlist.length;
        loadTrack(currentIndex.value, true);
    });

    if (volumeControl) {
        volumeControl.addEventListener('input', (e) => {
            audioPlayer.volume = Number(e.target.value);
        });
    }

    if (btnUploadLocal && localAudioInput) {
        btnUploadLocal.addEventListener('click', () => localAudioInput.click());

        localAudioInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const objectURL = URL.createObjectURL(file);
            const customTrackIndex = playlist.length;
            playlist.push({ title: file.name, url: objectURL });
            loadTrack(customTrackIndex, true);
        });
    }

    function applyTheme(theme) {
        const validTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', validTheme);
        if (themeSelector) {
            themeSelector.value = validTheme;
        }
        localStorage.setItem('selectedTheme', validTheme);
    }

    const savedTheme = localStorage.getItem('selectedTheme') || 'light';
    applyTheme(savedTheme);

    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }

    renderPlaylistUI();

    if (playlist && playlist.length > 0) {
        loadTrack(0);
    }

    if (eventos && Array.isArray(eventos)) {
        const calendarEl = document.getElementById('calendar');
        const calendar = window.FullCalendar;

        if (calendarEl && calendar) {
            const fcCalendar = new calendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                height: 'auto',
                locale: 'es',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                },
                buttonText: {
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    list: 'Agenda'
                },
                events: eventos,
                eventClick: function (info) {
                    const descripcion = info.event.extendedProps.description || 'Sin descripción adicional';

                    if (window.Swal) {
                        Swal.fire({
                            title: info.event.title,
                            html: `<p class="text-start"><strong>📅 Fecha:</strong> ${info.event.start.toLocaleDateString('es-ES')}</p>
                                   <p class="text-start"><strong>📝 Detalles:</strong><br>${descripcion}</p>`,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: '<i class="fa-solid fa-trash me-1"></i> Eliminar',
                            cancelButtonText: 'Cerrar'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = 'eliminar_nota.php?id=' + info.event.id;
                            }
                        });
                    }
                }
            });

            fcCalendar.render();
        }
    }

    if (notasParaHoy && notasParaHoy.length > 0 && window.Swal) {
        let htmlContenido = '<div class="text-start mt-2">';
        notasParaHoy.forEach((nota, index) => {
            const desc = nota.descripcion ? nota.descripcion : 'Sin detalles adicionales';
            htmlContenido += `
                <div class="p-2 mb-2 rounded bg-light text-dark border">
                    <strong class="text-danger">📌 ${index + 1}. ${nota.titulo}</strong>
                    <p class="mb-0 small text-muted">${desc}</p>
                </div>
            `;
        });
        htmlContenido += '</div>';

        Swal.fire({
            title: '🔔 ¡Recordatorio para Hoy!',
            html: `<p>Tienes <strong>${notasParaHoy.length}</strong> nota(s) pendiente(s) para el día de hoy:</p>` + htmlContenido,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#e11d48'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const playlist = [
        { title: 'Lo mejor de la mañana', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { title: 'Música relajante', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { title: 'Pista de estudio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ];

    const eventos = [];
    const notasParaHoy = [];

    initApp(playlist, eventos, notasParaHoy);
});
