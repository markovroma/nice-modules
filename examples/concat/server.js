Nm = require('./vendor/Nm');
Nm.config.serverBaseDir = __dirname + '/';
Nm.config.vendors = {
    
};
Nm.require(['common/A'], function(A) {
    console.log(A);
});