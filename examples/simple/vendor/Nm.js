/**
 * @module Nm
 */
var Nm = (/** @lends module:Nm */ function() {    
    /**
     * Менеджер зависимостей
     *  
     * @constructor
     */
    function Nm() {
        this.lazy = false;
        this.tasks = {};
        this.modules = {};
        this.requires = [];
        this.mode = 'client';
        this.loadingScripts = {};
        this.config = {
            vendors: {
            },
            serverBaseDir: '',
            clientBaseDir: '/'
        };
        if (typeof(module) !== "undefined") {
            vow = require('vow');
            this.mode = 'server';
        }
    }
    
    /**
     * Загружает скрипт на сервере
     * @param {type} name
     * @param {function(): ?Object} onLoad выполняется на загрузку скрипта
     */
    Nm.prototype.serverLoadScript = function(name, onLoad) {
        if (this.config.vendors[name] !== undefined) {
            var vendor = this.config.vendors[name];
            var object = require(vendor.nodeModule);
            onLoad(object);
            return;
        }
        require(this.config.serverBaseDir + this.pathByName(name));
        onLoad();
    };
    
    /**
     * @param {string} path путь до файла
     */
    Nm.prototype.startLoadScript = function(path) {
        var self = this;
        this.loadingScripts[path] = {
            listeners: [],
            exec: function() {
                for (var i in this.listeners) {
                    this.listeners[i]();
                };
                self.loadingScripts[path] = undefined;
            }
        };
    };
    
    /**
     * Загружается ли файл
     * @param {string} path путь до файла
     * @returns {boolean}
     */
    Nm.prototype.isLoadingScript = function(path) {
        return typeof(this.loadingScripts[path]) !== 'undefined';
    };
    
    /**
     * Загружает скрипт на клиенте
     * @param {type} name
     * @param {function(): ?Object} onLoad выполняется на загрузку скрипта
     */
    Nm.prototype.clientLoadScript = function(name, onLoad) {
        var self = this;
        var partPath = this.pathByName(name);
        if (typeof(partPath) === 'undefined') {
            onLoad();
            return;
        }
        var path = this.config.clientBaseDir + partPath;
        if (this.isLoadingScript(path)) {
            this.loadingScripts[path].listeners.push(onLoad);
            return;
        }
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = path;
        this.startLoadScript(path);
        script.onload = function() {
            self.loadingScripts[path].exec();
            onLoad();
        };
        var x = document.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(script, x);
    };
    
    /**
     * Возвращает скрипт по имени
     * @param {string} name название модуля
     * @return {string}
     */
    Nm.prototype.pathByName = function(name) {
        var self = this;
        if (this.config.vendors[name] !== undefined) {
            return this.config.vendors[name].path;
        }
        var result = name + '.js';
        return result;
    };

    /**
     * Устанавливает или отключает режим отложенной загрузки
     * @param {boolean} mode устанавливает или отключает режим
     */
    Nm.prototype.setLazy = function(mode) {
        if (!mode) {
            this.lazy = false;
            for (var name in this.modules) {
                if (!this.modules[name].initialized) {
                    this.moduleInit(name);
                }
            }
            this.requiresInit();
            return;
        } 
        this.lazy = true;
    };
    
    /**
     * Выполняет с зависимостями
     * @param {type} names названия модулей
     * @param {function} callback выполняется по окончании загрузки модулей от которых 
     * зависит
     */
    Nm.prototype.require = function(names, callback) {
        var self = this;
        this.requires.push({
            dependencies: names,
            callback: callback,
            initialized: false
        });
        if (self.lazy === false) {
            this.requiresInit();
        }
    };

    /**
     * Инициализирует все require
     */
    Nm.prototype.requiresInit = function() {
        var self = this;
        for (var i in this.requires) {
            var item = this.requires[i];
            if (item.initialized) {
                continue;
            }
            item.initialized = true;
            this.loadsWithDependecies(item.dependencies).then(function() {
                var args = self.getObjects(item.dependencies);
                item.callback.apply(self, args);
            });
        }
    };
    
    /**
     * Получает объекты модулей
     * @param {Array.<string>} names названия
     * @return {Array.<string>}
     */
    Nm.prototype.getObjects = function(names) {
        var args = [];
        for (var i in names) {
            var name = names[i];
            args.push(this.modules[name].object);
        }
        return args;
    };
    
    /**
     * Вспомогательная функция для замыкания функции provide в модуле 
     * @param {string} name название модуля
     * @param {function} resolve подтверждает выполнение модуля
     * @return {function(obj:Object)}
     */
    Nm.prototype._provide = function(name, resolve) {
        var self = this;
        return function(obj) {
            self.modules[name].object = obj;
            resolve();
        };
    };

    /**
     * Обозначает модуль
     * @param {string} name название модуля
     * @param {Array.<string>} dependencies названия зависимостей
     * @param {function} callback 
     */
    Nm.prototype.define = function(name, dependencies, callback) {
        var self = this;
        self.modules[name] = {
            name: name,
            dependencies: dependencies,
            callback: callback,
            initialized: false
        };
        if (self.lazy === false) {
            this.moduleInit(name);
        }
    };

    /**
     * Инициализирует модуль
     * @param {string} name название модуля
     */
    Nm.prototype.moduleInit = function(name) {
        var self = this;
        var module = self.modules[name];
        module.initialized = true;
        var task = new vow.Promise(function(resolve, reject, notify) {
            self.loadsWithDependecies(module.dependencies).then(function() {
                var params = [];
                params.push(self._provide(name, resolve));
                var args = self.getObjects(module.dependencies);
                params = params.concat(args);    
                module.callback.apply(self, params);
            });
        });
        this.tasks[name] = task;
    };

    /**
     * Загружает модуль с зависимостями 
     * @param {Array.<string>} names названия модулей
     * @return {vow.Promise}
     */
    Nm.prototype.loadsWithDependecies = function(names) {
        var self = this;
        return new vow.Promise(function(resolve, reject, notify) {
            self.loads(names).then(function() {
                var promises = [];
                for (var i in names) {
                    var name = names[i];
                    if (self.tasks[name]) {
                        promises.push(self.tasks[name]);
                    }
                }
                if (promises.length === 0) {
                    resolve();
                    return;
                }
                vow.all(promises).then(function() {
                    resolve();
                });
            });
        });
    };

    /**
     * Загружает скрипты модулей
     * @param {Array.<string>} names названия
     * @returns {vow.Promise}
     */
    Nm.prototype.loads = function(names) {
        var self = this;
        return new vow.Promise(function(resolve, reject, notify) {
            var promises = [];
            for (var i in names) {
                var name = names[i];
                promises.push(self.load(name));
            }
            vow.all(promises).then(function(result) {
                resolve();
            });
        });
    };
    
    /**
     * Возвращает promise на загрузку скрипта
     * @param {string} name название модуля
     * @returns {vow.Promise}
     */
    Nm.prototype.load = function(name) {
        var self = this;
        return new vow.Promise(function(resolve, reject, notify) {
            if (self.modules[name]) {
                resolve();
                return;
            }
            if (self.config.vendors[name] !== undefined) {
                var vendor = self.config.vendors[name];
                self.define(name, vendor.dependencies, function(provide) {
                    self.loadScript(name, function(object) {
                        if (self.mode === 'server') {
                            provide(object);
                        } else {
                            provide(window[vendor.object]);
                        }
                        resolve();
                    });
                });
                return;
            };
            self.loadScript(name, function() {
                resolve();
            });
        });
    };

    /**
     * Загружает скрипт
     * @param {string} name название модуля
     * @param {function(): ?Object} onLoad выполняется на загрузку скрипта
     * @returns {vow.Promise}
     */
    Nm.prototype.loadScript = function(name, onLoad) {
        if (this.mode === 'server') {
            this.serverLoadScript(name, onLoad);
        };
        if (this.mode === 'client') {
            this.clientLoadScript(name, onLoad);
        };
    };
    
    /**
     * Возвращает единичный экземпляр класса
     * @return {Nm}
     */
    var Singleton = (function() {  
        var instance;
        return {
            getInstance: function() {
                if (!instance) {
                    instance = new Nm();
                    if (instance.mode === 'server') {
                        module.exports = instance;
                    }
                }
                return instance;
            }
        };
    })();

    return Singleton.getInstance();
    
})();