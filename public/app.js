let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    
    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('hidden');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    }

    function closeSidebar() {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            backdrop.classList.add('hidden');
        }
    }
    
    mobileBtn.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', closeSidebar);

    renderHomeView();

    const backHomeBtn = document.getElementById('back-home-btn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', renderHomeView);
    }

    const mainHeaderTitle = document.getElementById('header-title');
    if (mainHeaderTitle) {
        mainHeaderTitle.addEventListener('click', renderHomeView);
    }
});

function initSidebar() {
    const list = document.getElementById('trip-list');
    if (!travelData || travelData.length === 0) return;

    travelData.forEach(trip => {
        const li = document.createElement('li');
        li.className = 'trip-item';
        
        const fullTitle = trip.title || trip.id;
        const parts = fullTitle.split(' ');
        let datePart = '';
        let namePart = fullTitle;
        
        if (parts.length > 1 && /^20\d{2}-\d{2}/.test(parts[0])) {
            datePart = parts[0];
            namePart = parts.slice(1).join(' ');
        }
        
        if (datePart) {
            li.innerHTML = `<span class="trip-date">${datePart}</span><span class="trip-name">${namePart}</span>`;
        } else {
            li.textContent = fullTitle;
        }

        li.addEventListener('click', () => {
            document.querySelectorAll('.trip-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            
            renderTrip(trip);
        });
        list.appendChild(li);
    });
}

function renderHomeView() {
    const homeView = document.getElementById('home-view');
    const dashboard = document.getElementById('dashboard');
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const backHomeBtn = document.getElementById('back-home-btn');
    const tripCardsGrid = document.getElementById('trip-cards-grid');

    if (homeView) homeView.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
    
    headerTitle.textContent = '所有旅程總覽';
    headerSubtitle.textContent = '';
    
    document.querySelectorAll('.trip-item').forEach(el => el.classList.remove('active'));
    if (backHomeBtn) backHomeBtn.classList.add('active');

    if (tripCardsGrid) {
        tripCardsGrid.innerHTML = '';

        if (!travelData || travelData.length === 0) return;

        const sortedData = [...travelData].sort((a, b) => b.id.localeCompare(a.id));

        sortedData.forEach(trip => {
            let totalTwd = 0;
            let totalLocal = 0;
            let rate = trip.exchange_rate_value || 1.0;
            if (trip.sections) {
                trip.sections.forEach(section => {
                    if (!section.items) return;
                    section.items.forEach(item => {
                        totalTwd += item.twd || 0;
                        totalLocal += item.local || 0;
                    });
                });
            }
            
            let grandTotalTwd = totalTwd + (totalLocal * rate);

            const fullTitle = trip.title || trip.id;
            const parts = fullTitle.split(' ');
            let datePart = '';
            let namePart = fullTitle;
            if (parts.length > 1 && /^20\d{2}-\d{2}/.test(parts[0])) {
                datePart = parts[0];
                namePart = parts.slice(1).join(' ');
            }

            let shortDateRange = '';
            if (trip.date_range) {
                shortDateRange = trip.date_range.replace(/\d{4}-/g, '');
            }

            let displayCurrency = trip.currencyName || '外幣';
            if (displayCurrency === '日幣') displayCurrency = '¥';
            if (displayCurrency === '新加坡幣') displayCurrency = 'SGD$';

            const card = document.createElement('div');
            card.className = 'trip-card';
            card.innerHTML = 
                (datePart ? '<div class="trip-card-date">' + datePart + '</div>' : '') +
                '<div class="trip-card-title">' + namePart + '</div>' +
                (shortDateRange ? '<div class="trip-card-range">' + shortDateRange + '</div>' : '') +
                '<div class="trip-card-footer">' +
                    '<div class="trip-card-cost">' +
                        '<div class="trip-card-cost-label">總花費' + (trip.exchange_rate ? ' <span class="exchange-rate">(' + trip.exchange_rate + ')</span>' : '') + '</div>' +
                        '<div class="trip-card-twd">NT$ ' + Math.round(grandTotalTwd).toLocaleString() + '</div>' +
                    '</div>' +
                '</div>';

            card.addEventListener('click', () => {
                document.querySelectorAll('.trip-item').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.trip-item').forEach(el => {
                    if (el.textContent.includes(namePart)) {
                        el.classList.add('active');
                    }
                });
                renderTrip(trip);
            });

            tripCardsGrid.appendChild(card);
        });
    }
}

