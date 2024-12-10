class CheckboxFacet extends Facet {

    constructor(element, options) {
        super(element, 'checkbox');
        this.options = {
            title: 'Facet title',
            data: {},
            filter: function (item, filterIDs) {
                return true;
            },
            checkboxOnChange: function (checkboxElement, facet) {

            }
        };
        for (let name in options) {
            if (options.hasOwnProperty(name) && this.options.hasOwnProperty(name)) {
                this.options[name] = options[name];
            }
        }
    }

    init() {
        let thisObj = this;
        let html = `<div class="facet-title">${this.options.title}</div>`;
        html += `<div class="facet-content">`;
        html += `<div class="checkbox-facet">`;
        html += this._createFacetList();
        html += `</div>`;
        html += `</div>`;
        this.element.html(html);
        this.element.find('li ul').hide();
        this.element.find('.facet-expand').on('click', function () {
            if (jQuery(this).data('expanded') === 0) {
                jQuery(this).html('<strong>-</strong>');
                jQuery(this).data('expanded', 1);
                jQuery(this).closest('li').children('ul').show();
            } else {
                jQuery(this).html('<strong>+</strong>');
                jQuery(this).data('expanded', 0);
                jQuery(this).closest('li').children('ul').hide();
            }
        });
        this.element.find('.facet-checkbox > input').on('change', function () {
            let checked = jQuery(this).prop('checked');
            jQuery(this).closest('li').find('ul .facet-checkbox input').prop('checked', checked);
            thisObj.options.checkboxOnChange(jQuery(this), thisObj);
        });
    }

    filter(item) {
        return this.options.filter(item, this.getFilterIDs());
    }

    getFilterIDs() {
        let filterIDs = [];
        this.element.find('.facet-checkbox > input').each(function () {
            if (jQuery(this).prop('checked')) {
                filterIDs.push(jQuery(this).closest('li').children('.facet-item').data('item-id'));
            }
        });
        return filterIDs;
    }

    _createFacetList() {
        let html = `<ul>`;
        for (let id in this.options.data) {
            html += this._createFacetListItem(this.options.data[id]);
        }
        html += `</ul>`;
        return html;
    }

    _createFacetListItem(item) {
        let hasChildren = false;
        if (item.children && Object.keys(item.children).length > 0) {
            hasChildren = true;
        }
        let html = `<li>`;
        html += `<div class="facet-item" data-item-id="${item.id}">`;
        if (hasChildren) {
            html += `<span class="facet-expand" data-expanded="0"><strong>+</strong></span>`;
        }
        html += `<div class="custom-control custom-checkbox facet-checkbox">`;
        html += `<input type="checkbox" class="custom-control-input" id="facetCkb${item.id}">`;
        html += `<label class="custom-control-label"  for="facetCkb${item.id}">${item.name}</label>`;
        html += `</div>`;
        html += `</div>`;
        if (hasChildren) {
            html += `<ul>`;
            for (let childID in item.children) {
                html += this._createFacetListItem(item.children[childID]);
            }
            html += `</ul>`
        }
        html += `</li>`;
        return html;
    }
}
