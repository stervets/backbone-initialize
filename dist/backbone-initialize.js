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
            return defer.resolve();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpR0FBQTtJQUFBOztFQUFBLElBQUEsR0FBTzs7RUFDUCxVQUFBLEdBQWEsSUFBSSxDQUFDOztFQUNsQixJQUFDLENBQUEsZUFBRCxHQUFtQixlQUFBLEdBQWtCOztFQUVyQyxJQUFDLENBQUEsb0JBQUQsR0FDSTtJQUFBLElBQUEsRUFBTSxHQUFOO0lBQ0EsT0FBQSxFQUFTLEdBRFQ7SUFFQSxZQUFBLEVBQWMsR0FGZDtJQUdBLEtBQUEsRUFBTyxHQUhQOzs7RUFNSixlQUFBLEdBQWtCLFNBQUMsTUFBRDtJQUNkLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGFBQU8sT0FBUDs7V0FDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7YUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO0lBQVQsQ0FBdEI7RUFGYzs7RUFJbEIsS0FBQSxHQUFRLFNBQUMsTUFBRCxFQUFjLEVBQWQ7O01BQUMsU0FBUzs7O01BQUksS0FBSzs7QUFDdkIsV0FBTyxNQUFBLEVBQUEsR0FBVyxDQUFsQjtNQUNJLEVBQUEsSUFBTSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLFVBQTNCLENBQVo7TUFDTixJQUFBLENBQUEsQ0FBaUIsQ0FBQyxNQUFELElBQVcsTUFBQSxHQUFTLENBQXJDLENBQUE7UUFBQSxFQUFBLElBQU0sSUFBTjs7SUFGSjtXQUdBO0VBSkk7O0VBTUY7aUNBQ0YsUUFBQSxHQUFVOztpQ0FDVixNQUFBLEdBQVE7O2lDQUVSLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFD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LE9BQWYsQ0FBbEcsQ0FBQTtBQUFBLGFBQUE7O0lBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBcUIsSUFBQSxrQkFBQSxDQUFtQixJQUFuQjtJQUNyQixJQUFrQyxPQUFPLElBQUMsQ0FBQSxNQUFSLEtBQWtCLFVBQXBEO01BQUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxRQUFaLEVBQXNCLElBQUMsQ0FBQSxNQUF2QixFQUFBOztJQUVBLElBQUcsbURBQUg7QUFDSTtBQUFBLFdBQUEsV0FBQTs7UUFBQSxJQUFFLENBQUEsSUFBQSxDQUFGLEdBQVU7QUFBVixPQURKOztJQUdBLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQ1IsS0FBQyxDQUFBLGFBQWEsQ0FBQyxnQkFBZixDQUFnQyxNQUFoQztNQURRO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtXQUVaLElBQUMsQ0FBQSxRQUFELENBQUE7RUFiaUI7O0VBZXJCLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQXpCLEdBQXNDOztFQUN0QyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUE5QixHQUEyQzs7RUFDM0MsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBeEIsR0FBcUM7O0VBRXJDLElBQUcsNEJBQUg7SUFDSSxRQUFRLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUEvQixHQUE0QyxtQkFEaEQ7OztFQUdBLElBQUcsdUJBQUg7SUFDSSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUExQixHQUF1QyxtQkFEM0M7OztFQUdBLElBQUcsd0RBQUg7SUFDSSxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUE1QixHQUF5QyxtQkFEN0M7O0FBM0xBIiwiZmlsZSI6ImJhY2tib25lLWluaXRpYWxpemUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJLRVlTID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODlcIlxuS0VZX0xFTkdUSCA9IEtFWVMubGVuZ3RoO1xuQEJhY2tib25lUHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZSA9IFtdXG5cbkBCYWNrYm9uZUxhdW5jaFN0YXR1cyA9XG4gICAgSU5JVDogMHgwXG4gICAgUFJFUEFSRTogMHgxXG4gICAgUFJFUEFSRV9GQUlMOiAweDJcbiAgICBSRUFEWTogMHg0XG5cblxuYXJyYXlGcm9tU3RyaW5nID0gKHN0cmluZyktPlxuICAgIHJldHVybiBzdHJpbmcgaWYgQXJyYXkuaXNBcnJheSBzdHJpbmdcbiAgICBzdHJpbmcuc3BsaXQoJywnKS5tYXAgKGl0ZW0pLT4gaXRlbS50cmltKClcblxuZ2VuSWQgPSAobGVuZ3RoID0gMTYsIGlkID0gJycpLT5cbiAgICB3aGlsZSAobGVuZ3RoLS0gPiAwKVxuICAgICAgICBpZCArPSBLRVlTLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBLRVlfTEVOR1RIKSlcbiAgICAgICAgaWQgKz0gJy0nIHVubGVzcyAhbGVuZ3RoIG9yIGxlbmd0aCAlIDRcbiAgICBpZFxuXG5jbGFzcyBCYWNrYm9uZUluaXRpYWxpemVcbiAgICBoYW5kbGVyczogbnVsbFxuICAgIGVudGl0eTogbnVsbFxuXG4gICAgd2FybjogKG1lc3NhZ2UpLT5cbiAgICAgICAgY29uc29sZS53YXJuIFwiQmFja2JvbmUtaW5pdGlhbGl6ZSB3YXJuOiAje21lc3NhZ2V9XCJcblxuICAgIGdldENoaWxkOiAocGF0aCwgZXZlbnQsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgY2hpbGQgPSBwYXRoLnNoaWZ0KClcbiAgICAgICAgaWYgcGFyZW50W2NoaWxkXT9cbiAgICAgICAgICAgIHJldHVybiBpZiBwYXRoLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChwYXRoLCBldmVudCwgcGFyZW50W2NoaWxkXSkgZWxzZSBwYXJlbnRbY2hpbGRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgZXZlbnRIYW5kbGVyOiAoaGFuZGxlcktleSktPlxuICAgICAgICBoYW5kbGVycyA9IEBoYW5kbGVyc1toYW5kbGVyS2V5XVxuICAgICAgICAocGFyYW1zLi4uKT0+XG4gICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGhhbmRsZXJzLCBwYXJhbXNcblxuICAgIGV4ZWN1dGVDaGFpbjogKGNoYWluLCBwYXJhbXMsIGNvbnRleHQgPSBAZW50aXR5LCBkZWZlciktPlxuICAgICAgICB1bmxlc3MgZGVmZXI/XG4gICAgICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKVxuICAgICAgICAgICAgY2hhaW4gPSBjaGFpbi5zbGljZSgpXG4gICAgICAgICAgICBkZWZlclByb21pc2UgPSBkZWZlci5wcm9taXNlKClcbiAgICAgICAgICAgIGRlZmVyUHJvbWlzZS5kZWZlciA9IGRlZmVyXG5cbiAgICAgICAgcHJvbWlzZSA9IGNoYWluLnNoaWZ0KClcblxuICAgICAgICAkLndoZW4ocHJvbWlzZS5hcHBseShjb250ZXh0LCBwYXJhbXMpKVxuICAgICAgICAuZG9uZSg9PlxuICAgICAgICAgICAgaWYgY2hhaW4ubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGV4ZWN1dGVDaGFpbiBjaGFpbiwgcGFyYW1zLCBjb250ZXh0LCBkZWZlclxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKVxuICAgICAgICApXG4gICAgICAgIC5mYWlsKC0+XG4gICAgICAgICAgICBjb25zb2xlLndhcm4gXCJEZWZlcnJlZCBjaGFpbiBmYWlsXCIsIHByb21pc2VcbiAgICAgICAgICAgIGRlZmVyLnJlamVjdCgpXG4gICAgICAgIClcbiAgICAgICAgZGVmZXJQcm9taXNlXG5cbiAgICBhZGRMaXN0ZW5lcjogKHN1YmplY3QsIGV2ZW50LCBoYW5kbGVyLCBjb250ZXh0KS0+XG4gICAgICAgIHN1YmplY3QuX2JiSWQgPSBnZW5JZCgpIHVubGVzcyBzdWJqZWN0Ll9iYklkP1xuICAgICAgICBoYW5kbGVyS2V5ID0gXCIje3N1YmplY3QuX2JiSWR9LSN7ZXZlbnR9XCJcbiAgICAgICAgdW5sZXNzIEBoYW5kbGVyc1toYW5kbGVyS2V5XT9cbiAgICAgICAgICAgIEBoYW5kbGVyc1toYW5kbGVyS2V5XSA9IFtdXG4gICAgICAgICAgICBAZW50aXR5Lmxpc3RlblRvIHN1YmplY3QsIGV2ZW50LCBAZXZlbnRIYW5kbGVyKGhhbmRsZXJLZXkpXG4gICAgICAgIEBoYW5kbGVyc1toYW5kbGVyS2V5XS5wdXNoIGhhbmRsZXIuYmluZChjb250ZXh0KVxuXG5cbiAgICBhZGRIYW5kbGVyOiAoZXZlbnRzLCBoYW5kbGVyLCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGlmIHR5cGVvZiBldmVudHMgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdvYmplY3QnIGFuZCAhKEFycmF5LmlzQXJyYXkoaGFuZGxlcikpXG4gICAgICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkID0gQGdldENoaWxkIGV2ZW50LnNwbGl0KCcuJyksIGV2ZW50LCBwYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3Iga2V5LCB2YWwgb2YgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRIYW5kbGVyIGtleSwgdmFsLCBjaGlsZFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGFwcGVuZCBoYW5kbGVycyB0byAje2V2ZW50fSBjYXVzZSBjaGlsZCBub3QgZm91bmRcIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBoYW5kbGVyID0gYXJyYXlGcm9tU3RyaW5nIGhhbmRsZXIgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl0gdW5sZXNzIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKVxuICAgICAgICAgICAgZXZlbnRzID0gaGFuZGxlci5zaGlmdCgpIGlmIGV2ZW50c1swXSBpcyAnXydcblxuICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICBldmVudFBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGggPSBldmVudC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcGFyZW50UGF0aC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoZXZlbnRQYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIGV2ZW50UGFyZW50KSlcblxuICAgICAgICAgICAgICAgIGhhbmRsZXIuZm9yRWFjaCAoaGFuZGxlcik9PlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJQYXJlbnQgPSBAZW50aXR5XG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gaGFuZGxlci5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gY2hpbGQucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGhhbmRsZXJQYXJlbnQgPSBpZiBjaGlsZC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQoY2hpbGQsIGhhbmRsZXJOYW1lKSBlbHNlIEBlbnRpdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlclBhcmVudFtoYW5kbGVyXVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAYWRkTGlzdGVuZXIgZXZlbnRQYXJlbnQsIGV2ZW50LCBoYW5kbGVyLCBoYW5kbGVyUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgZmluZCBoYW5kbGVyIGZvciBcXFwiI3tldmVudH1cXFwiXCIgKyAoaWYgaGFuZGxlck5hbWUgdGhlbiBcIjogXFxcIiN7aGFuZGxlck5hbWV9XFxcIlwiIGVsc2UgJycpXG5cbiAgICBhZGRIYW5kbGVyczogLT5cbiAgICAgICAgQGFkZEhhbmRsZXIgQGVudGl0eS5oYW5kbGVycyBpZiBAZW50aXR5LmhhbmRsZXJzPyBhbmQgIUBlbnRpdHkuZGlzYWJsZUhhbmRsZXJzXG5cbiAgICBsYXVuY2g6IChpbml0SGFuZGxlcnMsIHBhcmFtcy4uLiktPlxuICAgICAgICBAYWRkSGFuZGxlcnMoKSBpZiBpbml0SGFuZGxlcnM/XG4gICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuUkVBRFlcbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICAgIHByZXBhcmVzOiBudWxsXG5cbiAgICBwcmVwYXJlQW5kTGF1bmNoOiAocGFyYW1zKS0+XG4gICAgICAgIEBlbnRpdHkuZmlyc3RMYXVuY2ggPSBAcHJlcGFyZXM/XG5cbiAgICAgICAgaWYgQmFja2JvbmVQcmVwYXJlLmxlbmd0aCBvciBBcnJheS5pc0FycmF5IEBlbnRpdHkucHJlcGFyZVxuICAgICAgICAgICAgdW5sZXNzIEBwcmVwYXJlcz9cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgfHw9IFtdXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlLmNvbmNhdCBAZW50aXR5LnByZXBhcmVcblxuICAgICAgICAgICAgICAgIEBwcmVwYXJlcyA9IEBlbnRpdHkucHJlcGFyZS5tYXAgKChuYW1lKT0+XG4gICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9IGlmIHR5cGVvZiBuYW1lIGlzICdmdW5jdGlvbicgdGhlbiBuYW1lIGVsc2UgQGVudGl0eVtuYW1lXVxuICAgICAgICAgICAgICAgICAgICB1bmxlc3MgdHlwZW9mIHByZXBhcmVGdW5jdGlvbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIlByZXBhcmUgaXRlbSAje25hbWV9IGlzbid0IGZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICBpZiBAcHJlcGFyZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5QUkVQQVJFXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcm9taXNlID0gQGV4ZWN1dGVDaGFpbihAcHJlcGFyZXMsIHBhcmFtcylcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2VcbiAgICAgICAgICAgICAgICAuZG9uZSg9PlxuICAgICAgICAgICAgICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuZmFpbCg9PlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJCYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmVzIGZhaWw6IFwiLCBAcHJlcGFyZXMpO1xuICAgICAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVfRkFJTFxuICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lm9uTGF1bmNoRmFpbCBwYXJhbXMuLi4gaWYgdHlwZW9mIEBlbnRpdHkub25MYXVuY2hGYWlsIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIHVubGVzcyBAZW50aXR5Lm5vQmluZD9cbiAgICAgICAgICAgIGZvciBuYW1lLCBtZXRob2Qgb2YgQGVudGl0eSB3aGVuIHR5cGVvZiBtZXRob2QgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBlbnRpdHlbbmFtZV0gPSBtZXRob2QuYmluZCBAZW50aXR5XG5cbiAgICAgICAgQGVudGl0eS5hZGRIYW5kbGVyID0gQGFkZEhhbmRsZXIuYmluZCBAXG4gICAgICAgIEBlbnRpdHkuZXhlY3V0ZUNoYWluID0gQGV4ZWN1dGVDaGFpbi5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5JTklUXG5cbmJhY2tib25lSW5pdGlhbGl6ZSA9IChwYXJhbXMuLi4pLT5cbiAgICBvcHRpb25zID0gQG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFyYW1zWzFdIHVubGVzcyBvcHRpb25zP1xuICAgIEBwcmVwYXJlID0gYXJyYXlGcm9tU3RyaW5nKEBwcmVwYXJlKSBpZiB0eXBlb2YgQHByZXBhcmUgaXMgJ3N0cmluZydcbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcbiAgICBAYWRkSGFuZGxlcignbGF1bmNoJywgQGxhdW5jaCkgaWYgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJ1xuXG4gICAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgICAgICBAW25hbWVdID0gb2JqZWN0IGZvciBuYW1lLCBvYmplY3Qgb2Ygb3B0aW9ucy5hdHRhY2hcblxuICAgIEByZWxhdW5jaCA9ID0+XG4gICAgICAgIEBfYmJJbml0aWFsaXplLnByZXBhcmVBbmRMYXVuY2ggcGFyYW1zXG4gICAgQHJlbGF1bmNoKClcblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gICAgQmFja2JvbmUuTmVzdGVkTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
