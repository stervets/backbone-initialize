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
          this.entity.promise = this.executeChain(this.prepares, params);
          this.entity.promise.done((function(_this) {
            return function() {
              return _this.launch.apply(_this, [_this.entity.firstLaunch].concat(slice.call(params)));
            };
          })(this)).fail(function() {
            return console.warn("Backbone initialize prepares fail: ", this.prepares);
          });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpR0FBQTtJQUFBOztFQUFBLElBQUEsR0FBTzs7RUFDUCxVQUFBLEdBQWEsSUFBSSxDQUFDOztFQUNsQixJQUFDLENBQUEsZUFBRCxHQUFtQixlQUFBLEdBQWtCOztFQUVyQyxlQUFBLEdBQWtCLFNBQUMsTUFBRDtJQUNkLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGFBQU8sT0FBUDs7V0FDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7YUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO0lBQVQsQ0FBdEI7RUFGYzs7RUFJbEIsS0FBQSxHQUFRLFNBQUMsTUFBRCxFQUFjLEVBQWQ7O01BQUMsU0FBUzs7O01BQUksS0FBSzs7QUFDdkIsV0FBTyxNQUFBLEVBQUEsR0FBVyxDQUFsQjtNQUNJLEVBQUEsSUFBTSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLFVBQTNCLENBQVo7TUFDTixJQUFBLENBQUEsQ0FBaUIsQ0FBQyxNQUFELElBQVcsTUFBQSxHQUFTLENBQXJDLENBQUE7UUFBQSxFQUFBLElBQU0sSUFBTjs7SUFGSjtXQUdBO0VBSkk7O0VBTUY7aUNBQ0YsUUFBQSxHQUFVOztpQ0FDVixNQUFBLEdBQVE7O2lDQUVSLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsTUFBZDtBQUNOLFVBQUE7O1FBRG9CLFNBQVMsSUFBQyxDQUFBOztNQUM5QixLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBQTtNQUNSLElBQUcscUJB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SUFBRyw0QkFBSDtJQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQS9CLEdBQTRDLG1CQURoRDs7O0VBR0EsSUFBRyx1QkFBSDtJQUNJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUQzQzs7O0VBR0EsSUFBRyx3REFBSDtJQUNJLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQ3Qzs7QUF6S0EiLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIktFWVMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaMDEyMzQ1Njc4OVwiXG5LRVlfTEVOR1RIID0gS0VZUy5sZW5ndGg7XG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuYXJyYXlGcm9tU3RyaW5nID0gKHN0cmluZyktPlxuICAgIHJldHVybiBzdHJpbmcgaWYgQXJyYXkuaXNBcnJheSBzdHJpbmdcbiAgICBzdHJpbmcuc3BsaXQoJywnKS5tYXAgKGl0ZW0pLT4gaXRlbS50cmltKClcblxuZ2VuSWQgPSAobGVuZ3RoID0gMTYsIGlkID0gJycpLT5cbiAgICB3aGlsZSAobGVuZ3RoLS0gPiAwKVxuICAgICAgICBpZCArPSBLRVlTLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBLRVlfTEVOR1RIKSlcbiAgICAgICAgaWQgKz0gJy0nIHVubGVzcyAhbGVuZ3RoIG9yIGxlbmd0aCAlIDRcbiAgICBpZFxuXG5jbGFzcyBCYWNrYm9uZUluaXRpYWxpemVcbiAgICBoYW5kbGVyczogbnVsbFxuICAgIGVudGl0eTogbnVsbFxuXG4gICAgd2FybjogKG1lc3NhZ2UpLT5cbiAgICAgICAgY29uc29sZS53YXJuIFwiQmFja2JvbmUtaW5pdGlhbGl6ZSB3YXJuOiAje21lc3NhZ2V9XCJcblxuICAgIGdldENoaWxkOiAocGF0aCwgZXZlbnQsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgY2hpbGQgPSBwYXRoLnNoaWZ0KClcbiAgICAgICAgaWYgcGFyZW50W2NoaWxkXT9cbiAgICAgICAgICAgIHJldHVybiBpZiBwYXRoLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChwYXRoLCBldmVudCwgcGFyZW50W2NoaWxkXSkgZWxzZSBwYXJlbnRbY2hpbGRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgZXZlbnRIYW5kbGVyOiAoaGFuZGxlcktleSktPlxuICAgICAgICBoYW5kbGVycyA9IEBoYW5kbGVyc1toYW5kbGVyS2V5XVxuICAgICAgICAocGFyYW1zLi4uKT0+XG4gICAgICAgICAgICBAZXhlY3V0ZUNoYWluIGhhbmRsZXJzLCBwYXJhbXNcblxuICAgIGV4ZWN1dGVDaGFpbjogKGNoYWluLCBwYXJhbXMsIGNvbnRleHQgPSBAZW50aXR5LCBkZWZlciktPlxuICAgICAgICB1bmxlc3MgZGVmZXI/XG4gICAgICAgICAgICBkZWZlciA9ICQuRGVmZXJyZWQoKVxuICAgICAgICAgICAgY2hhaW4gPSBjaGFpbi5zbGljZSgpXG5cbiAgICAgICAgcHJvbWlzZSA9IGNoYWluLnNoaWZ0KClcbiAgICAgICAgJC53aGVuKHByb21pc2UuYXBwbHkoY29udGV4dCwgcGFyYW1zKSlcbiAgICAgICAgLmRvbmUoPT5cbiAgICAgICAgICAgIGlmIGNoYWluLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBleGVjdXRlQ2hhaW4gY2hhaW4sIHBhcmFtcywgY29udGV4dCwgZGVmZXJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKClcbiAgICAgICAgKVxuICAgICAgICAuZmFpbCgtPlxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRGVmZXIgY2hhaW4gZmFpbFwiLCBwcm9taXNlKVxuICAgICAgICApXG4gICAgICAgIGRlZmVyLnByb21pc2UoKVxuXG4gICAgYWRkTGlzdGVuZXI6IChzdWJqZWN0LCBldmVudCwgaGFuZGxlciwgY29udGV4dCktPlxuICAgICAgICBzdWJqZWN0Ll9iYklkID0gZ2VuSWQoKSB1bmxlc3Mgc3ViamVjdC5fYmJJZD9cbiAgICAgICAgaGFuZGxlcktleSA9IFwiI3tzdWJqZWN0Ll9iYklkfS0je2V2ZW50fVwiXG4gICAgICAgIHVubGVzcyBAaGFuZGxlcnNbaGFuZGxlcktleV0/XG4gICAgICAgICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0gPSBbXVxuICAgICAgICAgICAgQGVudGl0eS5saXN0ZW5UbyBzdWJqZWN0LCBldmVudCwgQGV2ZW50SGFuZGxlcihoYW5kbGVyS2V5KVxuICAgICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0ucHVzaCBoYW5kbGVyLmJpbmQoY29udGV4dClcblxuXG4gICAgYWRkSGFuZGxlcjogKGV2ZW50cywgaGFuZGxlciwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBpZiB0eXBlb2YgZXZlbnRzIGlzICdvYmplY3QnXG4gICAgICAgICAgICBAYWRkSGFuZGxlcihrZXksIHZhbHVlLCBwYXJlbnQpIGZvciBrZXksIHZhbHVlIG9mIGV2ZW50c1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnb2JqZWN0JyBhbmQgIShBcnJheS5pc0FycmF5KGhhbmRsZXIpKVxuICAgICAgICAgICAgICAgIGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCA9IEBnZXRDaGlsZCBldmVudC5zcGxpdCgnLicpLCBldmVudCwgcGFyZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGtleSwgdmFsIG9mIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkSGFuZGxlciBrZXksIHZhbCwgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBhcHBlbmQgaGFuZGxlcnMgdG8gI3tldmVudH0gY2F1c2UgY2hpbGQgbm90IGZvdW5kXCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgaGFuZGxlciA9IGFycmF5RnJvbVN0cmluZyBoYW5kbGVyIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICBoYW5kbGVyID0gW2hhbmRsZXJdIHVubGVzcyBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKClcbiAgICAgICAgICAgIGV2ZW50cyA9IGhhbmRsZXIuc2hpZnQoKSBpZiBldmVudHNbMF0gaXMgJ18nXG5cbiAgICAgICAgICAgIGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgZXZlbnRQYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICBwYXJlbnRQYXRoID0gZXZlbnQuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgIGV2ZW50ID0gcGFyZW50UGF0aC5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHBhcmVudFBhdGgubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGV2ZW50UGFyZW50ID0gQGdldENoaWxkKHBhcmVudFBhdGgsIHBhcmVudFBhdGguam9pbignLicpLCBldmVudFBhcmVudCkpXG5cbiAgICAgICAgICAgICAgICBoYW5kbGVyLmZvckVhY2ggKGhhbmRsZXIpPT5cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyUGFyZW50ID0gQGVudGl0eVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGhhbmRsZXIuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGNoaWxkLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChoYW5kbGVyUGFyZW50ID0gaWYgY2hpbGQubGVuZ3RoIHRoZW4gQGdldENoaWxkKGNoaWxkLCBoYW5kbGVyTmFtZSkgZWxzZSBAZW50aXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXJQYXJlbnRbaGFuZGxlcl1cbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGFkZExpc3RlbmVyIGV2ZW50UGFyZW50LCBldmVudCwgaGFuZGxlciwgaGFuZGxlclBhcmVudFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGZpbmQgaGFuZGxlciBmb3IgXFxcIiN7ZXZlbnR9XFxcIlwiICsgKGlmIGhhbmRsZXJOYW1lIHRoZW4gXCI6IFxcXCIje2hhbmRsZXJOYW1lfVxcXCJcIiBlbHNlICcnKVxuXG4gICAgYWRkSGFuZGxlcnM6IC0+XG4gICAgICAgIEBhZGRIYW5kbGVyIEBlbnRpdHkuaGFuZGxlcnMgaWYgQGVudGl0eS5oYW5kbGVycz8gYW5kICFAZW50aXR5LmRpc2FibGVIYW5kbGVyc1xuXG4gICAgbGF1bmNoOiAoaW5pdEhhbmRsZXJzLCBwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKCkgaWYgaW5pdEhhbmRsZXJzP1xuICAgICAgICBAZW50aXR5LnRyaWdnZXIgJ2xhdW5jaCcsIHBhcmFtcy4uLlxuXG4gICAgcHJlcGFyZXM6IG51bGxcbiAgICBwcmVwYXJlQW5kTGF1bmNoOiAocGFyYW1zKS0+XG4gICAgICAgIEBlbnRpdHkuZmlyc3RMYXVuY2ggPSBAcHJlcGFyZXM/XG5cbiAgICAgICAgaWYgQmFja2JvbmVQcmVwYXJlLmxlbmd0aCBvciBBcnJheS5pc0FycmF5IEBlbnRpdHkucHJlcGFyZVxuICAgICAgICAgICAgdW5sZXNzIEBwcmVwYXJlcz9cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgfHw9IFtdXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlLmNvbmNhdCBAZW50aXR5LnByZXBhcmVcblxuICAgICAgICAgICAgICAgIEBwcmVwYXJlcyA9IEBlbnRpdHkucHJlcGFyZS5tYXAgKChuYW1lKT0+XG4gICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9IGlmIHR5cGVvZiBuYW1lIGlzICdmdW5jdGlvbicgdGhlbiBuYW1lIGVsc2UgQGVudGl0eVtuYW1lXVxuICAgICAgICAgICAgICAgICAgICB1bmxlc3MgdHlwZW9mIHByZXBhcmVGdW5jdGlvbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIlByZXBhcmUgaXRlbSAje25hbWV9IGlzbid0IGZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICBpZiBAcHJlcGFyZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGVudGl0eS5wcm9taXNlID0gQGV4ZWN1dGVDaGFpbihAcHJlcGFyZXMsIHBhcmFtcylcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2VcbiAgICAgICAgICAgICAgICAuZG9uZSg9PlxuICAgICAgICAgICAgICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuZmFpbCgtPlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJCYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmVzIGZhaWw6IFwiLCBAcHJlcGFyZXMpO1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgQGxhdW5jaCBAZW50aXR5LmZpcnN0TGF1bmNoLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICB1bmxlc3MgQGVudGl0eS5ub0JpbmQ/XG4gICAgICAgICAgICBmb3IgbmFtZSwgbWV0aG9kIG9mIEBlbnRpdHkgd2hlbiB0eXBlb2YgbWV0aG9kIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICBAZW50aXR5W25hbWVdID0gbWV0aG9kLmJpbmQgQGVudGl0eVxuICAgICAgICBAZW50aXR5LmFkZEhhbmRsZXIgPSBAYWRkSGFuZGxlci5iaW5kIEBcbiAgICAgICAgQGVudGl0eS5leGVjdXRlQ2hhaW4gPSBAZXhlY3V0ZUNoYWluLmJpbmQgQFxuICAgICAgICBAaGFuZGxlcnMgPSB7fVxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSB1bmxlc3Mgb3B0aW9ucz9cbiAgICBAcHJlcGFyZSA9IGFycmF5RnJvbVN0cmluZyhAcHJlcGFyZSkgaWYgdHlwZW9mIEBwcmVwYXJlIGlzICdzdHJpbmcnXG4gICAgcmV0dXJuIHVubGVzcyB0eXBlb2YgQGhhbmRsZXJzIGlzICdvYmplY3QnIG9yIG9wdGlvbnM/LmF0dGFjaD8gb3IgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJyBvciBBcnJheS5pc0FycmF5KEBwcmVwYXJlKVxuICAgIEBfYmJJbml0aWFsaXplID0gbmV3IEJhY2tib25lSW5pdGlhbGl6ZSBAXG4gICAgQGFkZEhhbmRsZXIoJ2xhdW5jaCcsIEBsYXVuY2gpIGlmIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBAcmVsYXVuY2ggPSA9PlxuICAgICAgICBAX2JiSW5pdGlhbGl6ZS5wcmVwYXJlQW5kTGF1bmNoIHBhcmFtc1xuICAgIEByZWxhdW5jaCgpXG5cbkJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLk5lc3RlZE1vZGVsP1xuICAgIEJhY2tib25lLk5lc3RlZE1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgICBCYWNrYm9uZS5MYXlvdXQucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgTWFyaW9uZXR0ZT9cbiAgICBNYXJpb25ldHRlLk9iamVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG4iXX0=
