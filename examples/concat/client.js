Nm.config.clientBaseDir = '';
Nm.config.vendors = {
    '$': {
        path: 'vendor/jquery.min.js',
        object: '$',
        dependencies: []
    }
};

Nm.require(['common/A', '$'], function(A, $) {
    $('body').append(A.b.title);
});