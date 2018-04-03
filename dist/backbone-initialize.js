(function() {
  var BackboneInitialize, BackbonePrepare, KEYS, KEY_LENGTH, arrayFromString, backboneInitialize, genId,
    slice = [].slice;

  KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  KEY_LENGTH = KEYS.length;

  this.BackbonePrepare = BackbonePrepare = [];

  this.BackboneLaunchStatus = {
    INIT: 0x0,
    PREPARE: 0x1,
    PREPARE_FAIL: 0x2,
    READY: 0x4
  };

  arrayFromString = function(string) {
    if (Array.isArray(string)) {
      return string;
    }
    return string.split(',').map(function(item) {
      return item.trim();
    });
  };

  genId = function(length, id) {
    if (length == null) {
      length = 16;
    }
    if (id == null) {
      id = '';
    }
    while (length-- > 0) {
      id += KEYS.charAt(Math.floor(Math.random() * KEY_LENGTH));
      if (!(!length || length % 4)) {
        id += '-';
      }
    }
    return id;
  };

  BackboneInitialize = (function() {
    BackboneInitialize.prototype.handlers = null;

    BackboneInitialize.prototype.entity = null;

    BackboneInitialize.prototype.warn = function(message) {
      return console.warn("Backbone-initialize warn: " + message);
    };

    BackboneInitialize.prototype.getChild = function(path, event, parent) {
      var child;
      if (parent == null) {
        parent = this.entity;
      }
      child = path.shift();
      if (parent[child] != null) {
        if (path.length) {
          return this.getChild(path, event, parent[child]);
        } else {
          return parent[child];
        }
      } else {
        this.warn(child + " undefined (this." + event + ")");
        return null;
      }
    };

    BackboneInitialize.prototype.eventHandler = function(handlerKey) {
      var handlers;
      handlers = this.handlers[handlerKey];
      return (function(_this) {
        return function() {
          var params;
          params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.executeChain(handlers, params);
        };
      })(this);
    };

    BackboneInitialize.prototype.executeChain = function(chain, params, context, defer) {
      var deferPromise, promise;
      if (context == null) {
        context = this.entity;
      }
      if (defer == null) {
        defer = $.Deferred();
        chain = chain.slice();
        deferPromise = defer.promise();
        deferPromise.defer = defer;
      }
      promise = chain.shift();
      $.when(promise.apply(context, params)).done((function(_this) {
        return function() {
          if (chain.length) {
            return _this.executeChain(chain, params, context, defer);
          } else {
            return defer.resolve.apply(context, params);
          }
        };
      })(this)).fail(function() {
        console.warn("Deferred chain fail", promise);
        return defer.reject();
      });
      return deferPromise;
    };

    BackboneInitialize.prototype.addListener = function(subject, event, handler, context) {
      var handlerKey;
      if (subject._bbId == null) {
        subject._bbId = genId();
      }
      handlerKey = subject._bbId + "-" + event;
      if (this.handlers[handlerKey] == null) {
        this.handlers[handlerKey] = [];
        this.entity.listenTo(subject, event, this.eventHandler(handlerKey));
      }
      return this.handlers[handlerKey].push(handler.bind(context));
    };

    BackboneInitialize.prototype.addHandler = function(events, handler, parent) {
      var key, results, value;
      if (parent == null) {
        parent = this.entity;
      }
      if (typeof events === 'object') {
        results = [];
        for (key in events) {
          value = events[key];
          results.push(this.addHandler(key, value, parent));
        }
        return results;
      } else {
        if (typeof handler === 'object' && !(Array.isArray(handler))) {
          arrayFromString(events).forEach((function(_this) {
            return function(event) {
              var child, results1, val;
              if ((child = _this.getChild(event.split('.'), event, parent))) {
                results1 = [];
                for (key in handler) {
                  val = handler[key];
                  results1.push(_this.addHandler(key, val, child));
                }
                return results1;
              } else {
                return _this.warn("Can't append handlers to " + event + " cause child not found");
              }
            };
          })(this));
          return;
        }
        if (typeof handler === 'string') {
          handler = arrayFromString(handler);
        }
        if (!Array.isArray(handler)) {
          handler = [handler];
        }
        handler = handler.slice();
        if (events[0] === '_') {
          events = handler.shift();
        }
        return arrayFromString(events).forEach((function(_this) {
          return function(event) {
            var eventParent, parentPath;
            eventParent = parent;
            parentPath = event.split('.');
            event = parentPath.pop();
            if (parentPath.length) {
              if (!(eventParent = _this.getChild(parentPath, parentPath.join('.'), eventParent))) {
                return;
              }
            }
            return handler.forEach(function(handler) {
              var child, handlerName, handlerParent;
              handlerName = false;
              handlerParent = _this.entity;
              if (typeof handler === 'string') {
                handlerName = handler;
                child = handler.split('.');
                handler = child.pop();
                if (!(handlerParent = child.length ? _this.getChild(child, handlerName) : _this.entity)) {
                  return;
                }
                handler = handlerParent[handler];
              }
              if (typeof handler === 'function') {
                return _this.addListener(eventParent, event, handler, handlerParent);
              } else {
                return _this.warn(("Can't find handler for \"" + event + "\"") + (handlerName ? ": \"" + handlerName + "\"" : ''));
              }
            });
          };
        })(this));
      }
    };

    BackboneInitialize.prototype.addHandlers = function() {
      if ((this.entity.handlers != null) && !this.entity.disableHandlers) {
        return this.addHandler(this.entity.handlers);
      }
    };

    BackboneInitialize.prototype.launch = function() {
      var initHandlers, params, ref;
      initHandlers = arguments[0], params = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (initHandlers != null) {
        this.addHandlers();
      }
      this.entity.launchStatus = BackboneLaunchStatus.READY;
      return (ref = this.entity).trigger.apply(ref, ['launch'].concat(slice.call(params)));
    };

    BackboneInitialize.prototype.prepares = null;

    BackboneInitialize.prototype.prepareAndLaunch = function(params) {
      var base;
      this.entity.firstLaunch = this.prepares != null;
      if (BackbonePrepare.length || Array.isArray(this.entity.prepare)) {
        if (this.prepares == null) {
          (base = this.entity).prepare || (base.prepare = []);
          this.entity.prepare = BackbonePrepare.concat(this.entity.prepare);
          this.prepares = this.entity.prepare.map(((function(_this) {
            return function(name) {
              var prepareFunction;
              prepareFunction = typeof name === 'function' ? name : _this.entity[name];
              if (typeof prepareFunction !== 'function') {
                _this.warn("Prepare item " + name + " isn't function");
                prepareFunction = $.noop;
              }
              return prepareFunction;
            };
          })(this)));
        }
        if (this.prepares.length) {
          this.entity.launchStatus = BackboneLaunchStatus.PREPARE;
          this.entity.promise = this.executeChain(this.prepares, params);
          this.entity.promise.done((function(_this) {
            return function() {
              return _this.launch.apply(_this, [_this.entity.firstLaunch].concat(slice.call(params)));
            };
          })(this)).fail((function(_this) {
            return function() {
              var ref;
              console.warn("Backbone initialize prepares fail: ", _this.prepares);
              _this.entity.launchStatus = BackboneLaunchStatus.PREPARE_FAIL;
              if (typeof _this.entity.onLaunchFail === 'function') {
                return (ref = _this.entity).onLaunchFail.apply(ref, params);
              }
            };
          })(this));
          return this.entity.promise;
        }
      }
      return this.launch.apply(this, [this.entity.firstLaunch].concat(slice.call(params)));
    };

    function BackboneInitialize(entity) {
      var method, name, ref;
      this.entity = entity;
      if (this.entity.noBind == null) {
        ref = this.entity;
        for (name in ref) {
          method = ref[name];
          if (typeof method === 'function') {
            this.entity[name] = method.bind(this.entity);
          }
        }
      }
      this.entity.addHandler = this.addHandler.bind(this);
      this.entity.executeChain = this.executeChain.bind(this);
      this.handlers = {};
      this.entity.launchStatus = BackboneLaunchStatus.INIT;
    }

    return BackboneInitialize;

  })();

  backboneInitialize = function() {
    var name, object, options, params, ref;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    options = this.options;
    if (options == null) {
      options = params[1];
    }
    if (typeof this.prepare === 'string') {
      this.prepare = arrayFromString(this.prepare);
    }
    if (!(typeof this.handlers === 'object' || ((options != null ? options.attach : void 0) != null) || typeof this.launch === 'function' || Array.isArray(this.prepare))) {
      return;
    }
    this._bbInitialize = new BackboneInitialize(this);
    if (typeof this.launch === 'function') {
      this.addHandler('launch', this.launch);
    }
    if ((options != null ? options.attach : void 0) != null) {
      ref = options.attach;
      for (name in ref) {
        object = ref[name];
        this[name] = object;
      }
    }
    this.relaunch = (function(_this) {
      return function() {
        return _this._bbInitialize.prepareAndLaunch(params);
      };
    })(this);
    return this.relaunch();
  };

  Backbone.Model.prototype.initialize = backboneInitialize;

  Backbone.Collection.prototype.initialize = backboneInitialize;

  Backbone.View.prototype.initialize = backboneInitialize;

  if (Backbone.NestedModel != null) {
    Backbone.NestedModel.prototype.initialize = backboneInitialize;
  }

  if (Backbone.Layout != null) {
    Backbone.Layout.prototype.initialize = backboneInitialize;
  }

  if (typeof Marionette !== "undefined" && Marionette !== null) {
    Marionette.Object.prototype.initialize = backboneInitialize;
  }

}).call(this);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZXMiOlsiYmFja2JvbmUtaW5pdGlhbGl6ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlHQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUM7O0VBQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLGVBQUEsR0FBa0I7O0VBRXJDLElBQUMsQ0FBQSxvQkFBRCxHQUNJO0lBQUEsSUFBQSxFQUFNLEdBQU47SUFDQSxPQUFBLEVBQVMsR0FEVDtJQUVBLFlBQUEsRUFBYyxHQUZkO0lBR0EsS0FBQSxFQUFPLEdBSFA7OztFQU1KLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFNBQUMsSUFBRDthQUFTLElBQUksQ0FBQyxJQUFMLENBQUE7SUFBVCxDQUF0QjtFQUZjOztFQUlsQixLQUFBLEdBQVEsU0FBQyxNQUFELEVBQWMsRUFBZDs7TUFBQyxTQUFTOzs7TUFBSSxLQUFLOztBQUN2QixXQUFPLE1BQUEsRUFBQSxHQUFXLENBQWxCO01BQ0ksRUFBQSxJQUFNLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsVUFBM0IsQ0FBWjtNQUNOLElBQUEsQ0FBQSxDQUFpQixDQUFDLE1BQUQsSUFBVyxNQUFBLEdBQVMsQ0FBckMsQ0FBQTtRQUFBLEVBQUEsSUFBTSxJQUFOOztJQUZKO1dBR0E7RUFKSTs7RUFNRjtpQ0FDRixRQUFBLEdBQVU7O2lDQUNWLE1BQUEsR0FBUTs7aUNBRVIsSUFBQSxHQUFNLFNBQUMsT0FBRDthQUNGLE9BQU8sQ0FBQyxJQUFSLENBQWEsNEJBQUEsR0FBNkIs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MzQ1Njc4OVwiXG5LRVlfTEVOR1RIID0gS0VZUy5sZW5ndGg7XG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuQEJhY2tib25lTGF1bmNoU3RhdHVzID1cbiAgICBJTklUOiAweDBcbiAgICBQUkVQQVJFOiAweDFcbiAgICBQUkVQQVJFX0ZBSUw6IDB4MlxuICAgIFJFQURZOiAweDRcblxuXG5hcnJheUZyb21TdHJpbmcgPSAoc3RyaW5nKS0+XG4gICAgcmV0dXJuIHN0cmluZyBpZiBBcnJheS5pc0FycmF5IHN0cmluZ1xuICAgIHN0cmluZy5zcGxpdCgnLCcpLm1hcCAoaXRlbSktPiBpdGVtLnRyaW0oKVxuXG5nZW5JZCA9IChsZW5ndGggPSAxNiwgaWQgPSAnJyktPlxuICAgIHdoaWxlIChsZW5ndGgtLSA+IDApXG4gICAgICAgIGlkICs9IEtFWVMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIEtFWV9MRU5HVEgpKVxuICAgICAgICBpZCArPSAnLScgdW5sZXNzICFsZW5ndGggb3IgbGVuZ3RoICUgNFxuICAgIGlkXG5cbmNsYXNzIEJhY2tib25lSW5pdGlhbGl6ZVxuICAgIGhhbmRsZXJzOiBudWxsXG4gICAgZW50aXR5OiBudWxsXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIlxuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgICAgICBpZiBwYXJlbnRbY2hpbGRdP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBhdGgubGVuZ3RoIHRoZW4gQGdldENoaWxkKHBhdGgsIGV2ZW50LCBwYXJlbnRbY2hpbGRdKSBlbHNlIHBhcmVudFtjaGlsZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCIje2NoaWxkfSB1bmRlZmluZWQgKHRoaXMuI3tldmVudH0pXCJcbiAgICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICBldmVudEhhbmRsZXI6IChoYW5kbGVyS2V5KS0+XG4gICAgICAgIGhhbmRsZXJzID0gQGhhbmRsZXJzW2hhbmRsZXJLZXldXG4gICAgICAgIChwYXJhbXMuLi4pPT5cbiAgICAgICAgICAgIEBleGVjdXRlQ2hhaW4gaGFuZGxlcnMsIHBhcmFtc1xuXG4gICAgZXhlY3V0ZUNoYWluOiAoY2hhaW4sIHBhcmFtcywgY29udGV4dCA9IEBlbnRpdHksIGRlZmVyKS0+XG4gICAgICAgIHVubGVzcyBkZWZlcj9cbiAgICAgICAgICAgIGRlZmVyID0gJC5EZWZlcnJlZCgpXG4gICAgICAgICAgICBjaGFpbiA9IGNoYWluLnNsaWNlKClcbiAgICAgICAgICAgIGRlZmVyUHJvbWlzZSA9IGRlZmVyLnByb21pc2UoKVxuICAgICAgICAgICAgZGVmZXJQcm9taXNlLmRlZmVyID0gZGVmZXJcblxuICAgICAgICBwcm9taXNlID0gY2hhaW4uc2hpZnQoKVxuXG4gICAgICAgICQud2hlbihwcm9taXNlLmFwcGx5KGNvbnRleHQsIHBhcmFtcykpXG4gICAgICAgIC5kb25lKD0+XG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGNoYWluLCBwYXJhbXMsIGNvbnRleHQsIGRlZmVyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZS5hcHBseSBjb250ZXh0LCBwYXJhbXNcbiAgICAgICAgKVxuICAgICAgICAuZmFpbCgtPlxuICAgICAgICAgICAgY29uc29sZS53YXJuIFwiRGVmZXJyZWQgY2hhaW4gZmFpbFwiLCBwcm9taXNlXG4gICAgICAgICAgICBkZWZlci5yZWplY3QoKVxuICAgICAgICApXG4gICAgICAgIGRlZmVyUHJvbWlzZVxuXG4gICAgYWRkTGlzdGVuZXI6IChzdWJqZWN0LCBldmVudCwgaGFuZGxlciwgY29udGV4dCktPlxuICAgICAgICBzdWJqZWN0Ll9iYklkID0gZ2VuSWQoKSB1bmxlc3Mgc3ViamVjdC5fYmJJZD9cbiAgICAgICAgaGFuZGxlcktleSA9IFwiI3tzdWJqZWN0Ll9iYklkfS0je2V2ZW50fVwiXG4gICAgICAgIHVubGVzcyBAaGFuZGxlcnNbaGFuZGxlcktleV0/XG4gICAgICAgICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0gPSBbXVxuICAgICAgICAgICAgQGVudGl0eS5saXN0ZW5UbyBzdWJqZWN0LCBldmVudCwgQGV2ZW50SGFuZGxlcihoYW5kbGVyS2V5KVxuICAgICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0ucHVzaCBoYW5kbGVyLmJpbmQoY29udGV4dClcblxuXG4gICAgYWRkSGFuZGxlcjogKGV2ZW50cywgaGFuZGxlciwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBpZiB0eXBlb2YgZXZlbnRzIGlzICdvYmplY3QnXG4gICAgICAgICAgICBAYWRkSGFuZGxlcihrZXksIHZhbHVlLCBwYXJlbnQpIGZvciBrZXksIHZhbHVlIG9mIGV2ZW50c1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnb2JqZWN0JyBhbmQgIShBcnJheS5pc0FycmF5KGhhbmRsZXIpKVxuICAgICAgICAgICAgICAgIGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCA9IEBnZXRDaGlsZCBldmVudC5zcGxpdCgnLicpLCBldmVudCwgcGFyZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGtleSwgdmFsIG9mIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkSGFuZGxlciBrZXksIHZhbCwgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBhcHBlbmQgaGFuZGxlcnMgdG8gI3tldmVudH0gY2F1c2UgY2hpbGQgbm90IGZvdW5kXCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgaGFuZGxlciA9IGFycmF5RnJvbVN0cmluZyBoYW5kbGVyIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICBoYW5kbGVyID0gW2hhbmRsZXJdIHVubGVzcyBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKClcbiAgICAgICAgICAgIGV2ZW50cyA9IGhhbmRsZXIuc2hpZnQoKSBpZiBldmVudHNbMF0gaXMgJ18nXG5cbiAgICAgICAgICAgIGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgZXZlbnRQYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICBwYXJlbnRQYXRoID0gZXZlbnQuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgIGV2ZW50ID0gcGFyZW50UGF0aC5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHBhcmVudFBhdGgubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGV2ZW50UGFyZW50ID0gQGdldENoaWxkKHBhcmVudFBhdGgsIHBhcmVudFBhdGguam9pbignLicpLCBldmVudFBhcmVudCkpXG5cbiAgICAgICAgICAgICAgICBoYW5kbGVyLmZvckVhY2ggKGhhbmRsZXIpPT5cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyUGFyZW50ID0gQGVudGl0eVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGhhbmRsZXIuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGNoaWxkLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChoYW5kbGVyUGFyZW50ID0gaWYgY2hpbGQubGVuZ3RoIHRoZW4gQGdldENoaWxkKGNoaWxkLCBoYW5kbGVyTmFtZSkgZWxzZSBAZW50aXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXJQYXJlbnRbaGFuZGxlcl1cbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGFkZExpc3RlbmVyIGV2ZW50UGFyZW50LCBldmVudCwgaGFuZGxlciwgaGFuZGxlclBhcmVudFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGZpbmQgaGFuZGxlciBmb3IgXFxcIiN7ZXZlbnR9XFxcIlwiICsgKGlmIGhhbmRsZXJOYW1lIHRoZW4gXCI6IFxcXCIje2hhbmRsZXJOYW1lfVxcXCJcIiBlbHNlICcnKVxuXG4gICAgYWRkSGFuZGxlcnM6IC0+XG4gICAgICAgIEBhZGRIYW5kbGVyIEBlbnRpdHkuaGFuZGxlcnMgaWYgQGVudGl0eS5oYW5kbGVycz8gYW5kICFAZW50aXR5LmRpc2FibGVIYW5kbGVyc1xuXG4gICAgbGF1bmNoOiAoaW5pdEhhbmRsZXJzLCBwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKCkgaWYgaW5pdEhhbmRsZXJzP1xuICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlJFQURZXG4gICAgICAgIEBlbnRpdHkudHJpZ2dlciAnbGF1bmNoJywgcGFyYW1zLi4uXG5cbiAgICBwcmVwYXJlczogbnVsbFxuXG4gICAgcHJlcGFyZUFuZExhdW5jaDogKHBhcmFtcyktPlxuICAgICAgICBAZW50aXR5LmZpcnN0TGF1bmNoID0gQHByZXBhcmVzP1xuXG4gICAgICAgIGlmIEJhY2tib25lUHJlcGFyZS5sZW5ndGggb3IgQXJyYXkuaXNBcnJheSBAZW50aXR5LnByZXBhcmVcbiAgICAgICAgICAgIHVubGVzcyBAcHJlcGFyZXM/XG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcmVwYXJlIHx8PSBbXVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZS5jb25jYXQgQGVudGl0eS5wcmVwYXJlXG5cbiAgICAgICAgICAgICAgICBAcHJlcGFyZXMgPSBAZW50aXR5LnByZXBhcmUubWFwICgobmFtZSk9PlxuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSBpZiB0eXBlb2YgbmFtZSBpcyAnZnVuY3Rpb24nIHRoZW4gbmFtZSBlbHNlIEBlbnRpdHlbbmFtZV1cbiAgICAgICAgICAgICAgICAgICAgdW5sZXNzIHR5cGVvZiBwcmVwYXJlRnVuY3Rpb24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJQcmVwYXJlIGl0ZW0gI3tuYW1lfSBpc24ndCBmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvblxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgaWYgQHByZXBhcmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuUFJFUEFSRVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJvbWlzZSA9IEBleGVjdXRlQ2hhaW4oQHByZXBhcmVzLCBwYXJhbXMpXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcm9taXNlXG4gICAgICAgICAgICAgICAgLmRvbmUoPT5cbiAgICAgICAgICAgICAgICAgICAgQGxhdW5jaCBAZW50aXR5LmZpcnN0TGF1bmNoLCBwYXJhbXMuLi5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmZhaWwoPT5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQmFja2JvbmUgaW5pdGlhbGl6ZSBwcmVwYXJlcyBmYWlsOiBcIiwgQHByZXBhcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5QUkVQQVJFX0ZBSUxcbiAgICAgICAgICAgICAgICAgICAgQGVudGl0eS5vbkxhdW5jaEZhaWwgcGFyYW1zLi4uIGlmIHR5cGVvZiBAZW50aXR5Lm9uTGF1bmNoRmFpbCBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHJldHVybiBAZW50aXR5LnByb21pc2VcbiAgICAgICAgQGxhdW5jaCBAZW50aXR5LmZpcnN0TGF1bmNoLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICB1bmxlc3MgQGVudGl0eS5ub0JpbmQ/XG4gICAgICAgICAgICBmb3IgbmFtZSwgbWV0aG9kIG9mIEBlbnRpdHkgd2hlbiB0eXBlb2YgbWV0aG9kIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICBAZW50aXR5W25hbWVdID0gbWV0aG9kLmJpbmQgQGVudGl0eVxuXG4gICAgICAgIEBlbnRpdHkuYWRkSGFuZGxlciA9IEBhZGRIYW5kbGVyLmJpbmQgQFxuICAgICAgICBAZW50aXR5LmV4ZWN1dGVDaGFpbiA9IEBleGVjdXRlQ2hhaW4uYmluZCBAXG4gICAgICAgIEBoYW5kbGVycyA9IHt9XG4gICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuSU5JVFxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSB1bmxlc3Mgb3B0aW9ucz9cbiAgICBAcHJlcGFyZSA9IGFycmF5RnJvbVN0cmluZyhAcHJlcGFyZSkgaWYgdHlwZW9mIEBwcmVwYXJlIGlzICdzdHJpbmcnXG4gICAgcmV0dXJuIHVubGVzcyB0eXBlb2YgQGhhbmRsZXJzIGlzICdvYmplY3QnIG9yIG9wdGlvbnM/LmF0dGFjaD8gb3IgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJyBvciBBcnJheS5pc0FycmF5KEBwcmVwYXJlKVxuICAgIEBfYmJJbml0aWFsaXplID0gbmV3IEJhY2tib25lSW5pdGlhbGl6ZSBAXG4gICAgQGFkZEhhbmRsZXIoJ2xhdW5jaCcsIEBsYXVuY2gpIGlmIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBAcmVsYXVuY2ggPSA9PlxuICAgICAgICBAX2JiSW5pdGlhbGl6ZS5wcmVwYXJlQW5kTGF1bmNoIHBhcmFtc1xuICAgIEByZWxhdW5jaCgpXG5cbkJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLk5lc3RlZE1vZGVsP1xuICAgIEJhY2tib25lLk5lc3RlZE1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgICBCYWNrYm9uZS5MYXlvdXQucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgTWFyaW9uZXR0ZT9cbiAgICBNYXJpb25ldHRlLk9iamVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG4iXX0=