function renderTrip(trip) {
    // UI Elements
    const homeView = document.getElementById('home-view');
    const dashboard = document.getElementById('dashboard');
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const totalTwdEl = document.getElementById('total-twd');
    const exchangeRateDisplay = document.getElementById('exchange-rate-display');
    const sectionsContainer = document.getElementById('sections-container');

    // Switch views
    if (homeView) homeView.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');

    headerTitle.textContent = trip.title || trip.id;
    headerSubtitle.textContent = trip.date_range || '';
    
    let displayCurrency = trip.currencyName || '外幣';
    if (displayCurrency === '日幣') displayCurrency = '¥';
    if (displayCurrency === '新加坡幣') displayCurrency = 'SGD$';
    
    if (exchangeRateDisplay) {
        if (trip.exchange_rate) {
            exchangeRateDisplay.textContent = `(${trip.exchange_rate})`;
            exchangeRateDisplay.style.display = 'block';
        } else {
            exchangeRateDisplay.style.display = 'none';
        }
    }

    let totalTwd = 0;
    let totalLocal = 0;
    let rate = trip.exchange_rate_value || 1.0;
    
    // For Chart
    const categoryTotals = {};

    sectionsContainer.innerHTML = '';

    currentSelectedCategory = null;

    trip.sections.forEach(section => {
        if (!section.items || section.items.length === 0) return;

        // Group container
        const groupDiv = document.createElement('div');
        groupDiv.className = 'section-group';

        // Header
        const header = document.createElement('div');
        header.className = 'section-header';
        
        const headerText = document.createElement('span');
        headerText.textContent = section.name;
        header.appendChild(headerText);
        
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'section-toggle-icon';
        toggleIcon.textContent = '▼';
        header.appendChild(toggleIcon);
        
        header.addEventListener('click', () => {
            groupDiv.classList.toggle('collapsed');
        });
        
        groupDiv.appendChild(header);

        // Table
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>項目</th>
                    <th>台幣</th>
                    <th>${displayCurrency}</th>
                    <th>備註</th>
                    <th>類型</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');

        section.items.forEach(item => {
            totalTwd += item.twd || 0;
            totalLocal += item.local || 0;

            // Chart data
            const cat = item.type || '未分類';
            let amt = (item.twd || 0) + ((item.local || 0) * rate);
            
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

            const tr = document.createElement('tr');
            const category = item.type || '其他';
            tr.setAttribute('data-category', category);
            tr.className = 'detail-item-row';
            
            const tdName = document.createElement('td');
            tdName.innerHTML = (item.name || '').replace(/\n/g, '<br>');
            
            const tdTwd = document.createElement('td');
            tdTwd.className = 'val-twd';
            tdTwd.textContent = item.twd ? item.twd.toLocaleString() : '';
            
            const tdLocal = document.createElement('td');
            tdLocal.className = 'val-local';
            tdLocal.textContent = item.local ? item.local.toLocaleString() : '';
            
            const tdNote = document.createElement('td');
            tdNote.className = 'note-text';
            tdNote.textContent = item.note || '';
            
            const tdType = document.createElement('td');
            if (item.type) {
                const badge = document.createElement('span');
                badge.className = 'type-badge';
                badge.textContent = item.type;
                tdType.appendChild(badge);
            }

            tr.appendChild(tdName);
            tr.appendChild(tdTwd);
            tr.appendChild(tdLocal);
            tr.appendChild(tdNote);
            tr.appendChild(tdType);

            tbody.appendChild(tr);
        });

        tableWrapper.appendChild(table);
        groupDiv.appendChild(tableWrapper);
        sectionsContainer.appendChild(groupDiv);
    });

    let grandTotalTwd = totalTwd + (totalLocal * rate);
    totalTwdEl.textContent = `NT$ ${Math.round(grandTotalTwd).toLocaleString()}`;


    renderChart(categoryTotals);
}

