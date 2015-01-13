Nm.setLazy(true);

Nm.define('common/A', ['common/B'], function(provide, B) {
    var a = {
        b: B
    };
    provide(a);
});
Nm.define('common/B', [], function(provide) {
    var B = {
        'title' : 'module B'
    };
    provide(B);
});

Nm.setLazy(false);