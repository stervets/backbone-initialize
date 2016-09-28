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
              console.warn("Backbone initialize prepares fail: ", _this.prepares);
              return _this.entity.launchStatus = BackboneLaunchStatus.PREPARE_FAIL;
            };
          })(this));
          return;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpR0FBQTtJQUFBOztFQUFBLElBQUEsR0FBTzs7RUFDUCxVQUFBLEdBQWEsSUFBSSxDQUFDOztFQUNsQixJQUFDLENBQUEsZUFBRCxHQUFtQixlQUFBLEdBQWtCOztFQUVyQyxJQUFDLENBQUEsb0JBQUQsR0FDSTtJQUFBLElBQUEsRUFBTSxHQUFOO0lBQ0EsT0FBQSxFQUFTLEdBRFQ7SUFFQSxZQUFBLEVBQWMsR0FGZDtJQUdBLEtBQUEsRUFBTyxHQUhQOzs7RUFNSixlQUFBLEdBQWtCLFNBQUMsTUFBRDtJQUNkLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGFBQU8sT0FBUDs7V0FDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7YUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO0lBQVQsQ0FBdEI7RUFGYzs7RUFJbEIsS0FBQSxHQUFRLFNBQUMsTUFBRCxFQUFjLEVBQWQ7O01BQUMsU0FBUzs7O01BQUksS0FBSzs7QUFDdkIsV0FBTyxNQUFBLEVBQUEsR0FBVyxDQUFsQjtNQUNJLEVBQUEsSUFBTSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLFVBQTNCLENBQVo7TUFDTixJQUFBLENBQUEsQ0FBaUIsQ0FBQyxNQUFELElBQVcsTUFBQSxHQUFTLENBQXJDLENBQUE7UUFBQSxFQUFBLElBQU0sSUFBTjs7SUFGSjtXQUdBO0VBSkk7O0VBTUY7aUNBQ0YsUUFBQSxHQUFVOztpQ0FDVixNQUFBLEdBQVE7O2lDQUVSLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFD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QVosRUFBc0IsSUFBQyxDQUFBLE1BQXZCLEVBQUE7O0lBRUEsSUFBRyxtREFBSDtBQUNJO0FBQUEsV0FBQSxXQUFBOztRQUFBLElBQUUsQ0FBQSxJQUFBLENBQUYsR0FBVTtBQUFWLE9BREo7O0lBR0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFDUixLQUFDLENBQUEsYUFBYSxDQUFDLGdCQUFmLENBQWdDLE1BQWhDO01BRFE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1dBRVosSUFBQyxDQUFBLFFBQUQsQ0FBQTtFQWJpQjs7RUFlckIsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBekIsR0FBc0M7O0VBQ3RDLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQTlCLEdBQTJDOztFQUMzQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUF4QixHQUFxQzs7RUFFckMsSUFBRyw0QkFBSDtJQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQS9CLEdBQTRDLG1CQURoRDs7O0VBR0EsSUFBRyx1QkFBSDtJQUNJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUQzQzs7O0VBR0EsSUFBRyx3REFBSDtJQUNJLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQ3Qzs7QUExTEEiLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIktFWVMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaMDEyMzQ1Njc4OVwiXG5LRVlfTEVOR1RIID0gS0VZUy5sZW5ndGg7XG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuQEJhY2tib25lTGF1bmNoU3RhdHVzID1cbiAgICBJTklUOiAweDBcbiAgICBQUkVQQVJFOiAweDFcbiAgICBQUkVQQVJFX0ZBSUw6IDB4MlxuICAgIFJFQURZOiAweDRcblxuXG5hcnJheUZyb21TdHJpbmcgPSAoc3RyaW5nKS0+XG4gICAgcmV0dXJuIHN0cmluZyBpZiBBcnJheS5pc0FycmF5IHN0cmluZ1xuICAgIHN0cmluZy5zcGxpdCgnLCcpLm1hcCAoaXRlbSktPiBpdGVtLnRyaW0oKVxuXG5nZW5JZCA9IChsZW5ndGggPSAxNiwgaWQgPSAnJyktPlxuICAgIHdoaWxlIChsZW5ndGgtLSA+IDApXG4gICAgICAgIGlkICs9IEtFWVMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIEtFWV9MRU5HVEgpKVxuICAgICAgICBpZCArPSAnLScgdW5sZXNzICFsZW5ndGggb3IgbGVuZ3RoICUgNFxuICAgIGlkXG5cbmNsYXNzIEJhY2tib25lSW5pdGlhbGl6ZVxuICAgIGhhbmRsZXJzOiBudWxsXG4gICAgZW50aXR5OiBudWxsXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIlxuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgICAgICBpZiBwYXJlbnRbY2hpbGRdP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBhdGgubGVuZ3RoIHRoZW4gQGdldENoaWxkKHBhdGgsIGV2ZW50LCBwYXJlbnRbY2hpbGRdKSBlbHNlIHBhcmVudFtjaGlsZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCIje2NoaWxkfSB1bmRlZmluZWQgKHRoaXMuI3tldmVudH0pXCJcbiAgICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICBldmVudEhhbmRsZXI6IChoYW5kbGVyS2V5KS0+XG4gICAgICAgIGhhbmRsZXJzID0gQGhhbmRsZXJzW2hhbmRsZXJLZXldXG4gICAgICAgIChwYXJhbXMuLi4pPT5cbiAgICAgICAgICAgIEBleGVjdXRlQ2hhaW4gaGFuZGxlcnMsIHBhcmFtc1xuXG4gICAgZXhlY3V0ZUNoYWluOiAoY2hhaW4sIHBhcmFtcywgY29udGV4dCA9IEBlbnRpdHksIGRlZmVyKS0+XG4gICAgICAgIHVubGVzcyBkZWZlcj9cbiAgICAgICAgICAgIGRlZmVyID0gJC5EZWZlcnJlZCgpXG4gICAgICAgICAgICBjaGFpbiA9IGNoYWluLnNsaWNlKClcbiAgICAgICAgICAgIGRlZmVyUHJvbWlzZSA9IGRlZmVyLnByb21pc2UoKVxuICAgICAgICAgICAgZGVmZXJQcm9taXNlLmRlZmVyID0gZGVmZXJcblxuICAgICAgICBwcm9taXNlID0gY2hhaW4uc2hpZnQoKVxuXG4gICAgICAgICQud2hlbihwcm9taXNlLmFwcGx5KGNvbnRleHQsIHBhcmFtcykpXG4gICAgICAgIC5kb25lKD0+XG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGNoYWluLCBwYXJhbXMsIGNvbnRleHQsIGRlZmVyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpXG4gICAgICAgIClcbiAgICAgICAgLmZhaWwoLT5cbiAgICAgICAgICAgIGNvbnNvbGUud2FybiBcIkRlZmVycmVkIGNoYWluIGZhaWxcIiwgcHJvbWlzZVxuICAgICAgICAgICAgZGVmZXIucmVqZWN0KClcbiAgICAgICAgKVxuICAgICAgICBkZWZlclByb21pc2VcblxuICAgIGFkZExpc3RlbmVyOiAoc3ViamVjdCwgZXZlbnQsIGhhbmRsZXIsIGNvbnRleHQpLT5cbiAgICAgICAgc3ViamVjdC5fYmJJZCA9IGdlbklkKCkgdW5sZXNzIHN1YmplY3QuX2JiSWQ/XG4gICAgICAgIGhhbmRsZXJLZXkgPSBcIiN7c3ViamVjdC5fYmJJZH0tI3tldmVudH1cIlxuICAgICAgICB1bmxlc3MgQGhhbmRsZXJzW2hhbmRsZXJLZXldP1xuICAgICAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldID0gW11cbiAgICAgICAgICAgIEBlbnRpdHkubGlzdGVuVG8gc3ViamVjdCwgZXZlbnQsIEBldmVudEhhbmRsZXIoaGFuZGxlcktleSlcbiAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldLnB1c2ggaGFuZGxlci5iaW5kKGNvbnRleHQpXG5cblxuICAgIGFkZEhhbmRsZXI6IChldmVudHMsIGhhbmRsZXIsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgaWYgdHlwZW9mIGV2ZW50cyBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgQGFkZEhhbmRsZXIoa2V5LCB2YWx1ZSwgcGFyZW50KSBmb3Iga2V5LCB2YWx1ZSBvZiBldmVudHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrZXksIHZhbCBvZiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZEhhbmRsZXIga2V5LCB2YWwsIGNoaWxkXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgYXBwZW5kIGhhbmRsZXJzIHRvICN7ZXZlbnR9IGNhdXNlIGNoaWxkIG5vdCBmb3VuZFwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIGhhbmRsZXIgPSBhcnJheUZyb21TdHJpbmcgaGFuZGxlciBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXSB1bmxlc3MgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpXG4gICAgICAgICAgICBldmVudHMgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRzWzBdIGlzICdfJ1xuXG4gICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgIGV2ZW50UGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICBldmVudCA9IHBhcmVudFBhdGgucG9wKClcbiAgICAgICAgICAgICAgICBpZiBwYXJlbnRQYXRoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChldmVudFBhcmVudCA9IEBnZXRDaGlsZChwYXJlbnRQYXRoLCBwYXJlbnRQYXRoLmpvaW4oJy4nKSwgZXZlbnRQYXJlbnQpKVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5mb3JFYWNoIChoYW5kbGVyKT0+XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBoYW5kbGVyLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBjaGlsZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoaGFuZGxlclBhcmVudCA9IGlmIGNoaWxkLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChjaGlsZCwgaGFuZGxlck5hbWUpIGVsc2UgQGVudGl0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyUGFyZW50W2hhbmRsZXJdXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRMaXN0ZW5lciBldmVudFBhcmVudCwgZXZlbnQsIGhhbmRsZXIsIGhhbmRsZXJQYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICAgIGFkZEhhbmRsZXJzOiAtPlxuICAgICAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICAgIGxhdW5jaDogKGluaXRIYW5kbGVycywgcGFyYW1zLi4uKS0+XG4gICAgICAgIEBhZGRIYW5kbGVycygpIGlmIGluaXRIYW5kbGVycz9cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5SRUFEWVxuICAgICAgICBAZW50aXR5LnRyaWdnZXIgJ2xhdW5jaCcsIHBhcmFtcy4uLlxuXG4gICAgcHJlcGFyZXM6IG51bGxcblxuICAgIHByZXBhcmVBbmRMYXVuY2g6IChwYXJhbXMpLT5cbiAgICAgICAgQGVudGl0eS5maXJzdExhdW5jaCA9IEBwcmVwYXJlcz9cblxuICAgICAgICBpZiBCYWNrYm9uZVByZXBhcmUubGVuZ3RoIG9yIEFycmF5LmlzQXJyYXkgQGVudGl0eS5wcmVwYXJlXG4gICAgICAgICAgICB1bmxlc3MgQHByZXBhcmVzP1xuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJlcGFyZSB8fD0gW11cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUuY29uY2F0IEBlbnRpdHkucHJlcGFyZVxuXG4gICAgICAgICAgICAgICAgQHByZXBhcmVzID0gQGVudGl0eS5wcmVwYXJlLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAZW50aXR5W25hbWVdXG4gICAgICAgICAgICAgICAgICAgIHVubGVzcyB0eXBlb2YgcHJlcGFyZUZ1bmN0aW9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiUHJlcGFyZSBpdGVtICN7bmFtZX0gaXNuJ3QgZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb25cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgIGlmIEBwcmVwYXJlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2UgPSBAZXhlY3V0ZUNoYWluKEBwcmVwYXJlcywgcGFyYW1zKVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICAgICAgICAgIC5kb25lKD0+XG4gICAgICAgICAgICAgICAgICAgIEBsYXVuY2ggQGVudGl0eS5maXJzdExhdW5jaCwgcGFyYW1zLi4uXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5mYWlsKD0+XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkJhY2tib25lIGluaXRpYWxpemUgcHJlcGFyZXMgZmFpbDogXCIsIEBwcmVwYXJlcyk7XG4gICAgICAgICAgICAgICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuUFJFUEFSRV9GQUlMXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIHVubGVzcyBAZW50aXR5Lm5vQmluZD9cbiAgICAgICAgICAgIGZvciBuYW1lLCBtZXRob2Qgb2YgQGVudGl0eSB3aGVuIHR5cGVvZiBtZXRob2QgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBlbnRpdHlbbmFtZV0gPSBtZXRob2QuYmluZCBAZW50aXR5XG5cbiAgICAgICAgQGVudGl0eS5hZGRIYW5kbGVyID0gQGFkZEhhbmRsZXIuYmluZCBAXG4gICAgICAgIEBlbnRpdHkuZXhlY3V0ZUNoYWluID0gQGV4ZWN1dGVDaGFpbi5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5JTklUXG5cbmJhY2tib25lSW5pdGlhbGl6ZSA9IChwYXJhbXMuLi4pLT5cbiAgICBvcHRpb25zID0gQG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFyYW1zWzFdIHVubGVzcyBvcHRpb25zP1xuICAgIEBwcmVwYXJlID0gYXJyYXlGcm9tU3RyaW5nKEBwcmVwYXJlKSBpZiB0eXBlb2YgQHByZXBhcmUgaXMgJ3N0cmluZydcbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcbiAgICBAYWRkSGFuZGxlcignbGF1bmNoJywgQGxhdW5jaCkgaWYgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJ1xuXG4gICAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgICAgICBAW25hbWVdID0gb2JqZWN0IGZvciBuYW1lLCBvYmplY3Qgb2Ygb3B0aW9ucy5hdHRhY2hcblxuICAgIEByZWxhdW5jaCA9ID0+XG4gICAgICAgIEBfYmJJbml0aWFsaXplLnByZXBhcmVBbmRMYXVuY2ggcGFyYW1zXG4gICAgQHJlbGF1bmNoKClcblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gICAgQmFja2JvbmUuTmVzdGVkTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
