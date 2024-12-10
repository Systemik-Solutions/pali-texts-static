jQuery(document).ready(function($) {

    $('.page-tabs a').on('click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        $(this).tab('show');
    });

    $('.image-gallery').viewer({
        url: 'data-full',
        loading: true
    });

    $('.preview-image-holder').viewer({
        url: 'data-full',
        loading: true
    });
});
