/**
 * TableToolkit - Standalone, Reusable Table Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * Provides smart type-aware sorting (datetime, numeric, alphanumeric, alphabetic)
 * with visual indicators (▲ / ▼ / ↕) and universal responsive pagination.
 * 
 * Works with any dataset / HTML table structure without external dependencies.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (window) {
    'use strict';

    /**
     * Collator instance for high-performance natural alphanumeric sorting.
     * Naturally sorts 'USR-1002' after 'USR-1001' and '1.10.0' after '1.2.0'.
     */
    const naturalCollator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base'
    });

    /**
     * Detects or normalizes the value type for smart comparison.
     * @param {*} val 
     * @returns {'date'|'number'|'alphanumeric'|'string'}
     */
    function detectValueType(val) {
        if (val === null || val === undefined || val === '') return 'string';
        if (typeof val === 'number') return 'number';
        if (val instanceof Date) return 'date';

        // Firestore Timestamp object
        if (typeof val === 'object' && typeof val.toDate === 'function') return 'date';
        if (typeof val === 'object' && typeof val.seconds === 'number') return 'date';

        const str = String(val).trim();

        // Check pure numeric (including integers, decimals, negative numbers)
        if (/^-?\d+(\.\d+)?$/.test(str.replace(/,/g, ''))) {
            return 'number';
        }

        // Check valid date formats (e.g. ISO strings '2026-08-31', 'Aug 30, 2026', '2026-08-30T10:20:00')
        if (str.length >= 8 && (str.includes('-') || str.includes('/') || str.includes(','))) {
            const parsed = Date.parse(str);
            if (!isNaN(parsed) && parsed > 0) {
                return 'date';
            }
        }

        // Check alphanumeric string containing mixed letters and digits (e.g. 'USR-1001', '192.168.1.1', 'v3.1.2')
        if (/\d/.test(str) && /[a-zA-Z._-]/.test(str)) {
            return 'alphanumeric';
        }

        return 'string';
    }

    /**
     * Normalizes a field value into a comparable primitive based on type.
     * @param {*} val 
     * @param {string} [explicitType] 
     * @returns {*}
     */
    function normalizeValue(val, explicitType) {
        if (val === null || val === undefined) return '';

        // Firestore Timestamp support
        if (typeof val === 'object') {
            if (typeof val.toDate === 'function') return val.toDate().getTime();
            if (typeof val.seconds === 'number') return val.seconds * 1000;
        }

        const type = explicitType || detectValueType(val);

        if (type === 'date') {
            if (val instanceof Date) return val.getTime();
            const parsed = Date.parse(String(val));
            return isNaN(parsed) ? 0 : parsed;
        }

        if (type === 'number') {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
            return isNaN(num) ? 0 : num;
        }

        return String(val).trim();
    }

    /**
     * Smart comparison between two values.
     * @param {*} a 
     * @param {*} b 
     * @param {string} [explicitType] - 'date' | 'number' | 'alphanumeric' | 'string' | 'auto'
     * @param {'asc'|'desc'} [direction='asc'] 
     * @returns {number}
     */
    function smartCompare(a, b, explicitType, direction) {
        const dirMultiplier = (direction === 'desc') ? -1 : 1;

        // Handle null / undefined / empty
        const aEmpty = (a === null || a === undefined || a === '');
        const bEmpty = (b === null || b === undefined || b === '');
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;  // Empty values always go to the bottom
        if (bEmpty) return -1;

        const effectiveType = (!explicitType || explicitType === 'auto')
            ? detectValueType(a)
            : explicitType;

        const normA = normalizeValue(a, effectiveType);
        const normB = normalizeValue(b, effectiveType);

        if (effectiveType === 'date' || effectiveType === 'number') {
            if (normA < normB) return -1 * dirMultiplier;
            if (normA > normB) return 1 * dirMultiplier;
            return 0;
        }

        // Alphanumeric / Natural sorting
        if (effectiveType === 'alphanumeric') {
            return naturalCollator.compare(String(normA), String(normB)) * dirMultiplier;
        }

        // Standard string alphabetical comparison (case-insensitive)
        return String(normA).localeCompare(String(normB), undefined, { sensitivity: 'base' }) * dirMultiplier;
    }

    /**
     * Sorts an array of items by an object property key or accessor function.
     * @param {Array<Object>} items - Array of data objects
     * @param {string|Function} keyOrAccessor - Property key or accessor function(item)
     * @param {'asc'|'desc'} [direction='asc'] 
     * @param {string} [explicitType='auto'] 
     * @returns {Array<Object>} Sorted shallow copy of array
     */
    function sortDataset(items, keyOrAccessor, direction, explicitType) {
        if (!Array.isArray(items) || items.length <= 1) return items ? [...items] : [];

        const isAccessor = typeof keyOrAccessor === 'function';
        const sorted = [...items];

        sorted.sort((itemA, itemB) => {
            const valA = isAccessor ? keyOrAccessor(itemA) : (itemA ? itemA[keyOrAccessor] : undefined);
            const valB = isAccessor ? keyOrAccessor(itemB) : (itemB ? itemB[keyOrAccessor] : undefined);
            return smartCompare(valA, valB, explicitType, direction);
        });

        return sorted;
    }

    /**
     * Slices an array of items into a paginated subset.
     * @param {Array} items 
     * @param {number} page - 1-based page number
     * @param {number} pageSize - Number of items per page
     * @returns {{ items: Array, totalItems: number, totalPages: number, currentPage: number, from: number, to: number }}
     */
    function paginateDataset(items, page, pageSize) {
        const list = Array.isArray(items) ? items : [];
        const totalItems = list.length;
        const size = Math.max(1, parseInt(pageSize, 10) || 10);
        const totalPages = Math.max(1, Math.ceil(totalItems / size));
        const currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);

        const fromIndex = (currentPage - 1) * size;
        const toIndex = Math.min(fromIndex + size, totalItems);
        const pageItems = list.slice(fromIndex, toIndex);

        return {
            items: pageItems,
            totalItems: totalItems,
            totalPages: totalPages,
            currentPage: currentPage,
            pageSize: size,
            from: totalItems > 0 ? fromIndex + 1 : 0,
            to: toIndex
        };
    }

    /**
     * Generates and mounts accessible pagination controls into a container element.
     * @param {HTMLElement|string} container - Container element or CSS selector
     * @param {Object} paginationMeta - Metadata returned from paginateDataset
     * @param {Function} onPageChange - Callback function(newPageNumber)
     */
    function renderPaginationUI(container, paginationMeta, onPageChange) {
        const containerEl = (typeof container === 'string')
            ? document.querySelector(container)
            : container;

        if (!containerEl) return;

        const { totalItems, totalPages, currentPage, from, to } = paginationMeta;

        if (totalItems === 0) {
            containerEl.innerHTML = '<span class="pagination-info">0 records</span>';
            return;
        }

        let html = '';

        // Summary Information
        const infoText = (from && to)
            ? `Page ${currentPage} of ${totalPages} &nbsp;<span style="opacity:0.8;">(${from}–${to} of ${totalItems} records)</span>`
            : `Page ${currentPage} of ${totalPages}`;

        html += `<span class="pagination-info">${infoText}</span>`;

        // Previous Button
        const prevDisabled = (currentPage <= 1) ? 'disabled' : '';
        html += `<button type="button" class="pg-btn pg-prev" ${prevDisabled} data-page="${currentPage - 1}" title="Previous Page">‹ Prev</button>`;

        // Page Number Buttons with Smart Ellipses Windowing
        const windowSize = 5;
        let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
        let endPage = Math.min(totalPages, startPage + windowSize - 1);

        if (endPage - startPage + 1 < windowSize) {
            startPage = Math.max(1, endPage - windowSize + 1);
        }

        // First page + ellipsis
        if (startPage > 1) {
            html += `<button type="button" class="pg-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pg-ellipsis">…</span>`;
            }
        }

        // Numbered Pages
        for (let p = startPage; p <= endPage; p++) {
            const activeClass = (p === currentPage) ? 'active' : '';
            const ariaCurrent = (p === currentPage) ? 'aria-current="page"' : '';
            html += `<button type="button" class="pg-btn ${activeClass}" ${ariaCurrent} data-page="${p}">${p}</button>`;
        }

        // Last page + ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pg-ellipsis">…</span>`;
            }
            html += `<button type="button" class="pg-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next Button
        const nextDisabled = (currentPage >= totalPages) ? 'disabled' : '';
        html += `<button type="button" class="pg-btn pg-next" ${nextDisabled} data-page="${currentPage + 1}" title="Next Page">Next ›</button>`;

        containerEl.innerHTML = html;

        // Attach click delegation
        containerEl.onclick = function (event) {
            const btn = event.target.closest('button[data-page]');
            if (!btn || btn.disabled || btn.classList.contains('active')) return;
            const targetPage = parseInt(btn.getAttribute('data-page'), 10);
            if (!isNaN(targetPage) && typeof onPageChange === 'function') {
                onPageChange(targetPage);
            }
        };
    }

    /**
     * Binds sortable headers to a table and renders sorting icons.
     * @param {HTMLTableElement|string} table - Table element or CSS selector
     * @param {Object} options 
     * @param {string} [options.activeKey] - Initially active sort key
     * @param {'asc'|'desc'} [options.activeDir='asc'] - Initial sort direction
     * @param {Function} options.onSort - Callback function(sortKey, sortDir, sortType)
     */
    function attachSortableHeaders(table, options) {
        const tableEl = (typeof table === 'string') ? document.querySelector(table) : table;
        if (!tableEl) return;

        const opts = options || {};
        let currentKey = opts.activeKey || '';
        let currentDir = opts.activeDir || 'asc';

        const headers = tableEl.querySelectorAll('th.sortable');

        headers.forEach(th => {
            const sortKey = th.getAttribute('data-sort-key');
            if (!sortKey) return;

            // Ensure accessibility attributes
            th.setAttribute('tabindex', '0');
            th.setAttribute('role', 'columnheader');

            // Find or create sort icon element
            let iconEl = th.querySelector('.sort-icon');
            if (!iconEl) {
                iconEl = document.createElement('span');
                iconEl.className = 'sort-icon';
                th.appendChild(iconEl);
            }

            // Update visual state
            updateHeaderIcon(th, sortKey === currentKey ? currentDir : null);

            // Bind click handler
            th.onclick = function () {
                let newDir = 'asc';
                if (currentKey === sortKey) {
                    newDir = (currentDir === 'asc') ? 'desc' : 'asc';
                }
                currentKey = sortKey;
                currentDir = newDir;

                // Update all headers
                headers.forEach(otherTh => {
                    const otherKey = otherTh.getAttribute('data-sort-key');
                    updateHeaderIcon(otherTh, otherKey === currentKey ? currentDir : null);
                });

                const sortType = th.getAttribute('data-sort-type') || 'auto';
                if (typeof opts.onSort === 'function') {
                    opts.onSort(currentKey, currentDir, sortType);
                }
            };

            // Keyboard accessibility (Enter / Space)
            th.onkeydown = function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    th.click();
                }
            };
        });

        function updateHeaderIcon(thEl, direction) {
            const icon = thEl.querySelector('.sort-icon');
            thEl.classList.remove('sorted-asc', 'sorted-desc');

            if (!direction) {
                thEl.setAttribute('aria-sort', 'none');
                if (icon) icon.innerHTML = '<i class="fas fa-sort" aria-hidden="true"></i>';
            } else if (direction === 'asc') {
                thEl.classList.add('sorted-asc');
                thEl.setAttribute('aria-sort', 'ascending');
                if (icon) icon.innerHTML = '<i class="fas fa-sort-up" aria-hidden="true"></i>';
            } else if (direction === 'desc') {
                thEl.classList.add('sorted-desc');
                thEl.setAttribute('aria-sort', 'descending');
                if (icon) icon.innerHTML = '<i class="fas fa-sort-down" aria-hidden="true"></i>';
            }
        }

        return {
            setSort: function (key, dir) {
                currentKey = key;
                currentDir = dir || 'asc';
                headers.forEach(th => {
                    const k = th.getAttribute('data-sort-key');
                    updateHeaderIcon(th, k === currentKey ? currentDir : null);
                });
            }
        };
    }

    /**
     * Standalone Data Table Manager class for end-to-end sorting & pagination management.
     */
    class DataTableController {
        /**
         * @param {Object} config
         * @param {Array<Object>} [config.data=[]] - Initial dataset
         * @param {number} [config.pageSize=10] - Items per page
         * @param {string} [config.initialSortKey=''] - Default sort column key
         * @param {'asc'|'desc'} [config.initialSortDir='asc'] - Default sort direction
         * @param {string} [config.initialSortType='auto'] - Default sort type
         * @param {string|HTMLElement} [config.table] - Table element or selector
         * @param {string|HTMLElement} [config.pagination] - Pagination container element or selector
         * @param {Function} config.onRender - Function(pageItems, paginationMeta) to render table rows
         */
        constructor(config) {
            this.config = Object.assign({
                data: [],
                pageSize: 10,
                initialSortKey: '',
                initialSortDir: 'asc',
                initialSortType: 'auto',
                table: null,
                pagination: null,
                onRender: null
            }, config);

            this.rawData = Array.isArray(this.config.data) ? [...this.config.data] : [];
            this.filteredData = [...this.rawData];
            this.currentPage = 1;
            this.pageSize = this.config.pageSize;
            this.sortKey = this.config.initialSortKey;
            this.sortDir = this.config.initialSortDir;
            this.sortType = this.config.initialSortType;

            this.init();
        }

        init() {
            if (this.config.table) {
                this.sortHeaderHelper = attachSortableHeaders(this.config.table, {
                    activeKey: this.sortKey,
                    activeDir: this.sortDir,
                    onSort: (key, dir, type) => {
                        this.sort(key, dir, type);
                    }
                });
            }
        }

        /**
         * Replaces the underlying dataset and re-renders from page 1.
         * @param {Array<Object>} newData 
         */
        setData(newData) {
            this.rawData = Array.isArray(newData) ? [...newData] : [];
            this.filteredData = [...this.rawData];
            this.currentPage = 1;
            this.render();
        }

        /**
         * Applies a filter predicate function to the dataset.
         * @param {Function} filterPredicate - Function(item) => boolean
         */
        filter(filterPredicate) {
            if (typeof filterPredicate === 'function') {
                this.filteredData = this.rawData.filter(filterPredicate);
            } else {
                this.filteredData = [...this.rawData];
            }
            this.currentPage = 1;
            this.render();
        }

        /**
         * Sorts the dataset by specified key and direction.
         * @param {string} key 
         * @param {'asc'|'desc'} dir 
         * @param {string} [type='auto'] 
         */
        sort(key, dir, type) {
            this.sortKey = key;
            this.sortDir = dir || 'asc';
            this.sortType = type || 'auto';
            this.render();
        }

        /**
         * Changes to a specific page number.
         * @param {number} pageNumber 
         */
        setPage(pageNumber) {
            this.currentPage = pageNumber;
            this.render();
        }

        /**
         * Sets page size.
         * @param {number} size 
         */
        setPageSize(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.render();
        }

        /**
         * Processes sorting, slices the paginated chunk, and triggers onRender callback.
         */
        render() {
            let processed = this.filteredData;

            // Apply Sort
            if (this.sortKey) {
                processed = sortDataset(this.filteredData, this.sortKey, this.sortDir, this.sortType);
            }

            // Apply Pagination
            const meta = paginateDataset(processed, this.currentPage, this.pageSize);
            this.currentPage = meta.currentPage;

            // Render Table Rows Callback
            if (typeof this.config.onRender === 'function') {
                this.config.onRender(meta.items, meta);
            }

            // Render Pagination UI
            if (this.config.pagination) {
                renderPaginationUI(this.config.pagination, meta, (newPage) => {
                    this.setPage(newPage);
                });
            }
        }
    }

    // Export to global scope
    window.TableToolkit = {
        detectValueType: detectValueType,
        smartCompare: smartCompare,
        sortDataset: sortDataset,
        paginateDataset: paginateDataset,
        renderPaginationUI: renderPaginationUI,
        attachSortableHeaders: attachSortableHeaders,
        DataTableController: DataTableController
    };

})(window);
