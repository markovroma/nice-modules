Nm = require('./vendor/Nm');
Nm.config.serverBaseDir = '/home/markov/projects/nice-modules/examples/simple/';
Nm.config.vendors = {
    
};
Nm.require(['common/A'], function(A) {
    console.log(A);
});