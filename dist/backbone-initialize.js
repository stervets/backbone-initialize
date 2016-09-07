(function() {
  var BackboneInitialize, BackbonePrepare, KEYS, KEY_LENGTH, arrayFromString, backboneInitialize, genId,
    slice = [].slice;

  KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  KEY_LENGTH = KEYS.length;

  this.BackbonePrepare = BackbonePrepare = [];

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
      var promise;
      if (context == null) {
        context = this.entity;
      }
      if (defer == null) {
        defer = $.Deferred();
        chain = chain.slice();
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
        return console.warn("Defer chain fail", promise);
      });
      return defer.promise();
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
      return (ref = this.entity).trigger.apply(ref, ['launch'].concat(slice.call(params)));
    };

    BackboneInitialize.prototype.prepares = null;

    BackboneInitialize.prototype.prepareAndLaunch = function(params) {
      var base, initHandlers;
      initHandlers = !!this.prepares;
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
          this.entity.promise = this.executeChain(this.prepares, params);
          this.entity.promise.done((function(_this) {
            return function() {
              return _this.launch.apply(_this, [initHandlers].concat(slice.call(params)));
            };
          })(this)).fail(function() {
            return console.warn("Backbone initialize prepares fail: ", this.prepares);
          });
          return;
        }
      }
      return this.launch.apply(this, [initHandlers].concat(slice.call(params)));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpR0FBQTtJQUFBOztFQUFBLElBQUEsR0FBTzs7RUFDUCxVQUFBLEdBQWEsSUFBSSxDQUFDOztFQUNsQixJQUFDLENBQUEsZUFBRCxHQUFtQixlQUFBLEdBQWtCOztFQUVyQyxlQUFBLEdBQWtCLFNBQUMsTUFBRDtJQUNkLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGFBQU8sT0FBUDs7V0FDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7YUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO0lBQVQsQ0FBdEI7RUFGYzs7RUFJbEIsS0FBQSxHQUFRLFNBQUMsTUFBRCxFQUFjLEVBQWQ7O01BQUMsU0FBUzs7O01BQUksS0FBSzs7QUFDdkIsV0FBTyxNQUFBLEVBQUEsR0FBVyxDQUFsQjtNQUNJLEVBQUEsSUFBTSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLFVBQTNCLENBQVo7TUFDTixJQUFBLENBQUEsQ0FBaUIsQ0FBQyxNQUFELElBQVcsTUFBQSxHQUFTLENBQXJDLENBQUE7UUFBQSxFQUFBLElBQU0sSUFBTjs7SUFGSjtXQUdBO0VBSkk7O0VBTUY7aUNBQ0YsUUFBQSxHQUFVOztpQ0FDVixNQUFBLEdBQVE7O2lDQUVSLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsTUFBZDtBQUNOLFVBQUE7O1FBRG9CLFNBQVMsSUFBQyxDQUFBOztNQUM5QixLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBQTtNQUNSLElBQUcscUJB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Q0FBQyxVQUEvQixHQUE0QyxtQkFEaEQ7OztFQUdBLElBQUcsdUJBQUg7SUFDSSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUExQixHQUF1QyxtQkFEM0M7OztFQUdBLElBQUcsd0RBQUg7SUFDSSxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUE1QixHQUF5QyxtQkFEN0M7O0FBeEtBIiwiZmlsZSI6ImJhY2tib25lLWluaXRpYWxpemUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJLRVlTID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODlcIlxuS0VZX0xFTkdUSCA9IEtFWVMubGVuZ3RoO1xuQEJhY2tib25lUHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZSA9IFtdXG5cbmFycmF5RnJvbVN0cmluZyA9IChzdHJpbmcpLT5cbiAgICByZXR1cm4gc3RyaW5nIGlmIEFycmF5LmlzQXJyYXkgc3RyaW5nXG4gICAgc3RyaW5nLnNwbGl0KCcsJykubWFwIChpdGVtKS0+IGl0ZW0udHJpbSgpXG5cbmdlbklkID0gKGxlbmd0aCA9IDE2LCBpZCA9ICcnKS0+XG4gICAgd2hpbGUgKGxlbmd0aC0tID4gMClcbiAgICAgICAgaWQgKz0gS0VZUy5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogS0VZX0xFTkdUSCkpXG4gICAgICAgIGlkICs9ICctJyB1bmxlc3MgIWxlbmd0aCBvciBsZW5ndGggJSA0XG4gICAgaWRcblxuY2xhc3MgQmFja2JvbmVJbml0aWFsaXplXG4gICAgaGFuZGxlcnM6IG51bGxcbiAgICBlbnRpdHk6IG51bGxcblxuICAgIHdhcm46IChtZXNzYWdlKS0+XG4gICAgICAgIGNvbnNvbGUud2FybiBcIkJhY2tib25lLWluaXRpYWxpemUgd2FybjogI3ttZXNzYWdlfVwiXG5cbiAgICBnZXRDaGlsZDogKHBhdGgsIGV2ZW50LCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGNoaWxkID0gcGF0aC5zaGlmdCgpXG4gICAgICAgIGlmIHBhcmVudFtjaGlsZF0/XG4gICAgICAgICAgICByZXR1cm4gaWYgcGF0aC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQocGF0aCwgZXZlbnQsIHBhcmVudFtjaGlsZF0pIGVsc2UgcGFyZW50W2NoaWxkXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd2FybiBcIiN7Y2hpbGR9IHVuZGVmaW5lZCAodGhpcy4je2V2ZW50fSlcIlxuICAgICAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIGV2ZW50SGFuZGxlcjogKGhhbmRsZXJLZXkpLT5cbiAgICAgICAgaGFuZGxlcnMgPSBAaGFuZGxlcnNbaGFuZGxlcktleV1cbiAgICAgICAgKHBhcmFtcy4uLik9PlxuICAgICAgICAgICAgQGV4ZWN1dGVDaGFpbiBoYW5kbGVycywgcGFyYW1zXG5cbiAgICBleGVjdXRlQ2hhaW46IChjaGFpbiwgcGFyYW1zLCBjb250ZXh0ID0gQGVudGl0eSwgZGVmZXIpLT5cbiAgICAgICAgdW5sZXNzIGRlZmVyP1xuICAgICAgICAgICAgZGVmZXIgPSAkLkRlZmVycmVkKClcbiAgICAgICAgICAgIGNoYWluID0gY2hhaW4uc2xpY2UoKVxuXG4gICAgICAgIHByb21pc2UgPSBjaGFpbi5zaGlmdCgpXG4gICAgICAgICQud2hlbihwcm9taXNlLmFwcGx5KGNvbnRleHQsIHBhcmFtcykpXG4gICAgICAgIC5kb25lKD0+XG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGNoYWluLCBwYXJhbXMsIGNvbnRleHQsIGRlZmVyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpXG4gICAgICAgIClcbiAgICAgICAgLmZhaWwoLT5cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkRlZmVyIGNoYWluIGZhaWxcIiwgcHJvbWlzZSlcbiAgICAgICAgKVxuICAgICAgICBkZWZlci5wcm9taXNlKClcblxuICAgIGFkZExpc3RlbmVyOiAoc3ViamVjdCwgZXZlbnQsIGhhbmRsZXIsIGNvbnRleHQpLT5cbiAgICAgICAgc3ViamVjdC5fYmJJZCA9IGdlbklkKCkgdW5sZXNzIHN1YmplY3QuX2JiSWQ/XG4gICAgICAgIGhhbmRsZXJLZXkgPSBcIiN7c3ViamVjdC5fYmJJZH0tI3tldmVudH1cIlxuICAgICAgICB1bmxlc3MgQGhhbmRsZXJzW2hhbmRsZXJLZXldP1xuICAgICAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldID0gW11cbiAgICAgICAgICAgIEBlbnRpdHkubGlzdGVuVG8gc3ViamVjdCwgZXZlbnQsIEBldmVudEhhbmRsZXIoaGFuZGxlcktleSlcbiAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldLnB1c2ggaGFuZGxlci5iaW5kKGNvbnRleHQpXG5cblxuICAgIGFkZEhhbmRsZXI6IChldmVudHMsIGhhbmRsZXIsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgaWYgdHlwZW9mIGV2ZW50cyBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgQGFkZEhhbmRsZXIoa2V5LCB2YWx1ZSwgcGFyZW50KSBmb3Iga2V5LCB2YWx1ZSBvZiBldmVudHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrZXksIHZhbCBvZiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZEhhbmRsZXIga2V5LCB2YWwsIGNoaWxkXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgYXBwZW5kIGhhbmRsZXJzIHRvICN7ZXZlbnR9IGNhdXNlIGNoaWxkIG5vdCBmb3VuZFwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIGhhbmRsZXIgPSBhcnJheUZyb21TdHJpbmcgaGFuZGxlciBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXSB1bmxlc3MgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpXG4gICAgICAgICAgICBldmVudHMgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRzWzBdIGlzICdfJ1xuXG4gICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgIGV2ZW50UGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICBldmVudCA9IHBhcmVudFBhdGgucG9wKClcbiAgICAgICAgICAgICAgICBpZiBwYXJlbnRQYXRoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChldmVudFBhcmVudCA9IEBnZXRDaGlsZChwYXJlbnRQYXRoLCBwYXJlbnRQYXRoLmpvaW4oJy4nKSwgZXZlbnRQYXJlbnQpKVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5mb3JFYWNoIChoYW5kbGVyKT0+XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBoYW5kbGVyLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBjaGlsZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoaGFuZGxlclBhcmVudCA9IGlmIGNoaWxkLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChjaGlsZCwgaGFuZGxlck5hbWUpIGVsc2UgQGVudGl0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyUGFyZW50W2hhbmRsZXJdXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRMaXN0ZW5lciBldmVudFBhcmVudCwgZXZlbnQsIGhhbmRsZXIsIGhhbmRsZXJQYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICAgIGFkZEhhbmRsZXJzOiAtPlxuICAgICAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICAgIGxhdW5jaDogKGluaXRIYW5kbGVycywgcGFyYW1zLi4uKS0+XG4gICAgICAgIEBhZGRIYW5kbGVycygpIGlmIGluaXRIYW5kbGVycz9cbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICAgIHByZXBhcmVzOiBudWxsXG4gICAgcHJlcGFyZUFuZExhdW5jaDogKHBhcmFtcyktPlxuICAgICAgICBpbml0SGFuZGxlcnMgPSAhIUBwcmVwYXJlc1xuICAgICAgICBpZiBCYWNrYm9uZVByZXBhcmUubGVuZ3RoIG9yIEFycmF5LmlzQXJyYXkgQGVudGl0eS5wcmVwYXJlXG4gICAgICAgICAgICB1bmxlc3MgQHByZXBhcmVzP1xuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJlcGFyZSB8fD0gW11cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUuY29uY2F0IEBlbnRpdHkucHJlcGFyZVxuXG4gICAgICAgICAgICAgICAgQHByZXBhcmVzID0gQGVudGl0eS5wcmVwYXJlLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAZW50aXR5W25hbWVdXG4gICAgICAgICAgICAgICAgICAgIHVubGVzcyB0eXBlb2YgcHJlcGFyZUZ1bmN0aW9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiUHJlcGFyZSBpdGVtICN7bmFtZX0gaXNuJ3QgZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb25cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgIGlmIEBwcmVwYXJlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2UgPSBAZXhlY3V0ZUNoYWluKEBwcmVwYXJlcywgcGFyYW1zKVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICAgICAgICAgIC5kb25lKD0+XG4gICAgICAgICAgICAgICAgICAgIEBsYXVuY2ggaW5pdEhhbmRsZXJzLCBwYXJhbXMuLi5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmZhaWwoLT5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQmFja2JvbmUgaW5pdGlhbGl6ZSBwcmVwYXJlcyBmYWlsOiBcIiwgQHByZXBhcmVzKTtcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBsYXVuY2ggaW5pdEhhbmRsZXJzLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICB1bmxlc3MgQGVudGl0eS5ub0JpbmQ/XG4gICAgICAgICAgICBmb3IgbmFtZSwgbWV0aG9kIG9mIEBlbnRpdHkgd2hlbiB0eXBlb2YgbWV0aG9kIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICBAZW50aXR5W25hbWVdID0gbWV0aG9kLmJpbmQgQGVudGl0eVxuICAgICAgICBAZW50aXR5LmFkZEhhbmRsZXIgPSBAYWRkSGFuZGxlci5iaW5kIEBcbiAgICAgICAgQGVudGl0eS5leGVjdXRlQ2hhaW4gPSBAZXhlY3V0ZUNoYWluLmJpbmQgQFxuICAgICAgICBAaGFuZGxlcnMgPSB7fVxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSB1bmxlc3Mgb3B0aW9ucz9cbiAgICBAcHJlcGFyZSA9IGFycmF5RnJvbVN0cmluZyhAcHJlcGFyZSkgaWYgdHlwZW9mIEBwcmVwYXJlIGlzICdzdHJpbmcnXG4gICAgcmV0dXJuIHVubGVzcyB0eXBlb2YgQGhhbmRsZXJzIGlzICdvYmplY3QnIG9yIG9wdGlvbnM/LmF0dGFjaD8gb3IgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJyBvciBBcnJheS5pc0FycmF5KEBwcmVwYXJlKVxuICAgIEBfYmJJbml0aWFsaXplID0gbmV3IEJhY2tib25lSW5pdGlhbGl6ZSBAXG4gICAgQGFkZEhhbmRsZXIoJ2xhdW5jaCcsIEBsYXVuY2gpIGlmIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBAcmVsYXVuY2ggPSA9PlxuICAgICAgICBAX2JiSW5pdGlhbGl6ZS5wcmVwYXJlQW5kTGF1bmNoIHBhcmFtc1xuICAgIEByZWxhdW5jaCgpXG5cbkJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLk5lc3RlZE1vZGVsP1xuICAgIEJhY2tib25lLk5lc3RlZE1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgICBCYWNrYm9uZS5MYXlvdXQucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgTWFyaW9uZXR0ZT9cbiAgICBNYXJpb25ldHRlLk9iamVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG4iXX0=