// Keep track of current selected category
let currentSelectedCategory = null;

function filterItems(category) {
    currentSelectedCategory = (currentSelectedCategory === category) ? null : category;
    const effectiveCategory = currentSelectedCategory;

    const sections = document.querySelectorAll('.section-group');
    sections.forEach(section => {
        const rows = section.querySelectorAll('tr.detail-item-row');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const rowCat = row.getAttribute('data-category');
            if (!effectiveCategory || rowCat === effectiveCategory) {
                row.classList.remove('filtered-out');
                visibleCount++;
            } else {
                row.classList.add('filtered-out');
            }
        });
        
        // Hide the whole section if no rows are visible
        if (visibleCount === 0) {
            section.classList.add('filtered-out');
        } else {
            section.classList.remove('filtered-out');
        }
    });
    
    return currentSelectedCategory;
}

function renderChart(data) {
    try {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (currentChart) {
            currentChart.destroy();
        }

        const entries = Object.entries(data).filter(([k, v]) => v > 0);
        entries.sort((a, b) => b[1] - a[1]);
        
        const sortedLabels = entries.map(e => e[0]);
        const sortedValues = entries.map(e => e[1]);
        
        const total = sortedValues.reduce((sum, val) => sum + val, 0);
        const displayLabels = sortedLabels.map((label, idx) => {
            const pct = Math.round((sortedValues[idx] / total) * 100);
            return `${label} (${pct}%)`;
        });

        const backgroundColors = [
            '#38bdf8', '#8b5cf6', '#f43f5e', '#34d399', '#fbbf24', '#a855f7', '#ec4899'
        ];

        // Ensure we pass an array of colors directly
        const bgColors = sortedValues.map((_, i) => backgroundColors[i % backgroundColors.length]);

        // Apply colors to table badges
        const categoryColorMap = {};
        sortedLabels.forEach((label, idx) => {
            categoryColorMap[label] = bgColors[idx];
        });

        document.querySelectorAll('tr.detail-item-row').forEach(row => {
            const cat = row.getAttribute('data-category');
            const badge = row.querySelector('.type-badge');
            if (badge && categoryColorMap[cat]) {
                const color = categoryColorMap[cat];
                badge.style.backgroundColor = color + '25'; // ~15% opacity
                badge.style.color = color;
                badge.style.border = `1px solid ${color}40`;
            }
        });

        currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayLabels,
                datasets: [{
                    label: '花費',
                    data: sortedValues,
                    backgroundColor: [...bgColors],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'y',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                onClick: (e, activeElements) => {
                    let selected = null;
                    if (activeElements.length > 0) {
                        const idx = activeElements[0].index;
                        selected = filterItems(sortedLabels[idx]);
                    } else {
                        selected = filterItems(null);
                    }
                    
                    if (selected) {
                        const selectedIdx = sortedLabels.indexOf(selected);
                        currentChart.data.datasets[0].backgroundColor = bgColors.map((color, i) => {
                            return i === selectedIdx ? color : color + '40';
                        });
                    } else {
                        currentChart.data.datasets[0].backgroundColor = [...bgColors];
                    }
                    currentChart.update();
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { display: false }
                    },
                    y: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            color: (context) => {
                                if (context.index === undefined) return '#f8fafc';
                                const baseColor = bgColors[context.index];
                                if (currentSelectedCategory) {
                                    const isSelected = sortedLabels[context.index] === currentSelectedCategory;
                                    return isSelected ? baseColor : baseColor + '40';
                                }
                                return baseColor;
                            },
                            font: { family: "'Inter', sans-serif", size: 14 }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Chart error:', error);
        document.querySelector('.canvas-wrapper').innerHTML = `<div style="color: red; padding: 20px;">錯誤: ${error.message}</div>`;
    }
}
