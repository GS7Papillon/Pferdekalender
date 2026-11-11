document.addEventListener('DOMContentLoaded', function () {

    // 1. GLOBALE ELEMENTE & DATENBANK (localStorage) INITIALISIEREN
    const dateInput = document.getElementById('entry-date');
    const entriesList = document.getElementById('entries-list');
    const filterSelect = document.getElementById('filter-category');

    // Heutiges Datum im Format YYYY-MM-DD setzen
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Gespeicherte Einträge aus dem Browser-Speicher laden
    let entries = [];
    try {
        const savedData = localStorage.getItem('stallTagebuchEntries');
        if (savedData) {
            entries = JSON.parse(savedData);
        }
    } catch (err) {
        entries = [];
    }

    // 2. TAB-NAVIGATION (Umschalten zwischen Training, Futter, Gesundheit)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    tabButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            tabButtons.forEach(function (btn) {
                btn.classList.remove('active');
            });
            tabSections.forEach(function (sec) {
                sec.classList.remove('active');
            });

            button.classList.add('active');

            const targetId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // 3. HILFSFUNKTIONEN: DATUM PRÜFEN & SPEICHERN
    function getValidDate() {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert('Bitte wähle oben im Kopfbereich zuerst ein gültiges Datum aus.');
            dateInput.focus();
            return null;
        }
        return selectedDate;
    }

    function saveNewEntry(newEntry) {
        entries.push(newEntry);

        // Nach Datum absteigend sortieren (neueste zuerst)
        entries.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        localStorage.setItem('stallTagebuchEntries', JSON.stringify(entries));
        renderEntries();
    }

    // 4. FORMULAR 1: TRAINING SPEICHERN & VALIDIEREN
    const formTraining = document.getElementById('form-training');

    if (formTraining) {
        formTraining.addEventListener('submit', function (event) {
            event.preventDefault();

            const date = getValidDate();
            if (!date) return;

            const sportType = document.getElementById('sport-type').value;
            const duration = parseInt(document.getElementById('sport-duration').value, 10);
            const intensity = document.getElementById('sport-intensity').value;
            const mood = document.getElementById('horse-mood').value;
            const notes = document.getElementById('sport-notes').value.trim();

            if (isNaN(duration) || duration < 5 || duration > 300) {
                alert('Fehlerhafte Eingabe: Bitte gib eine realistische Trainingsdauer zwischen 5 und 300 Minuten ein.');
                return;
            }

            let intensityFactor = 1;
            if (intensity === 'Hoch') {
                intensityFactor = 3;
            } else if (intensity === 'Mittel') {
                intensityFactor = 2;
            }
            const workloadScore = duration * intensityFactor;

            let detailsText = 'Pferd war: ' + mood + ' | Belastungs-Score: ' + workloadScore + ' Pkt.';
            if (notes !== '') {
                detailsText += ' — Notiz: ' + notes;
            }

            const trainingEntry = {
                id: Date.now(),
                category: 'training',
                badgeText: '🏇 Training',
                date: date,
                title: sportType + ' (' + duration + ' Min. • Intensität: ' + intensity + ')',
                details: detailsText
            };

            saveNewEntry(trainingEntry);
            formTraining.reset();
        });
    }

    // 5. FORMULAR 2: FUTTER SPEICHERN & BERECHNEN
    const formFeed = document.getElementById('form-feed');

    if (formFeed) {
        formFeed.addEventListener('submit', function (event) {
            event.preventDefault();

            const date = getValidDate();
            if (!date) return;

            const feedType = document.getElementById('feed-type').value.trim();
            const weight = parseFloat(document.getElementById('feed-weight').value);
            const unit = document.getElementById('feed-unit').value;

            if (feedType.length < 2) {
                alert('Fehlerhafte Eingabe: Bitte gib eine gültige Futterart (mindestens 2 Buchstaben) ein.');
                return;
            }

            if (isNaN(weight) || weight <= 0 || weight > 100) {
                alert('Fehlerhafte Eingabe: Bitte gib eine gültige Futtermenge größer als 0 ein.');
                return;
            }

            const weightInGrams = (unit === 'kg') ? Math.round(weight * 1000) : Math.round(weight);

            const feedEntry = {
                id: Date.now(),
                category: 'feed',
                badgeText: '🌾 Futter',
                date: date,
                title: feedType + ': ' + weight + ' ' + unit,
                details: 'Tagesration entspricht exakt ' + weightInGrams + ' g.'
            };

            saveNewEntry(feedEntry);
            formFeed.reset();
        });
    }

    // 6. FORMULAR 3: GESUNDHEIT SPEICHERN & VALIDIEREN
    const formHealth = document.getElementById('form-health');

    if (formHealth) {
        formHealth.addEventListener('submit', function (event) {
            event.preventDefault();

            const date = getValidDate();
            if (!date) return;

            const healthCategory = document.getElementById('health-category').value;
            const details = document.getElementById('health-details').value.trim();

            if (details.length < 3) {
                alert('Fehlerhafte Eingabe: Bitte beschreibe den Befund, die Impfung oder das Medikament etwas genauer.');
                return;
            }

            const healthEntry = {
                id: Date.now(),
                category: 'health',
                badgeText: '🩺 Gesundheit',
                date: date,
                title: healthCategory,
                details: details
            };

            saveNewEntry(healthEntry);
            formHealth.reset();
        });
    }

    // 7. LOGBUCH ANZEIGEN, FILTERN & EINTRÄGE LÖSCHEN
    if (filterSelect) {
        filterSelect.addEventListener('change', renderEntries);
    }

    function renderEntries() {
        if (!entriesList) return;

        const activeFilter = filterSelect ? filterSelect.value : 'all';

        const filteredEntries = entries.filter(function (entry) {
            if (activeFilter === 'all') return true;
            return entry.category === activeFilter;
        });

        entriesList.innerHTML = '';

        if (filteredEntries.length === 0) {
            entriesList.innerHTML = '<p class="empty-state">Keine Einträge für diese Auswahl vorhanden.</p>';
            return;
        }

        filteredEntries.forEach(function (entry) {
            const dateParts = entry.date.split('-');
            const formattedDate = dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];

            const card = document.createElement('div');
            card.className = 'entry-card';
            card.setAttribute('data-category', entry.category);

            card.innerHTML =
                '<div class="entry-content">' +
                    '<div class="entry-header">' +
                        '<span class="entry-badge">' + entry.badgeText + '</span>' +
                        '<span class="entry-date">' + formattedDate + '</span>' +
                    '</div>' +
                    '<div class="entry-title">' + entry.title + '</div>' +
                    '<div class="entry-details">' + entry.details + '</div>' +
                '</div>' +
                '<button type="button" class="btn-delete" title="Eintrag löschen">🗑️</button>';

            const deleteBtn = card.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', function () {
                entries = entries.filter(function (item) {
                    return item.id !== entry.id;
                });
                localStorage.setItem('stallTagebuchEntries', JSON.stringify(entries));
                renderEntries();
            });

            entriesList.appendChild(card);
        });
    }

    renderEntries();
});