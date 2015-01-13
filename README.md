# Модульная система Nm
## Возможности
+ Изоморфный js, один код работает на клиенте и на nodejs
+ Асинхронный require модулей
+ Асинхронный provide модулей

## Спецификация API
### Объявление модуля
```
  void Nm.define(
    String moduleName,
    [String[] dependencies],
    Function(
        Function([Object objectToProvide], [Error error]) provide,
        [Object resolvedDependency, ...]
    ) declarationFunction
  )
```
### Подключение модуля
```
void modules.require(
    String[] dependencies,
    Function([Object resolvedDependency, ...]) successCallbackFunction
)
```
## Пример
```
  Nm.define(
    'A',
    ['B', 'C'],
    function(provide, b, c) {
        var a = {};
        provide(a);
    }
  );

  Nm.define(
    'B', 
    [],
    function(provide) {
        var b = {};
        provide(b);
    }
  );

  Nm.define(
    'C',
    ['B'],
    function(provide, b) {
        var c = {};
        provide(c);
    }
  );

  Nm.require(
    ['A'],
    function(a) {
      // module 'A' now resolved to a
    }
  );
```
## Пример конфигурации для клиента
```
  // Базовая директории на стороне сервера
  Nm.config.clientBaseDir = '';
  // Вендорные библиотеки
  Nm.config.vendors = {
    '$': {
        path: 'vendor/jquery.min.js',
        object: '$',
        dependencies: []
    }
  };
```

## Пример конфигурации для сервера
```
  Nm = require('./vendor/Nm');
  // Базовая директории на стороне сервера
  Nm.config.serverBaseDir = __dirname + '/';
  Nm.config.vendors = {
    '$': {
        nodeModule: 'jquery',
        path: '',
        object: '$',
        dependencies: []
    }
  };
```


