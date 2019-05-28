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

  Backbone.BackboneInitializeNoWarnings = false;

  BackboneInitialize = (function() {
    BackboneInitialize.prototype.handlers = null;

    BackboneInitialize.prototype.entity = null;

    BackboneInitialize.prototype.warn = function(message) {
      if (!Backbone.BackboneInitializeNoWarnings) {
        return console.warn("Backbone-initialize warn: " + message);
      }
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

    BackboneInitialize.prototype.executeChain = function(chain, params, context, defer, result) {
      var deferPromise, promise;
      if (context == null) {
        context = this.entity;
      }
      params = params || [];
      if (defer == null) {
        defer = $.Deferred();
        chain = chain.slice();
        deferPromise = defer.promise();
        deferPromise.defer = defer;
      }
      promise = chain.shift();
      $.when(promise.apply(context, params.concat(result || []))).done((function(_this) {
        return function() {
          var result;
          result = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          if (chain.length) {
            return _this.executeChain(chain, params, context, defer, result);
          } else {
            return defer.resolve.apply(context, params.concat(result || []));
          }
        };
      })(this)).fail(function() {
        var result;
        result = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (!Backbone.BackboneInitializeNoWarnings) {
          console.warn("Deferred chain fail", promise);
        }
        return defer.reject.apply(context, params.concat(result || []));
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
              if (!Backbone.BackboneInitializeNoWarnings) {
                console.warn("Backbone initialize prepares fail: ", _this.prepares);
              }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZXMiOlsiYmFja2JvbmUtaW5pdGlhbGl6ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlHQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUM7O0VBQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLGVBQUEsR0FBa0I7O0VBRXJDLElBQUMsQ0FBQSxvQkFBRCxHQUNJO0lBQUEsSUFBQSxFQUFNLEdBQU47SUFDQSxPQUFBLEVBQVMsR0FEVDtJQUVBLFlBQUEsRUFBYyxHQUZkO0lBR0EsS0FBQSxFQUFPLEdBSFA7OztFQU1KLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFNBQUMsSUFBRDthQUFTLElBQUksQ0FBQyxJQUFMLENBQUE7SUFBVCxDQUF0QjtFQUZjOztFQUlsQixLQUFBLEdBQVEsU0FBQyxNQUFELEVBQWMsRUFBZDs7TUFBQyxTQUFTOzs7TUFBSSxLQUFLOztBQUN2QixXQUFPLE1BQUEsRUFBQSxHQUFXLENBQWxCO01BQ0ksRUFBQSxJQUFNLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsVUFBM0IsQ0FBWjtNQUNOLElBQUEsQ0FBQSxDQUFpQixDQUFDLE1BQUQsSUFBVyxNQUFBLEdBQVMsQ0FBckMsQ0FBQTtRQUFBLEVBQUEsSUFBTSxJQUFOOztJQUZKO1dBR0E7RUFKSTs7RUFNUixRQUFRLENBQUMsNEJBQVQsR0FBd0M7O0VBRWxDO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixJQUFBLEdBQU0sU0FBQyxPQUFEO01BQ0YsSUFB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QyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQTlCLEdBQTJDOztFQUMzQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUF4QixHQUFxQzs7RUFFckMsSUFBRyw0QkFBSDtJQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQS9CLEdBQTRDLG1CQURoRDs7O0VBR0EsSUFBRyx1QkFBSDtJQUNJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUQzQzs7O0VBR0EsSUFBRyx3REFBSDtJQUNJLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQ3Qzs7QUE5TEEiLCJzb3VyY2VzQ29udGVudCI6WyJLRVlTID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODlcIlxuS0VZX0xFTkdUSCA9IEtFWVMubGVuZ3RoO1xuQEJhY2tib25lUHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZSA9IFtdXG5cbkBCYWNrYm9uZUxhdW5jaFN0YXR1cyA9XG4gICAgSU5JVDogMHgwXG4gICAgUFJFUEFSRTogMHgxXG4gICAgUFJFUEFSRV9GQUlMOiAweDJcbiAgICBSRUFEWTogMHg0XG5cblxuYXJyYXlGcm9tU3RyaW5nID0gKHN0cmluZyktPlxuICAgIHJldHVybiBzdHJpbmcgaWYgQXJyYXkuaXNBcnJheSBzdHJpbmdcbiAgICBzdHJpbmcuc3BsaXQoJywnKS5tYXAgKGl0ZW0pLT4gaXRlbS50cmltKClcblxuZ2VuSWQgPSAobGVuZ3RoID0gMTYsIGlkID0gJycpLT5cbiAgICB3aGlsZSAobGVuZ3RoLS0gPiAwKVxuICAgICAgICBpZCArPSBLRVlTLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBLRVlfTEVOR1RIKSlcbiAgICAgICAgaWQgKz0gJy0nIHVubGVzcyAhbGVuZ3RoIG9yIGxlbmd0aCAlIDRcbiAgICBpZFxuXG5CYWNrYm9uZS5CYWNrYm9uZUluaXRpYWxpemVOb1dhcm5pbmdzID0gZmFsc2VcblxuY2xhc3MgQmFja2JvbmVJbml0aWFsaXplXG4gICAgaGFuZGxlcnM6IG51bGxcbiAgICBlbnRpdHk6IG51bGxcblxuICAgIHdhcm46IChtZXNzYWdlKS0+XG4gICAgICAgIGNvbnNvbGUud2FybiggXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIikgdW5sZXNzIEJhY2tib25lLkJhY2tib25lSW5pdGlhbGl6ZU5vV2FybmluZ3NcblxuICAgIGdldENoaWxkOiAocGF0aCwgZXZlbnQsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgY2hpbGQgPSBwYXRoLnNoaWZ0KClcbiAgICAgICAgaWYgcGFyZW50W2NoaWxkXT9cbiAgICAgICAgICAgIHJldHVybiBpZiBwYXRoLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChwYXRoLCBldmVudCwgcGFyZW50W2NoaWxkXSkgZWxzZSBwYXJlbnRbY2hpbGRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgZXZlbnRIYW5kbGVyOiAoaGFuZGxlcktleSktPlxuICAgICAgICBoYW5kbGVycyA9IEBoYW5kbGVyc1toYW5kbGVyS2V5XVxuICAgICAgICAocGFyYW1zLi4uKT0+XG4gICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGhhbmRsZXJzLCBwYXJhbXNcblxuICAgIGV4ZWN1dGVDaGFpbjogKGNoYWluLCBwYXJhbXMsIGNvbnRleHQgPSBAZW50aXR5LCBkZWZlciwgcmVzdWx0KS0+XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyBvciBbXVxuICAgICAgICB1bmxlc3MgZGVmZXI/XG4gICAgICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKVxuICAgICAgICAgICAgY2hhaW4gPSBjaGFpbi5zbGljZSgpXG4gICAgICAgICAgICBkZWZlclByb21pc2UgPSBkZWZlci5wcm9taXNlKClcbiAgICAgICAgICAgIGRlZmVyUHJvbWlzZS5kZWZlciA9IGRlZmVyXG5cbiAgICAgICAgcHJvbWlzZSA9IGNoYWluLnNoaWZ0KClcblxuICAgICAgICAkLndoZW4ocHJvbWlzZS5hcHBseShjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSkpKVxuICAgICAgICAuZG9uZSgocmVzdWx0Li4uKT0+XG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGNoYWluLCBwYXJhbXMsIGNvbnRleHQsIGRlZmVyLCByZXN1bHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlLmFwcGx5IGNvbnRleHQsIHBhcmFtcy5jb25jYXQocmVzdWx0IG9yIFtdKVxuICAgICAgICApXG4gICAgICAgIC5mYWlsKChyZXN1bHQuLi4pLT5cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkRlZmVycmVkIGNoYWluIGZhaWxcIiwgcHJvbWlzZSkgIHVubGVzcyBCYWNrYm9uZS5CYWNrYm9uZUluaXRpYWxpemVOb1dhcm5pbmdzXG4gICAgICAgICAgICBkZWZlci5yZWplY3QuYXBwbHkgY29udGV4dCwgcGFyYW1zLmNvbmNhdChyZXN1bHQgb3IgW10pXG4gICAgICAgIClcbiAgICAgICAgZGVmZXJQcm9taXNlXG5cbiAgICBhZGRMaXN0ZW5lcjogKHN1YmplY3QsIGV2ZW50LCBoYW5kbGVyLCBjb250ZXh0KS0+XG4gICAgICAgIHN1YmplY3QuX2JiSWQgPSBnZW5JZCgpIHVubGVzcyBzdWJqZWN0Ll9iYklkP1xuICAgICAgICBoYW5kbGVyS2V5ID0gXCIje3N1YmplY3QuX2JiSWR9LSN7ZXZlbnR9XCJcbiAgICAgICAgdW5sZXNzIEBoYW5kbGVyc1toYW5kbGVyS2V5XT9cbiAgICAgICAgICAgIEBoYW5kbGVyc1toYW5kbGVyS2V5XSA9IFtdXG4gICAgICAgICAgICBAZW50aXR5Lmxpc3RlblRvIHN1YmplY3QsIGV2ZW50LCBAZXZlbnRIYW5kbGVyKGhhbmRsZXJLZXkpXG4gICAgICAgIEBoYW5kbGVyc1toYW5kbGVyS2V5XS5wdXNoIGhhbmRsZXIuYmluZChjb250ZXh0KVxuXG5cbiAgICBhZGRIYW5kbGVyOiAoZXZlbnRzLCBoYW5kbGVyLCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGlmIHR5cGVvZiBldmVudHMgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdvYmplY3QnIGFuZCAhKEFycmF5LmlzQXJyYXkoaGFuZGxlcikpXG4gICAgICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkID0gQGdldENoaWxkIGV2ZW50LnNwbGl0KCcuJyksIGV2ZW50LCBwYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3Iga2V5LCB2YWwgb2YgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRIYW5kbGVyIGtleSwgdmFsLCBjaGlsZFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGFwcGVuZCBoYW5kbGVycyB0byAje2V2ZW50fSBjYXVzZSBjaGlsZCBub3QgZm91bmRcIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBoYW5kbGVyID0gYXJyYXlGcm9tU3RyaW5nIGhhbmRsZXIgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl0gdW5sZXNzIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKVxuICAgICAgICAgICAgZXZlbnRzID0gaGFuZGxlci5zaGlmdCgpIGlmIGV2ZW50c1swXSBpcyAnXydcblxuICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICBldmVudFBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGggPSBldmVudC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcGFyZW50UGF0aC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoZXZlbnRQYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIGV2ZW50UGFyZW50KSlcblxuICAgICAgICAgICAgICAgIGhhbmRsZXIuZm9yRWFjaCAoaGFuZGxlcik9PlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJQYXJlbnQgPSBAZW50aXR5XG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gaGFuZGxlci5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gY2hpbGQucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGhhbmRsZXJQYXJlbnQgPSBpZiBjaGlsZC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQoY2hpbGQsIGhhbmRsZXJOYW1lKSBlbHNlIEBlbnRpdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlclBhcmVudFtoYW5kbGVyXVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAYWRkTGlzdGVuZXIgZXZlbnRQYXJlbnQsIGV2ZW50LCBoYW5kbGVyLCBoYW5kbGVyUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgZmluZCBoYW5kbGVyIGZvciBcXFwiI3tldmVudH1cXFwiXCIgKyAoaWYgaGFuZGxlck5hbWUgdGhlbiBcIjogXFxcIiN7aGFuZGxlck5hbWV9XFxcIlwiIGVsc2UgJycpXG5cbiAgICBhZGRIYW5kbGVyczogLT5cbiAgICAgICAgQGFkZEhhbmRsZXIgQGVudGl0eS5oYW5kbGVycyBpZiBAZW50aXR5LmhhbmRsZXJzPyBhbmQgIUBlbnRpdHkuZGlzYWJsZUhhbmRsZXJzXG5cbiAgICBsYXVuY2g6IChpbml0SGFuZGxlcnMsIHBhcmFtcy4uLiktPlxuICAgICAgICBAYWRkSGFuZGxlcnMoKSBpZiBpbml0SGFuZGxlcnM/XG4gICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuUkVBRFlcbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICAgIHByZXBhcmVzOiBudWxsXG5cbiAgICBwcmVwYXJlQW5kTGF1bmNoOiAocGFyYW1zKS0+XG4gICAgICAgIEBlbnRpdHkuZmlyc3RMYXVuY2ggPSBAcHJlcGFyZXM/XG5cbiAgICAgICAgaWYgQmFja2JvbmVQcmVwYXJlLmxlbmd0aCBvciBBcnJheS5pc0FycmF5IEBlbnRpdHkucHJlcGFyZVxuICAgICAgICAgICAgdW5sZXNzIEBwcmVwYXJlcz9cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgfHw9IFtdXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlLmNvbmNhdCBAZW50aXR5LnByZXBhcmVcblxuICAgICAgICAgICAgICAgIEBwcmVwYXJlcyA9IEBlbnRpdHkucHJlcGFyZS5tYXAgKChuYW1lKT0+XG4gICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9IGlmIHR5cGVvZiBuYW1lIGlzICdmdW5jdGlvbicgdGhlbiBuYW1lIGVsc2UgQGVudGl0eVtuYW1lXVxuICAgICAgICAgICAgICAgICAgICB1bmxlc3MgdHlwZW9mIHByZXBhcmVGdW5jdGlvbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIlByZXBhcmUgaXRlbSAje25hbWV9IGlzbid0IGZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICBpZiBAcHJlcGFyZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5QUkVQQVJFXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcm9taXNlID0gQGV4ZWN1dGVDaGFpbihAcHJlcGFyZXMsIHBhcmFtcylcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2VcbiAgICAgICAgICAgICAgICAuZG9uZSg9PlxuICAgICAgICAgICAgICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuZmFpbCg9PlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJCYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmVzIGZhaWw6IFwiLCBAcHJlcGFyZXMpICB1bmxlc3MgQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5nc1xuICAgICAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVfRkFJTFxuICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lm9uTGF1bmNoRmFpbCBwYXJhbXMuLi4gaWYgdHlwZW9mIEBlbnRpdHkub25MYXVuY2hGYWlsIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIHVubGVzcyBAZW50aXR5Lm5vQmluZD9cbiAgICAgICAgICAgIGZvciBuYW1lLCBtZXRob2Qgb2YgQGVudGl0eSB3aGVuIHR5cGVvZiBtZXRob2QgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBlbnRpdHlbbmFtZV0gPSBtZXRob2QuYmluZCBAZW50aXR5XG5cbiAgICAgICAgQGVudGl0eS5hZGRIYW5kbGVyID0gQGFkZEhhbmRsZXIuYmluZCBAXG4gICAgICAgIEBlbnRpdHkuZXhlY3V0ZUNoYWluID0gQGV4ZWN1dGVDaGFpbi5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5JTklUXG5cbmJhY2tib25lSW5pdGlhbGl6ZSA9IChwYXJhbXMuLi4pLT5cbiAgICBvcHRpb25zID0gQG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFyYW1zWzFdIHVubGVzcyBvcHRpb25zP1xuICAgIEBwcmVwYXJlID0gYXJyYXlGcm9tU3RyaW5nKEBwcmVwYXJlKSBpZiB0eXBlb2YgQHByZXBhcmUgaXMgJ3N0cmluZydcbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcbiAgICBAYWRkSGFuZGxlcignbGF1bmNoJywgQGxhdW5jaCkgaWYgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJ1xuXG4gICAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgICAgICBAW25hbWVdID0gb2JqZWN0IGZvciBuYW1lLCBvYmplY3Qgb2Ygb3B0aW9ucy5hdHRhY2hcblxuICAgIEByZWxhdW5jaCA9ID0+XG4gICAgICAgIEBfYmJJbml0aWFsaXplLnByZXBhcmVBbmRMYXVuY2ggcGFyYW1zXG4gICAgQHJlbGF1bmNoKClcblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gICAgQmFja2JvbmUuTmVzdGVkTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
