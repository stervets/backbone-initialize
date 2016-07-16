(function() {
  var BackboneInitialize, BackbonePrepare, arrayFromString, backboneInitialize,
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
      this.entity = entity;
      this.entity.addHandler = this.addHandler.bind(this);
      this.handlers = {};
    }

    return BackboneInitialize;

  })();

  this.BackbonePrepare = BackbonePrepare = [];

  backboneInitialize = function() {
    var name, object, options, params, prepare, ref, ref1;
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
          return prepareFunction.apply(_this, params);
        };
      })(this)));
      return this.promise = $.when.apply(null, prepare).then((function(_this) {
        return function() {
          var ref1;
          return (ref1 = _this._bbInitialize).launch.apply(ref1, params);
        };
      })(this));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx3RUFBQTtJQUFBOztFQUFBLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFNBQUMsSUFBRDthQUFTLElBQUksQ0FBQyxJQUFMLENBQUE7SUFBVCxDQUF0QjtFQUZjOztFQUlaO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixJQUFBLEdBQU0sU0FBQyxPQUFEO2FBQ0YsT0FBTyxDQUFDLElBQVIsQ0FBYSw0QkFBQSxHQUE2QixPQUExQztJQURFOztpQ0FHTixRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE1BQWQ7QUFDTixVQUFBOztRQURvQixTQUFTLElBQUMsQ0FBQTs7TUFDOUIsS0FBQSxHQUFRLElBQUksQ0FBQyxLQUFMLENBQUE7TUFDUixJQUFHLHFCQUFIO1FBQ1csSUFBRyxJQUFJLENBQUMsTUFBUjtpQkFBb0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQWdCLEtBQWhCLEVBQXVCLE1BQU8sQ0FBQSxLQUFBLENBQTlCLEVBQXBCO1NBQUEsTUFBQTtpQkFBK0QsTUFBTyxDQUFBLEtBQUEsRUFBdEU7U0FEWDtPQUFBLE1BQUE7UUFHSSxJQUFDLENBQUEsSUFBRCxDQUFTLEtBQUQsR0FBTyxtQkFBUCxHQUEwQixLQUExQixHQUFnQyxHQUF4QztBQUNBLGVBQU8sS0FKWDs7SUFGTTs7aUNBUVYsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsTUFBbEI7QUFDUixVQUFBOztRQUQwQixTQUFTLElBQUMsQ0FBQTs7TUFDcEMsSUFBRyxPQUFPLE1BQVAsS0FBaUIsUUFBcEI7QUFDSTth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LEVBQW1CLE9BQW5CLENBQTJCLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ3hDLGNBQUE7aUJBQUEsUUFBQSxLQUFDLENBQUEsYUFBRCxDQUFjLENBQUMsTUFBZixhQUFzQixNQUF0QjtRQUR3QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakMsRUFWZjtLQUFBLE1BQUE7YUFhSSxRQUFBLElBQUMsQ0FBQSxhQUFELENBQWMsQ0FBQyxNQUFmLGFBQXNCLE1BQXRCLEVBYko7O0VBWGlCOztFQTBCckIsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBekIsR0FBc0M7O0VBQ3RDLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQTlCLEdBQTJDOztFQUMzQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUF4QixHQUFxQzs7RUFFckMsSUFBRyw0QkFBSDtJQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQS9CLEdBQTRDLG1CQURoRDs7O0VBR0EsSUFBRyx1QkFBSDtJQUNJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUQzQzs7O0VBR0EsSUFBRyx3REFBSDtJQUNJLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQ3Qzs7QUE1R0EiLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbImFycmF5RnJvbVN0cmluZyA9IChzdHJpbmcpLT5cbiAgICByZXR1cm4gc3RyaW5nIGlmIEFycmF5LmlzQXJyYXkgc3RyaW5nXG4gICAgc3RyaW5nLnNwbGl0KCcsJykubWFwIChpdGVtKS0+IGl0ZW0udHJpbSgpXG5cbmNsYXNzIEJhY2tib25lSW5pdGlhbGl6ZVxuICAgIGhhbmRsZXJzOiBudWxsXG4gICAgZW50aXR5OiBudWxsXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIlxuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgICAgICBpZiBwYXJlbnRbY2hpbGRdP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBhdGgubGVuZ3RoIHRoZW4gQGdldENoaWxkKHBhdGgsIGV2ZW50LCBwYXJlbnRbY2hpbGRdKSBlbHNlIHBhcmVudFtjaGlsZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCIje2NoaWxkfSB1bmRlZmluZWQgKHRoaXMuI3tldmVudH0pXCJcbiAgICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICBhZGRIYW5kbGVyOiAoZXZlbnRzLCBoYW5kbGVyLCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGlmIHR5cGVvZiBldmVudHMgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdvYmplY3QnIGFuZCAhKEFycmF5LmlzQXJyYXkoaGFuZGxlcikpXG4gICAgICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkID0gQGdldENoaWxkIGV2ZW50LnNwbGl0KCcuJyksIGV2ZW50LCBwYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3Iga2V5LCB2YWwgb2YgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRIYW5kbGVyIGtleSwgdmFsLCBjaGlsZFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGFwcGVuZCBoYW5kbGVycyB0byAje2V2ZW50fSBjYXVzZSBjaGlsZCBub3QgZm91bmRcIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBoYW5kbGVyID0gYXJyYXlGcm9tU3RyaW5nIGhhbmRsZXIgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl0gdW5sZXNzIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKVxuICAgICAgICAgICAgZXZlbnRzID0gaGFuZGxlci5zaGlmdCgpIGlmIGV2ZW50c1swXSBpcyAnXydcblxuICAgICAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICBldmVudFBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGggPSBldmVudC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcGFyZW50UGF0aC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoZXZlbnRQYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIGV2ZW50UGFyZW50KSlcblxuICAgICAgICAgICAgICAgIGhhbmRsZXIuZm9yRWFjaCAoaGFuZGxlcik9PlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJQYXJlbnQgPSBAZW50aXR5XG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gaGFuZGxlci5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gY2hpbGQucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGhhbmRsZXJQYXJlbnQgPSBpZiBjaGlsZC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQoY2hpbGQsIGhhbmRsZXJOYW1lKSBlbHNlIEBlbnRpdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlclBhcmVudFtoYW5kbGVyXVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lmxpc3RlblRvIGV2ZW50UGFyZW50LCBldmVudCwgaGFuZGxlci5iaW5kKGhhbmRsZXJQYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgZmluZCBoYW5kbGVyIGZvciBcXFwiI3tldmVudH1cXFwiXCIgKyAoaWYgaGFuZGxlck5hbWUgdGhlbiBcIjogXFxcIiN7aGFuZGxlck5hbWV9XFxcIlwiIGVsc2UgJycpXG5cbiAgICBhZGRIYW5kbGVyczogLT5cbiAgICAgICAgQGFkZEhhbmRsZXIgQGVudGl0eS5oYW5kbGVycyBpZiBAZW50aXR5LmhhbmRsZXJzPyBhbmQgIUBlbnRpdHkuZGlzYWJsZUhhbmRsZXJzXG5cbiAgICBsYXVuY2g6IChwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKClcbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICBAZW50aXR5LmFkZEhhbmRsZXIgPSBAYWRkSGFuZGxlci5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cblxuXG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuYmFja2JvbmVJbml0aWFsaXplID0gKHBhcmFtcy4uLiktPlxuICAgIG9wdGlvbnMgPSBAb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBwYXJhbXNbMV0gdW5sZXNzIG9wdGlvbnM/XG4gICAgQHByZXBhcmUgPSBhcnJheUZyb21TdHJpbmcoQHByZXBhcmUpIGlmIHR5cGVvZiBAcHJlcGFyZSBpcyAnc3RyaW5nJ1xuICAgIHJldHVybiB1bmxlc3MgdHlwZW9mIEBoYW5kbGVycyBpcyAnb2JqZWN0JyBvciBvcHRpb25zPy5hdHRhY2g/IG9yIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbicgb3IgQXJyYXkuaXNBcnJheShAcHJlcGFyZSlcbiAgICBAX2JiSW5pdGlhbGl6ZSA9IG5ldyBCYWNrYm9uZUluaXRpYWxpemUgQFxuICAgIEBhZGRIYW5kbGVyKCdsYXVuY2gnLCBAbGF1bmNoKSBpZiB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nXG5cbiAgICBpZiBvcHRpb25zPy5hdHRhY2g/XG4gICAgICAgIEBbbmFtZV0gPSBvYmplY3QgZm9yIG5hbWUsIG9iamVjdCBvZiBvcHRpb25zLmF0dGFjaFxuXG4gICAgaWYgQmFja2JvbmVQcmVwYXJlLmxlbmd0aCBvciBBcnJheS5pc0FycmF5IEBwcmVwYXJlXG4gICAgICAgIEBwcmVwYXJlIHx8PSBbXVxuICAgICAgICBAcHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZS5jb25jYXQgQHByZXBhcmVcbiAgICAgICAgcHJlcGFyZSA9IEBwcmVwYXJlLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9IGlmIHR5cGVvZiBuYW1lIGlzICdmdW5jdGlvbicgdGhlbiBuYW1lIGVsc2UgQFtuYW1lXVxuICAgICAgICAgICAgdW5sZXNzIHR5cGVvZiBwcmVwYXJlRnVuY3Rpb24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBfYmJJbml0aWFsaXplLndhcm4gXCJQcmVwYXJlIGl0ZW0gI3tuYW1lfSBpc24ndCBmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gJC5ub29wO1xuICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uLmFwcGx5IEAsIHBhcmFtc1xuICAgICAgICApXG4gICAgICAgIEBwcm9taXNlID0gJC53aGVuLmFwcGx5KG51bGwsIHByZXBhcmUpLnRoZW4gPT5cbiAgICAgICAgICAgIEBfYmJJbml0aWFsaXplLmxhdW5jaCBwYXJhbXMuLi5cbiAgICBlbHNlXG4gICAgICAgIEBfYmJJbml0aWFsaXplLmxhdW5jaCBwYXJhbXMuLi5cblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gICAgQmFja2JvbmUuTmVzdGVkTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
