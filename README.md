## atom-blitz-settings

Have you ever renamed your atom package or renamed/moved a package setting? If so
you have likely noticed that atom does not remove those stale values from the `config.cson`
file. This can lead to extra entries within the settings view and bugs within your own code.

This module allows an atom package to resolve these erroneous settings.

Install with
```
npm install --save
```

##### Usage

Within your packages `activate` method, add a call similar to:
```js
import blitz from 'atom-blitz-settings'

activate () {
    blitz('my-package-name', (key, value) => {
        if (key in myOldConfigKeys) {
            atom.config.set('new-config-key', value)
        }
    })
}
```

##### blitz (packageName, handler)
* <b>packageName</b> <i>[String | Array&lt;String>] \(optional\)</i><br>  
If not given, will deduce the name from the call stack adding to your package load time. For
best results always pass your package name. Multiple package names may be given allowing you
to migrate settings from a renamed package into the new config namespace.<br><br>
* <b>handler</b> <i>[Function] \(optional\)</i><br>  
If given, will be called with all erroneous config keys and their values. If not given all keys
will be removed from `config.cson`. Returning a falsy will remove the key, if you wish to leave
the key intact be sure to return `true`.
