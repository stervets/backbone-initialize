(function() {
  var BackboneInitialize, BackbonePrepare, arrayFromString, backboneInitialize, executeDeferredChain,
    slice = [].slice;

  arrayFromString = function(string) {
    if (Array.isArray(string)) {
      return string;
    }
    return string.split(',').map(function(item) {
      return item.trim();
    });
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
                return _this.entity.listenTo(eventParent, event, handler.bind(handlerParent));
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
      var params, ref;
      params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.addHandlers();
      return (ref = this.entity).trigger.apply(ref, ['launch'].concat(slice.call(params)));
    };

    function BackboneInitialize(entity) {
      var method, name, ref;
      this.entity = entity;
      this.entity.addHandler = this.addHandler.bind(this);
      if (this.entity.noBind == null) {
        ref = this.entity;
        for (name in ref) {
          method = ref[name];
          if (typeof method === 'function') {
            this.entity[name] = method.bind(this.entity);
          }
        }
      }
      this.handlers = {};
    }

    return BackboneInitialize;

  })();

  this.BackbonePrepare = BackbonePrepare = [];

  executeDeferredChain = function(prepare, params, context, defer) {
    var promise;
    promise = prepare.shift();
    return $.when(promise.apply(context, params)).then(function() {
      if (prepare.length) {
        return executeDeferredChain(prepare, params, context, defer);
      } else {
        return defer.resolve();
      }
    });
  };

  backboneInitialize = function() {
    var defer, name, object, options, params, prepare, ref, ref1;
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
    if (BackbonePrepare.length || Array.isArray(this.prepare)) {
      this.prepare || (this.prepare = []);
      this.prepare = BackbonePrepare.concat(this.prepare);
      prepare = this.prepare.map(((function(_this) {
        return function(name) {
          var prepareFunction;
          prepareFunction = typeof name === 'function' ? name : _this[name];
          if (typeof prepareFunction !== 'function') {
            _this._bbInitialize.warn("Prepare item " + name + " isn't function");
            prepareFunction = $.noop;
          }
          return prepareFunction;
        };
      })(this)));
      defer = $.Deferred();
      defer.then((function(_this) {
        return function() {
          var ref1;
          return (ref1 = _this._bbInitialize).launch.apply(ref1, params);
        };
      })(this));
      executeDeferredChain(prepare, params, this, defer);
      return this.promise = defer.promise();
    } else {
      return (ref1 = this._bbInitialize).launch.apply(ref1, params);
    }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4RkFBQTtJQUFBOztFQUFBLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFNBQUMsSUFBRDthQUFTLElBQUksQ0FBQyxJQUFMLENBQUE7SUFBVCxDQUF0QjtFQUZjOztFQUlaO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixJQUFBLEdBQU0sU0FBQyxPQUFEO2FBQ0YsT0FBTyxDQUFDLElBQVIsQ0FBYSw0QkFBQSxHQUE2QixPQUExQztJQURFOztpQ0FHTixRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE1BQWQ7QUFDTixVQUFBOztRQURvQixTQUFTLElBQUMsQ0FBQTs7TUFDOUIsS0FBQSxHQUFRLElBQUksQ0FBQyxLQUFMLENBQUE7TUFDUixJQUFHLHFCQUFIO1FBQ1csSUFBRyxJQUFJLENBQUMsTUFBUjtpQkFBb0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQWdCLEtBQWhCLEVBQXVCLE1BQU8sQ0FBQSxLQUFBLENBQTlCLEVBQXBCO1NBQUEsTUFBQTtpQkFBK0QsTUFBTyxDQUFBLEtBQUEsRUFBdEU7U0FEWDtPQUFBLE1BQUE7UUFHSSxJQUFDLENBQUEsSUFBRCxDQUFTLEtBQUQsR0FBTyxtQkFBUCxHQUEwQixLQUExQixHQUFnQyxHQUF4QztBQUNBLGVBQU8sS0FKWDs7SUFGTTs7aUNBUVYsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsTUFBbEI7QUFDUixVQUFBOztRQUQwQixTQUFTLElBQUMsQ0FBQTs7TUFDcEMsSUFBRyxPQUFPLE1BQVAsS0FBaUIsUUFBcEI7QUFDSTth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SSxDQUFDLFNBQVMsQ0FBQyxVQUF4QixHQUFxQzs7RUFFckMsSUFBRyw0QkFBSDtJQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQS9CLEdBQTRDLG1CQURoRDs7O0VBR0EsSUFBRyx1QkFBSDtJQUNJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUQzQzs7O0VBR0EsSUFBRyx3REFBSDtJQUNJLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQ3Qzs7QUE1SEEiLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbImFycmF5RnJvbVN0cmluZyA9IChzdHJpbmcpLT5cbiAgICByZXR1cm4gc3RyaW5nIGlmIEFycmF5LmlzQXJyYXkgc3RyaW5nXG4gICAgc3RyaW5nLnNwbGl0KCcsJykubWFwIChpdGVtKS0+IGl0ZW0udHJpbSgpXG5cbmNsYXNzIEJhY2tib25lSW5pdGlhbGl6ZVxuICAgIGhhbmRsZXJzOiBudWxsXG4gICAgZW50aXR5OiBudWxsXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIlxuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgICAgICBpZiBwYXJlbnRbY2hpbGRdP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBhdGgubGVuZ3RoIHRoZW4gQGdldENoaWxkKHBhdGgsIGV2ZW50LCBwYXJlbnRbY2hpbGRdKSBlbHNlIHBhcmVudFtjaGlsZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCIje2NoaWxkfSB1bmRlZmluZWQgKHRoaXMuI3tldmVudH0pXCJcbiAgICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICBhZGRIYW5kbGVyOiAoZXZlbnRzLCBoYW5kbGVyLCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGlmIHR5cGVvZiBldmVudHMgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdvYmplY3QnIGFuZCAhKEFycmF5LmlzQXJyYXkoaGFuZGxlcikpXG4gICAgICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkID0gQGdldENoaWxkIGV2ZW50LnNwbGl0KCcuJyksIGV2ZW50LCBwYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3Iga2V5LCB2YWwgb2YgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRIYW5kbGVyIGtleSwgdmFsLCBjaGlsZFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGFwcGVuZCBoYW5kbGVycyB0byAje2V2ZW50fSBjYXVzZSBjaGlsZCBub3QgZm91bmRcIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBoYW5kbGVyID0gYXJyYXlGcm9tU3RyaW5nIGhhbmRsZXIgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl0gdW5sZXNzIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKVxuICAgICAgICAgICAgZXZlbnRzID0gaGFuZGxlci5zaGlmdCgpIGlmIGV2ZW50c1swXSBpcyAnXydcblxuICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICBldmVudFBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGggPSBldmVudC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcGFyZW50UGF0aC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoZXZlbnRQYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIGV2ZW50UGFyZW50KSlcblxuICAgICAgICAgICAgICAgIGhhbmRsZXIuZm9yRWFjaCAoaGFuZGxlcik9PlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJQYXJlbnQgPSBAZW50aXR5XG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gaGFuZGxlci5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gY2hpbGQucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGhhbmRsZXJQYXJlbnQgPSBpZiBjaGlsZC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQoY2hpbGQsIGhhbmRsZXJOYW1lKSBlbHNlIEBlbnRpdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlclBhcmVudFtoYW5kbGVyXVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lmxpc3RlblRvIGV2ZW50UGFyZW50LCBldmVudCwgaGFuZGxlci5iaW5kKGhhbmRsZXJQYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgZmluZCBoYW5kbGVyIGZvciBcXFwiI3tldmVudH1cXFwiXCIgKyAoaWYgaGFuZGxlck5hbWUgdGhlbiBcIjogXFxcIiN7aGFuZGxlck5hbWV9XFxcIlwiIGVsc2UgJycpXG5cbiAgICBhZGRIYW5kbGVyczogLT5cbiAgICAgICAgQGFkZEhhbmRsZXIgQGVudGl0eS5oYW5kbGVycyBpZiBAZW50aXR5LmhhbmRsZXJzPyBhbmQgIUBlbnRpdHkuZGlzYWJsZUhhbmRsZXJzXG5cbiAgICBsYXVuY2g6IChwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKClcbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICBAZW50aXR5LmFkZEhhbmRsZXIgPSBAYWRkSGFuZGxlci5iaW5kIEBcbiAgICAgICAgdW5sZXNzIEBlbnRpdHkubm9CaW5kP1xuICAgICAgICAgICAgZm9yIG5hbWUsIG1ldGhvZCBvZiBAZW50aXR5IHdoZW4gdHlwZW9mIG1ldGhvZCBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgQGVudGl0eVtuYW1lXSA9IG1ldGhvZC5iaW5kIEBlbnRpdHlcbiAgICAgICAgQGhhbmRsZXJzID0ge31cblxuXG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuZXhlY3V0ZURlZmVycmVkQ2hhaW4gPSAocHJlcGFyZSwgcGFyYW1zLCBjb250ZXh0LCBkZWZlciktPlxuICAgIHByb21pc2UgPSBwcmVwYXJlLnNoaWZ0KClcbiAgICAkLndoZW4ocHJvbWlzZS5hcHBseShjb250ZXh0LCBwYXJhbXMpKS50aGVuIC0+XG4gICAgICAgICAgICBpZiBwcmVwYXJlLmxlbmd0aFxuICAgICAgICAgICAgICAgIGV4ZWN1dGVEZWZlcnJlZENoYWluIHByZXBhcmUsIHBhcmFtcywgY29udGV4dCwgZGVmZXJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKClcblxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSB1bmxlc3Mgb3B0aW9ucz9cbiAgICBAcHJlcGFyZSA9IGFycmF5RnJvbVN0cmluZyhAcHJlcGFyZSkgaWYgdHlwZW9mIEBwcmVwYXJlIGlzICdzdHJpbmcnXG4gICAgcmV0dXJuIHVubGVzcyB0eXBlb2YgQGhhbmRsZXJzIGlzICdvYmplY3QnIG9yIG9wdGlvbnM/LmF0dGFjaD8gb3IgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJyBvciBBcnJheS5pc0FycmF5KEBwcmVwYXJlKVxuICAgIEBfYmJJbml0aWFsaXplID0gbmV3IEJhY2tib25lSW5pdGlhbGl6ZSBAXG4gICAgQGFkZEhhbmRsZXIoJ2xhdW5jaCcsIEBsYXVuY2gpIGlmIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBpZiBCYWNrYm9uZVByZXBhcmUubGVuZ3RoIG9yIEFycmF5LmlzQXJyYXkgQHByZXBhcmVcbiAgICAgICAgQHByZXBhcmUgfHw9IFtdXG4gICAgICAgIEBwcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlLmNvbmNhdCBAcHJlcGFyZVxuICAgICAgICBwcmVwYXJlID0gQHByZXBhcmUubWFwICgobmFtZSk9PlxuICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAW25hbWVdXG4gICAgICAgICAgICB1bmxlc3MgdHlwZW9mIHByZXBhcmVGdW5jdGlvbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgQF9iYkluaXRpYWxpemUud2FybiBcIlByZXBhcmUgaXRlbSAje25hbWV9IGlzbid0IGZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSAkLm5vb3A7XG4gICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb25cbiAgICAgICAgKVxuXG4gICAgICAgIGRlZmVyID0gJC5EZWZlcnJlZCgpXG4gICAgICAgIGRlZmVyLnRoZW4gPT5cbiAgICAgICAgICAgIEBfYmJJbml0aWFsaXplLmxhdW5jaCBwYXJhbXMuLi5cbiAgICAgICAgZXhlY3V0ZURlZmVycmVkQ2hhaW4gcHJlcGFyZSwgcGFyYW1zLCBALCBkZWZlclxuICAgICAgICBAcHJvbWlzZSA9IGRlZmVyLnByb21pc2UoKVxuICAgIGVsc2VcbiAgICAgICAgQF9iYkluaXRpYWxpemUubGF1bmNoIHBhcmFtcy4uLlxuXG5CYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuQmFja2JvbmUuVmlldy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBCYWNrYm9uZS5OZXN0ZWRNb2RlbD9cbiAgICBCYWNrYm9uZS5OZXN0ZWRNb2RlbC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBCYWNrYm9uZS5MYXlvdXQ/XG4gICAgQmFja2JvbmUuTGF5b3V0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIE1hcmlvbmV0dGU/XG4gICAgTWFyaW9uZXR0ZS5PYmplY3QucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuIl19
