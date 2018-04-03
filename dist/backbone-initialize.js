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
        console.warn("Deferred chain fail", promise);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZXMiOlsiYmFja2JvbmUtaW5pdGlhbGl6ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlHQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUM7O0VBQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLGVBQUEsR0FBa0I7O0VBRXJDLElBQUMsQ0FBQSxvQkFBRCxHQUNJO0lBQUEsSUFBQSxFQUFNLEdBQU47SUFDQSxPQUFBLEVBQVMsR0FEVDtJQUVBLFlBQUEsRUFBYyxHQUZkO0lBR0EsS0FBQSxFQUFPLEdBSFA7OztFQU1KLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFNBQUMsSUFBRDthQUFTLElBQUksQ0FBQyxJQUFMLENBQUE7SUFBVCxDQUF0QjtFQUZjOztFQUlsQixLQUFBLEdBQVEsU0FBQyxNQUFELEVBQWMsRUFBZDs7TUFBQyxTQUFTOzs7TUFBSSxLQUFLOztBQUN2QixXQUFPLE1BQUEsRUFBQSxHQUFXLENBQWxCO01BQ0ksRUFBQSxJQUFNLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsVUFBM0IsQ0FBWjtNQUNOLElBQUEsQ0FBQSxDQUFpQixDQUFDLE1BQUQsSUFBVyxNQUFBLEdBQVMsQ0FBckMsQ0FBQTtRQUFBLEVBQUEsSUFBTSxJQUFOOztJQUZKO1dBR0E7RUFKSTs7RUFNRjtpQ0FDRixRQUFBLEdBQVU7O2lDQUNWLE1BQUEsR0FBUTs7aUNBRVIsSUFBQSxHQUFNLFNBQUMsT0FBRDthQUNGLE9BQU8sQ0FBQyxJQUFSLENBQWEsNEJBQUEsR0FBNkIs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LG1CQURoRDs7O0VBR0EsSUFBRyx1QkFBSDtJQUNJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUQzQzs7O0VBR0EsSUFBRyx3REFBSDtJQUNJLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQ3Qzs7QUE1TEEiLCJzb3VyY2VzQ29udGVudCI6WyJLRVlTID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODlcIlxuS0VZX0xFTkdUSCA9IEtFWVMubGVuZ3RoO1xuQEJhY2tib25lUHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZSA9IFtdXG5cbkBCYWNrYm9uZUxhdW5jaFN0YXR1cyA9XG4gICAgSU5JVDogMHgwXG4gICAgUFJFUEFSRTogMHgxXG4gICAgUFJFUEFSRV9GQUlMOiAweDJcbiAgICBSRUFEWTogMHg0XG5cblxuYXJyYXlGcm9tU3RyaW5nID0gKHN0cmluZyktPlxuICAgIHJldHVybiBzdHJpbmcgaWYgQXJyYXkuaXNBcnJheSBzdHJpbmdcbiAgICBzdHJpbmcuc3BsaXQoJywnKS5tYXAgKGl0ZW0pLT4gaXRlbS50cmltKClcblxuZ2VuSWQgPSAobGVuZ3RoID0gMTYsIGlkID0gJycpLT5cbiAgICB3aGlsZSAobGVuZ3RoLS0gPiAwKVxuICAgICAgICBpZCArPSBLRVlTLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBLRVlfTEVOR1RIKSlcbiAgICAgICAgaWQgKz0gJy0nIHVubGVzcyAhbGVuZ3RoIG9yIGxlbmd0aCAlIDRcbiAgICBpZFxuXG5jbGFzcyBCYWNrYm9uZUluaXRpYWxpemVcbiAgICBoYW5kbGVyczogbnVsbFxuICAgIGVudGl0eTogbnVsbFxuXG4gICAgd2FybjogKG1lc3NhZ2UpLT5cbiAgICAgICAgY29uc29sZS53YXJuIFwiQmFja2JvbmUtaW5pdGlhbGl6ZSB3YXJuOiAje21lc3NhZ2V9XCJcblxuICAgIGdldENoaWxkOiAocGF0aCwgZXZlbnQsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgY2hpbGQgPSBwYXRoLnNoaWZ0KClcbiAgICAgICAgaWYgcGFyZW50W2NoaWxkXT9cbiAgICAgICAgICAgIHJldHVybiBpZiBwYXRoLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChwYXRoLCBldmVudCwgcGFyZW50W2NoaWxkXSkgZWxzZSBwYXJlbnRbY2hpbGRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgZXZlbnRIYW5kbGVyOiAoaGFuZGxlcktleSktPlxuICAgICAgICBoYW5kbGVycyA9IEBoYW5kbGVyc1toYW5kbGVyS2V5XVxuICAgICAgICAocGFyYW1zLi4uKT0+XG4gICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGhhbmRsZXJzLCBwYXJhbXNcblxuICAgIGV4ZWN1dGVDaGFpbjogKGNoYWluLCBwYXJhbXMsIGNvbnRleHQgPSBAZW50aXR5LCBkZWZlciwgcmVzdWx0KS0+XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyBvciBbXVxuICAgICAgICB1bmxlc3MgZGVmZXI/XG4gICAgICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKVxuICAgICAgICAgICAgY2hhaW4gPSBjaGFpbi5zbGljZSgpXG4gICAgICAgICAgICBkZWZlclByb21pc2UgPSBkZWZlci5wcm9taXNlKClcbiAgICAgICAgICAgIGRlZmVyUHJvbWlzZS5kZWZlciA9IGRlZmVyXG5cbiAgICAgICAgcHJvbWlzZSA9IGNoYWluLnNoaWZ0KClcblxuICAgICAgICAkLndoZW4ocHJvbWlzZS5hcHBseShjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSkpKVxuICAgICAgICAuZG9uZSgocmVzdWx0Li4uKT0+XG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGNoYWluLCBwYXJhbXMsIGNvbnRleHQsIGRlZmVyLCByZXN1bHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlLmFwcGx5IGNvbnRleHQsIHBhcmFtcy5jb25jYXQocmVzdWx0IG9yIFtdKVxuICAgICAgICApXG4gICAgICAgIC5mYWlsKChyZXN1bHQuLi4pLT5cbiAgICAgICAgICAgIGNvbnNvbGUud2FybiBcIkRlZmVycmVkIGNoYWluIGZhaWxcIiwgcHJvbWlzZVxuICAgICAgICAgICAgZGVmZXIucmVqZWN0LmFwcGx5IGNvbnRleHQsIHBhcmFtcy5jb25jYXQocmVzdWx0IG9yIFtdKVxuICAgICAgICApXG4gICAgICAgIGRlZmVyUHJvbWlzZVxuXG4gICAgYWRkTGlzdGVuZXI6IChzdWJqZWN0LCBldmVudCwgaGFuZGxlciwgY29udGV4dCktPlxuICAgICAgICBzdWJqZWN0Ll9iYklkID0gZ2VuSWQoKSB1bmxlc3Mgc3ViamVjdC5fYmJJZD9cbiAgICAgICAgaGFuZGxlcktleSA9IFwiI3tzdWJqZWN0Ll9iYklkfS0je2V2ZW50fVwiXG4gICAgICAgIHVubGVzcyBAaGFuZGxlcnNbaGFuZGxlcktleV0/XG4gICAgICAgICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0gPSBbXVxuICAgICAgICAgICAgQGVudGl0eS5saXN0ZW5UbyBzdWJqZWN0LCBldmVudCwgQGV2ZW50SGFuZGxlcihoYW5kbGVyS2V5KVxuICAgICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0ucHVzaCBoYW5kbGVyLmJpbmQoY29udGV4dClcblxuXG4gICAgYWRkSGFuZGxlcjogKGV2ZW50cywgaGFuZGxlciwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBpZiB0eXBlb2YgZXZlbnRzIGlzICdvYmplY3QnXG4gICAgICAgICAgICBAYWRkSGFuZGxlcihrZXksIHZhbHVlLCBwYXJlbnQpIGZvciBrZXksIHZhbHVlIG9mIGV2ZW50c1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnb2JqZWN0JyBhbmQgIShBcnJheS5pc0FycmF5KGhhbmRsZXIpKVxuICAgICAgICAgICAgICAgIGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCA9IEBnZXRDaGlsZCBldmVudC5zcGxpdCgnLicpLCBldmVudCwgcGFyZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGtleSwgdmFsIG9mIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkSGFuZGxlciBrZXksIHZhbCwgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBhcHBlbmQgaGFuZGxlcnMgdG8gI3tldmVudH0gY2F1c2UgY2hpbGQgbm90IGZvdW5kXCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgaGFuZGxlciA9IGFycmF5RnJvbVN0cmluZyBoYW5kbGVyIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICBoYW5kbGVyID0gW2hhbmRsZXJdIHVubGVzcyBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKClcbiAgICAgICAgICAgIGV2ZW50cyA9IGhhbmRsZXIuc2hpZnQoKSBpZiBldmVudHNbMF0gaXMgJ18nXG5cbiAgICAgICAgICAgIGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgZXZlbnRQYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICBwYXJlbnRQYXRoID0gZXZlbnQuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgIGV2ZW50ID0gcGFyZW50UGF0aC5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHBhcmVudFBhdGgubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGV2ZW50UGFyZW50ID0gQGdldENoaWxkKHBhcmVudFBhdGgsIHBhcmVudFBhdGguam9pbignLicpLCBldmVudFBhcmVudCkpXG5cbiAgICAgICAgICAgICAgICBoYW5kbGVyLmZvckVhY2ggKGhhbmRsZXIpPT5cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyUGFyZW50ID0gQGVudGl0eVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGhhbmRsZXIuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGNoaWxkLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChoYW5kbGVyUGFyZW50ID0gaWYgY2hpbGQubGVuZ3RoIHRoZW4gQGdldENoaWxkKGNoaWxkLCBoYW5kbGVyTmFtZSkgZWxzZSBAZW50aXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXJQYXJlbnRbaGFuZGxlcl1cbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGFkZExpc3RlbmVyIGV2ZW50UGFyZW50LCBldmVudCwgaGFuZGxlciwgaGFuZGxlclBhcmVudFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGZpbmQgaGFuZGxlciBmb3IgXFxcIiN7ZXZlbnR9XFxcIlwiICsgKGlmIGhhbmRsZXJOYW1lIHRoZW4gXCI6IFxcXCIje2hhbmRsZXJOYW1lfVxcXCJcIiBlbHNlICcnKVxuXG4gICAgYWRkSGFuZGxlcnM6IC0+XG4gICAgICAgIEBhZGRIYW5kbGVyIEBlbnRpdHkuaGFuZGxlcnMgaWYgQGVudGl0eS5oYW5kbGVycz8gYW5kICFAZW50aXR5LmRpc2FibGVIYW5kbGVyc1xuXG4gICAgbGF1bmNoOiAoaW5pdEhhbmRsZXJzLCBwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKCkgaWYgaW5pdEhhbmRsZXJzP1xuICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlJFQURZXG4gICAgICAgIEBlbnRpdHkudHJpZ2dlciAnbGF1bmNoJywgcGFyYW1zLi4uXG5cbiAgICBwcmVwYXJlczogbnVsbFxuXG4gICAgcHJlcGFyZUFuZExhdW5jaDogKHBhcmFtcyktPlxuICAgICAgICBAZW50aXR5LmZpcnN0TGF1bmNoID0gQHByZXBhcmVzP1xuXG4gICAgICAgIGlmIEJhY2tib25lUHJlcGFyZS5sZW5ndGggb3IgQXJyYXkuaXNBcnJheSBAZW50aXR5LnByZXBhcmVcbiAgICAgICAgICAgIHVubGVzcyBAcHJlcGFyZXM/XG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcmVwYXJlIHx8PSBbXVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZS5jb25jYXQgQGVudGl0eS5wcmVwYXJlXG5cbiAgICAgICAgICAgICAgICBAcHJlcGFyZXMgPSBAZW50aXR5LnByZXBhcmUubWFwICgobmFtZSk9PlxuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSBpZiB0eXBlb2YgbmFtZSBpcyAnZnVuY3Rpb24nIHRoZW4gbmFtZSBlbHNlIEBlbnRpdHlbbmFtZV1cbiAgICAgICAgICAgICAgICAgICAgdW5sZXNzIHR5cGVvZiBwcmVwYXJlRnVuY3Rpb24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJQcmVwYXJlIGl0ZW0gI3tuYW1lfSBpc24ndCBmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvblxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgaWYgQHByZXBhcmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuUFJFUEFSRVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJvbWlzZSA9IEBleGVjdXRlQ2hhaW4oQHByZXBhcmVzLCBwYXJhbXMpXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcm9taXNlXG4gICAgICAgICAgICAgICAgLmRvbmUoPT5cbiAgICAgICAgICAgICAgICAgICAgQGxhdW5jaCBAZW50aXR5LmZpcnN0TGF1bmNoLCBwYXJhbXMuLi5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmZhaWwoPT5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQmFja2JvbmUgaW5pdGlhbGl6ZSBwcmVwYXJlcyBmYWlsOiBcIiwgQHByZXBhcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5QUkVQQVJFX0ZBSUxcbiAgICAgICAgICAgICAgICAgICAgQGVudGl0eS5vbkxhdW5jaEZhaWwgcGFyYW1zLi4uIGlmIHR5cGVvZiBAZW50aXR5Lm9uTGF1bmNoRmFpbCBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHJldHVybiBAZW50aXR5LnByb21pc2VcbiAgICAgICAgQGxhdW5jaCBAZW50aXR5LmZpcnN0TGF1bmNoLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICB1bmxlc3MgQGVudGl0eS5ub0JpbmQ/XG4gICAgICAgICAgICBmb3IgbmFtZSwgbWV0aG9kIG9mIEBlbnRpdHkgd2hlbiB0eXBlb2YgbWV0aG9kIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICBAZW50aXR5W25hbWVdID0gbWV0aG9kLmJpbmQgQGVudGl0eVxuXG4gICAgICAgIEBlbnRpdHkuYWRkSGFuZGxlciA9IEBhZGRIYW5kbGVyLmJpbmQgQFxuICAgICAgICBAZW50aXR5LmV4ZWN1dGVDaGFpbiA9IEBleGVjdXRlQ2hhaW4uYmluZCBAXG4gICAgICAgIEBoYW5kbGVycyA9IHt9XG4gICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuSU5JVFxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSB1bmxlc3Mgb3B0aW9ucz9cbiAgICBAcHJlcGFyZSA9IGFycmF5RnJvbVN0cmluZyhAcHJlcGFyZSkgaWYgdHlwZW9mIEBwcmVwYXJlIGlzICdzdHJpbmcnXG4gICAgcmV0dXJuIHVubGVzcyB0eXBlb2YgQGhhbmRsZXJzIGlzICdvYmplY3QnIG9yIG9wdGlvbnM/LmF0dGFjaD8gb3IgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJyBvciBBcnJheS5pc0FycmF5KEBwcmVwYXJlKVxuICAgIEBfYmJJbml0aWFsaXplID0gbmV3IEJhY2tib25lSW5pdGlhbGl6ZSBAXG4gICAgQGFkZEhhbmRsZXIoJ2xhdW5jaCcsIEBsYXVuY2gpIGlmIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBAcmVsYXVuY2ggPSA9PlxuICAgICAgICBAX2JiSW5pdGlhbGl6ZS5wcmVwYXJlQW5kTGF1bmNoIHBhcmFtc1xuICAgIEByZWxhdW5jaCgpXG5cbkJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLk5lc3RlZE1vZGVsP1xuICAgIEJhY2tib25lLk5lc3RlZE1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgICBCYWNrYm9uZS5MYXlvdXQucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgTWFyaW9uZXR0ZT9cbiAgICBNYXJpb25ldHRlLk9iamVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG4iXX0=
