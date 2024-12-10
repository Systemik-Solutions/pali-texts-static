jQuery(document).ready(function($) {

    const apiEndpoint = 'https://pali-texts-omeka.performx.com.au/api';

    async function getMedia() {
        let response = await axios.get(`${apiEndpoint}/media`);
        const items = response.data;
        const media = {};
        for (const item of items) {
            media[item['@id']] = {
                thumbnail: item['o:thumbnail_urls']['medium'],
                preview_image: item['o:thumbnail_urls']['large'],
                full_image: item['o:original_url'],
            };
        }
        return media;
    }

    async function getStelaImages() {
        const mediaItems = await getMedia();
        let response = await axios.get(`${apiEndpoint}/items?resource_class_label=Stela%20Image&per_page=5000`);
        const items = response.data;
        const stelaImages = {};
        for (const item of items) {
            let image = {
                id: item['@id'],
                title: item['o:title'],
            };
            if (item['pt:stelaSide']) {
                image.stela_side = item['pt:stelaSide'][0]['@value'];
            }
            if (item['pt:imageFraming']) {
                image.image_framing = item['pt:imageFraming'][0]['@value'];
            }
            if (item['pt:imageFraming']) {
                image.image_framing = item['pt:imageFraming'][0]['@value'];
            }
            if (item['foaf:img']) {
                image.full_image = item['foaf:img'][0]['@id'];
            }
            if (item['foaf:thumbnail']) {
                image.thumbnail = item['foaf:thumbnail'][0]['@id'];
            }
            if (item['pt:previewImage']) {
                image.preview_image = item['pt:previewImage'][0]['@id'];
            }

            stelaImages[item['@id']] = image;
        }
        return stelaImages;
    }

    async function getPitakas() {
        let response = await axios.get(`${apiEndpoint}/items?resource_class_label=Piṭaka&per_page=5000`);
        const items = response.data;
        const pitakas = {};
        for (const item of items) {
            const pitaka = {
                id: item['@id'],
                name: item['o:title'],
            };
            if (item['skos:broader']) {
                pitaka.parent_id = item['skos:broader'][0]['@id'];
            }
            pitakas[item['@id']] = pitaka;
        }
        return pitakas;
    }

    async function getPitakaTree(pitakas) {
        let pitakaTree = {};
        for (const pitakaID in pitakas) {
            const pitaka = pitakas[pitakaID];
            if (pitaka.parent_id) {
                const parentPitaka = pitakas[pitaka.parent_id];
                if (parentPitaka.children) {
                    parentPitaka.children[pitakaID] = pitaka;
                } else {
                    parentPitaka.children = {};
                    parentPitaka.children[pitakaID] = pitaka;
                }
            } else {
                pitakaTree[pitakaID] = pitaka;
            }
        }
        return pitakaTree;
    }

    async function getInscriptions(images, pitakas) {
        let response = await axios.get(`${apiEndpoint}/items?resource_class_label=Inscription&per_page=5000`);
        const items = response.data;
        const inscriptions = {};
        for (const item of items) {
            let inscription = {
                id: item['@id'],
                title: item['o:title'],
                catalog: item['pt:catalog'][0]['@value'],
            };
            if (item['pt:pitaka']) {
                const pitakaID = item['pt:pitaka'][0]['@id'];
                if (pitakas[pitakaID]) {
                    inscription.pitaka = {};
                    inscription.pitaka[pitakaID] = pitakas[pitakaID];
                }

            }
            if (item['pt:stelaImage']) {
                inscription.stela_images = {};
                for (const stelaImage of item['pt:stelaImage']) {
                    const stelaImageID = stelaImage['@id'];
                    if (images[stelaImageID]) {
                        inscription.stela_images[stelaImageID] = images[stelaImageID];
                    }
                }
            }
            if (inscription.pitaka) {
                inscriptions[item['@id']] = inscription;
            }
        }
        return inscriptions;
    }

    async function getStelas(images) {
        let response = await axios.get(`${apiEndpoint}/items?resource_class_label=Stela&per_page=5000`);
        const items = response.data;
        const stelas = {};
        for (const item of items) {
            let stela = {
                id: item['@id'],
                title: item['o:title'],
            };
            if (item['bibo:number']) {
                stela.stela_number = item['bibo:number'][0]['@value'];
            }
            if (item['pt:headingNumber']) {
                stela.heading_number = item['pt:headingNumber'][0]['@value'];
            }
            if (item['pt:burmeseDate']) {
                stela.burmese_date = item['pt:burmeseDate'][0]['@value'];
            }
            if (item['dcterms:date']) {
                stela.western_date = item['dcterms:date'][0]['@value'];
            }
            if (item['skos:note']) {
                stela.general_notes = item['skos:note'][0]['@value'];
            }
            if (item['pt:noteOnDates']) {
                stela.notes_on_dates = item['pt:noteOnDates'][0]['@value'];
            }
            if (item['pt:stelaImage']) {
                stela.stela_images = {};
                for (const stelaImage of item['pt:stelaImage']) {
                    const stelaImageID = stelaImage['@id'];
                    if (images[stelaImageID]) {
                        stela.stela_images[stelaImageID] = images[stelaImageID];
                    }
                }
            }
            stelas[item['@id']] = stela;
        }
        return stelas;
    }


    async function init() {
        const stelaImages = await getStelaImages();
        const pitakas = await getPitakas();
        const inscriptions = await getInscriptions(stelaImages, pitakas);
        const stelas = await getStelas(stelaImages);
        const pitakaTree = await getPitakaTree(pitakas);

        let search = null;

        let pitakaFacet = new CheckboxFacet($('#pitakaFacet'), {
            title: 'Piṭaka',
            data: pitakaTree,
            filter: function (item, filterIDs) {
                let include = false;
                if (filterIDs.length > 0) {
                    if (item.pitaka && Object.keys(item.pitaka).length > 0) {
                        for (let pitakaID in item.pitaka) {
                            if (filterIDs.indexOf(pitakaID) >= 0) {
                                include = true;
                                break;
                            }
                        }
                    } else {
                        include = false;
                    }
                } else {
                    include = true;
                }
                return include;
            },
            checkboxOnChange: function (checkboxElement, facet) {
                search.refreshResults();
            }
        });

        search = new FacetedSearch($('#paliFacetedSearch'), {
            inscriptions: inscriptions,
            pitakas: pitakaTree,
            stelas: stelas,
            facets: [pitakaFacet]
        });
        search.init();
    }

    init();

});
