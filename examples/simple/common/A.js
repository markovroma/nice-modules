Nm.define('common/A', ['common/B'], function(provide, B) {
    var a = {
        b: B
    };
    provide(a);
});