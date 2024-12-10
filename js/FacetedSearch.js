class FacetedSearch {

    constructor(element, options) {
        this.element = element;
        this.modalElement = this.element.find('#detailModal');
        this.modal = this.modalElement.modal({
            backdrop: 'static',
            show: false
        });
        this.options = {
            inscriptions: {},
            stelas: {},
            pitakas: {},
            facets: [],
            perPage: 50,
        };
        this.currentInscriptionPage = 1;
        this.currentStelaPage = 1;
        for (let name in options) {
            if (options.hasOwnProperty(name) && this.options.hasOwnProperty(name)) {
                this.options[name] = options[name];
            }
        }
        this._linkStelaPitaka();
        this._parseDivisions();
        this.filteredInscriptions = this.options.inscriptions;
        this.filteredStelas = this.options.stelas;
    }

    init() {
        let i;
        for (i = 0; i < this.options.facets.length; i++) {
            this.options.facets[i].init();
        }
        this.refreshResults();
    }

    refreshResults() {
        let i;
        this.filteredInscriptions = {};
        this.filteredStelas = {};

        this.element.find('#inscriptionsTabContent').html('<p>Searching results...</p>');
        this.element.find('#stelasTabContent').html('<p>Searching results...</p>');

        // Filter Inscriptions.
        for (let insID in this.options.inscriptions) {
            let insItem = this.options.inscriptions[insID];
            let include = true;
            for (i = 0; i < this.options.facets.length; i++) {
                if (!this.options.facets[i].filter(insItem)) {
                    include = false;
                    break;
                }
            }
            if (include) {
                this.filteredInscriptions[insID] = insItem;
            }
        }
        // Filter Stelas.
        for (let stelaID in this.options.stelas) {
            let stelaItem = this.options.stelas[stelaID];
            let include = true;
            for (i = 0; i < this.options.facets.length; i++) {
                if (!this.options.facets[i].filter(stelaItem)) {
                    include = false;
                    break;
                }
            }
            if (include) {
                this.filteredStelas[stelaID] = stelaItem;
            }
        }
        this.currentInscriptionPage = 1;
        this.currentStelaPage = 1;
        this._createInscriptionList(this.filteredInscriptions);
        this._createStelaList(this.filteredStelas);
    }

    _createInscriptionList(data) {
        let thisObj = this;
        let html = '';
        let paginatedData = this._paginateData(data, this.currentInscriptionPage, this._getTotalPageCount(data));
        if (Object.keys(paginatedData).length > 0) {
            html += '<table class="table table-striped result-table">';
            html += `<thead>`;
            html += `<tr>`;
            html += `<th style="width:20%" scope="col">Catalog</th>`;
            html += `<th style="width:20%" scope="col">Piṭaka</th>`;
            html += `<th style="width:20%" scope="col">Division 1</th>`;
            html += `<th style="width:20%" scope="col">Division 2</th>`;
            html += `<th style="width:20%" scope="col">Division 3</th>`;
            html += `</tr>`;
            html += `</thead>`;
            html += `<tbody>`;
            for (let id in paginatedData) {
                if (paginatedData.hasOwnProperty(id)) {
                    html += this._createInscriptionListItem(paginatedData[id]);
                }
            }
            html += `</tbody>`;
            html += `</table>`;
        } else {
            html += 'No inscription found.';
        }
        html += this._createInscriptionPaginationLinks();
        this.element.find('#inscriptionsTabContent').html(html);
        this.element.find('#inscriptionsTabContent .pagination .page-item .page-link').on('click', function () {
            let element = jQuery(this);
            let page = element.data('page');
            if (page === 'prev') {
                page = thisObj.currentInscriptionPage - 1;
            } else if (page === 'next') {
                page = thisObj.currentInscriptionPage + 1;
            }
            if (page !== thisObj.currentInscriptionPage) {
                thisObj.currentInscriptionPage = page;
                thisObj._createInscriptionList(thisObj.filteredInscriptions);
            }
        });
        this.element.find('#inscriptionsTabContent a.detail-link').on('click', function (e) {
            e.preventDefault();
            let dataID = jQuery(this).data('id');
            thisObj.openInscriptionDetailModal(dataID);
        });
    }

    _createInscriptionListItem(data) {
        let pitaka = '';
        let division1 = '';
        let division2 = '';
        if (data.divisions.length > 0) {
            pitaka = data.divisions[0].name;
        }
        if (data.divisions.length > 1) {
            division1 = data.divisions[1].name;
        }
        if (data.divisions.length > 2) {
            division2 = data.divisions[2].name;
        }
        let html = '<tr>';
        html += `<td>${data.catalog}</td>`;
        html += `<td>${pitaka}</td>`;
        html += `<td>${division1}</td>`;
        html += `<td>${division2}</td>`;
        html += `<td><a class="detail-link" data-id="${data.id}" href="#">${data.title}</a></td>`;
        html += `</tr>`;
        return html;
    }

    _createInscriptionPaginationLinks() {
        let total = this._getTotalPageCount(this.filteredInscriptions);
        return this._createPaginationHTML(total, this.currentInscriptionPage, 'inscriptionsTabContent');
    }

    _createPaginationHTML(numOfPages, currentPage, tabContentID) {
        let i;
        let html = '';
        if (numOfPages > 0) {
            html += `<nav aria-label="Pagination">`;
            html += `<ul class="pagination">`;
            html += `<li class="page-item` + ((currentPage === 1) ? ' disabled' : '') +`"><a data-page="prev" class="page-link" href="#${tabContentID}">Previous</a></li>`;
            for (i = 0; i < numOfPages; i++) {
                html += `<li class="page-item` + ((currentPage === i + 1) ? ' active' : '') + `"><a data-page="${i + 1}" class="page-link" href="#${tabContentID}">${i + 1}</a></li>`;
            }
            html += `<li class="page-item` + ((currentPage === numOfPages) ? ' disabled' : '') +`"><a data-page="next" class="page-link" href="#${tabContentID}">Next</a></li>`;
            html += `</ul>`;
            html += `</nav>`;
        }
        return html;
    }

    _getTotalPageCount(data) {
        return Math.ceil(Object.keys(data).length / this.options.perPage);
    }

    _paginateData(data, currentPage, numOfPages) {
        let pagenatedData = {};
        if (numOfPages > 0) {
            let keys = Object.keys(data);
            let i;
            let end;
            if ((currentPage * this.options.perPage) > keys.length) {
                end = keys.length;
            } else {
                end = currentPage * this.options.perPage;
            }
            for (i = (currentPage - 1) * this.options.perPage; i < end; i++) {
                pagenatedData[keys[i]] = data[keys[i]];
            }
        } else {
            pagenatedData = data;
        }
        return pagenatedData;
    }

    _createStelaList(data) {
        let thisObj = this;
        let html = '';
        let paginatedData = this._paginateData(data, this.currentStelaPage, this._getTotalPageCount(data));
        if (Object.keys(paginatedData).length > 0) {
            html += '<table class="table table-striped result-table">';
            html += `<thead>`;
            html += `<tr>`;
            html += `<th style="width:20%" scope="col">Stela number</th>`;
            html += `<th style="width:60%" scope="col">Heading title</th>`;
            html += `<th style="width:20%" scope="col">Heading number</th>`;
            html += `</tr>`;
            html += `</thead>`;
            html += `<tbody>`;
            for (let id in paginatedData) {
                if (paginatedData.hasOwnProperty(id)) {
                    html += this._createStelaListItem(paginatedData[id]);
                }
            }
            html += `</tbody>`;
            html += `</table>`;
        } else {
            html += 'No stela found.';
        }
        html += this._createStelaPaginationLinks();
        this.element.find('#stelasTabContent').html(html);
        this.element.find('#stelasTabContent .pagination .page-item .page-link').on('click', function () {
            let element = jQuery(this);
            let page = element.data('page');
            if (page === 'prev') {
                page = thisObj.currentStelaPage - 1;
            } else if (page === 'next') {
                page = thisObj.currentStelaPage + 1;
            }
            if (page !== thisObj.currentStelaPage) {
                thisObj.currentStelaPage = page;
                thisObj._createStelaList(thisObj.filteredStelas);
            }
        });
        this.element.find('#stelasTabContent a.detail-link').on('click', function (e) {
            e.preventDefault();
            let dataID = jQuery(this).data('id');
            thisObj.openStelaDetailModal(dataID);
        });
    }

    _createStelaListItem(data) {
        let html = '<tr>';
        html += `<td>${data.stela_number}</td>`;
        html += `<td><a class="detail-link" data-id="${data.id}" href="#">${data.title}</a></td>`;
        html += `<td>${data.heading_number}</td>`;
        html += `</tr>`;
        return html;
    }

    _createStelaPaginationLinks() {
        let total = this._getTotalPageCount(this.filteredStelas);
        return this._createPaginationHTML(total, this.currentStelaPage, 'stelasTabContent');
    }

    _createPitakaDisplayValue(pitakas) {
        let value = '';
        if (typeof pitakas === 'object' && pitakas !== null) {
            for (let id in pitakas) {
                if (pitakas.hasOwnProperty(id)) {
                    if (value !== '') {
                        value += ', ';
                    }
                    value += pitakas[id].name;
                }
            }
        }
        return value;
    }

    openInscriptionDetailModal(insID) {
        this.modalElement.find('.modal-title').html('');
        this.modalElement.find('.modal-body').html('');
        let insData = this.filteredInscriptions[insID];
        this.modalElement.find('.modal-title').html(`${insData.catalog} - ${insData.title}`);
        let imageTabContent = this._createImageGalleryHtml(insData.stela_images);
        let infoTabContent = this._createInscriptionInfoTableHtml(insData);
        this._createDetailModalBody(imageTabContent, infoTabContent);
        this.modal.modal('show');
    }

    openStelaDetailModal(stelaID) {
        this.modalElement.find('.modal-title').html('');
        this.modalElement.find('.modal-body').html('');
        let stelaData = this.filteredStelas[stelaID];
        this.modalElement.find('.modal-title').html(`${stelaData.stela_number} - ${stelaData.title}`);
        let imageTabContent = this._createImageGalleryHtml(stelaData.stela_images);
        let infoTabContent = this._createStelaInfoTableHtml(stelaData);
        this._createDetailModalBody(imageTabContent, infoTabContent);
        this.modal.modal('show');
    }

    _createDetailModalBody(imageTabContent, infoTabContent) {
        let html = ``;
        html += `<ul class="nav nav-tabs page-tabs" id="detailTabs" role="tablist">`;
        html += `<li class="nav-item" role="presentation">`;
        html += `<a class="nav-link active" id="images-tab" data-toggle="tab" href="#images" role="tab" aria-controls="images" aria-selected="true">Images</a>`;
        html += `</li>`;
        html += `<li class="nav-item" role="presentation">`;
        html += `<a class="nav-link" id="info-tab" data-toggle="tab" href="#info" role="tab" aria-controls="info" aria-selected="false">Information</a>`;
        html += `</li>`;
        html += `</ul>`;
        html += `<div class="tab-content" id="detailTabContent">`;
        html += `<div class="tab-pane fade show active" id="images" role="tabpanel" aria-labelledby="images-tab">`;
        html += imageTabContent;
        html += `</div>`;
        html += `<div class="tab-pane fade" id="info" role="tabpanel" aria-labelledby="info-tab">`;
        html += infoTabContent;
        html += `</div>`;
        html += `</div>`;
        html += ``;
        this.modalElement.find('.modal-body').html(html);
        this.modalElement.find('.image-gallery').viewer({
            url: 'data-full',
            loading: true
        });
    }

    _createImageGalleryHtml(images) {
        console.log(images);
        let html = ``;
        if (images && Object.keys(images).length > 0) {
            html += `<ul class="image-gallery">`;
            for (let imgID in images) {
                html += `<li>`;
                html += `<div class="thumbnail-holder">`;
                html += `<img alt="Item Label: ${images[imgID].title}; Stela Side: ${images[imgID].stela_side}; Image Framing: ${images[imgID].image_framing}" data-full="${images[imgID].full_image}" src="${images[imgID].thumbnail}" />`;
                html += `</div>`;
                html += `<div class="thumbnail-info">${images[imgID].title}</div>`;
                html += `</li>`;
            }
            html += `</ul>`;
        } else {
            html += `<p>There is no stela image.</p>`;
        }
        return html;
    }

    _createInscriptionInfoTableHtml(data) {
        let html = ``;
        html += `<table class="table info-table">`;
        html += `<tbody>`;
        html += `<tr><th>Title</th><td>${data.title}</td></tr>`;
        html += `<tr><th>Catalog</th><td>${data.catalog}</td></tr>`;
        html += `<tr><th>Piṭaka</th><td>${this._createPitakaDisplayValue(data.pitaka)}</td></tr>`;
        html += `</tbody>`;
        html += `</table>`;
        return html;
    }

    _createStelaInfoTableHtml(data) {
        let html = ``;
        html += `<table class="table info-table">`;
        html += `<tbody>`;
        html += `<tr><th>Stela number</th><td>${data.stela_number}</td></tr>`;
        html += `<tr><th>Heading title</th><td>${data.title}</td></tr>`;
        html += `<tr><th>Heading number</th><td>${data.heading_number}</td></tr>`;
        html += `<tr><th>General notes</th><td>${data.general_notes}</td></tr>`;
        html += `<tr><th>Burmese date</th><td>${data.burmese_date}</td></tr>`;
        html += `<tr><th>Western date</th><td>${data.western_date}</td></tr>`;
        html += `<tr><th>Notes on dates</th><td>${data.notes_on_dates}</td></tr>`;
        html += `</tbody>`;
        html += `</table>`;
        return html;
    }

    _linkStelaPitaka() {
        let stelaImageIDToPitaka  = {};
        let i;
        let imgID;
        for (let insID in this.options.inscriptions) {
            let insData = this.options.inscriptions[insID];
            if (insData.stela_images && Object.keys(insData.stela_images).length > 0) {
                let pitakas = insData.pitaka;
                for (imgID in insData.stela_images) {
                    if (typeof stelaImageIDToPitaka[imgID] === 'undefined') {
                        stelaImageIDToPitaka[imgID] = pitakas;
                    } else {
                        for (let pitakaID in pitakas) {
                            if (typeof stelaImageIDToPitaka[imgID][pitakaID] === 'undefined') {
                                stelaImageIDToPitaka[imgID][pitakaID] = pitakas[pitakaID];
                            }
                        }
                    }
                }
            }
        }

        for (let stelaID in this.options.stelas) {
            let stelaPitaka = {};
            if (this.options.stelas[stelaID].stela_images && Object.keys(this.options.stelas[stelaID].stela_images).length > 0) {
                for (imgID in this.options.stelas[stelaID].stela_images) {
                    if (typeof stelaImageIDToPitaka[imgID] !== 'undefined') {
                        for (let pitakaID in stelaImageIDToPitaka[imgID]) {
                            if (typeof stelaPitaka[pitakaID] === 'undefined') {
                                stelaPitaka[pitakaID] = stelaImageIDToPitaka[imgID][pitakaID];
                            }
                        }
                    }
                }
            }
            this.options.stelas[stelaID].pitaka = stelaPitaka;
        }
    }

    _parseDivisions() {
        const flatPitakas = this._getFlatPitakaData();
        for (let insID in this.options.inscriptions) {
            if (this.options.inscriptions[insID].pitaka) {
                this.options.inscriptions[insID].divisions = this._getPitakaDivisions(flatPitakas, Object.values(this.options.inscriptions[insID].pitaka)[0].id);
            }
        }
    }

    _getPitakaDivisions(flatPitakas, targetPitakaID) {
        let divisions = [];
        let pitaka = flatPitakas[targetPitakaID];
        while (pitaka.parent_id) {
            divisions.unshift(pitaka);
            pitaka = flatPitakas[pitaka.parent_id];
        }
        divisions.unshift(pitaka);
        return divisions;
    }

    _getFlatPitakaData() {
        const getPitakas = function (pitakas) {
            let results = {};
            for (let pitakaID in pitakas) {
                results[pitakaID] = pitakas[pitakaID];
                if (typeof pitakas[pitakaID].children !== 'undefined') {
                    let childPitakas = getPitakas(pitakas[pitakaID].children);
                    results = {...results, ...childPitakas};
                }
            }
            return results;
        }
        return getPitakas(this.options.pitakas);
    }

}
