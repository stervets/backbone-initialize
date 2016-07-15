(function() {
  var BackboneInitialize, BackbonePrepare, backboneInitialize,
    slice = [].slice;

  BackboneInitialize = (function() {
    BackboneInitialize.prototype.handlers = null;

    BackboneInitialize.prototype.entity = null;

    BackboneInitialize.prototype.arrayFromString = function(string) {
      if (Array.isArray(string)) {
        return string;
      }
      return string.split(',').map(function(item) {
        return item.trim();
      });
    };

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
          this.arrayFromString(events).forEach((function(_this) {
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
          handler = this.arrayFromString(handler);
        }
        if (!Array.isArray(handler)) {
          handler = [handler];
        }
        handler = handler.slice();
        if (events[0] === '_') {
          events = handler.shift();
        }
        return this.arrayFromString(events).forEach((function(_this) {
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
    if (this instanceof Backbone.Collection) {
      options = params[1];
    }
    if (!(typeof this.handlers === 'object' || ((options != null ? options.attach : void 0) != null) || typeof this.launch === 'function')) {
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
      return $.when.apply(null, prepare).then((function(_this) {
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

  if (Backbone.Layout != null) {
    Backbone.Layout.prototype.initialize = backboneInitialize;
  }

  if (typeof Marionette !== "undefined" && Marionette !== null) {
    Marionette.Object.prototype.initialize = backboneInitialize;
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1REFBQTtJQUFBOztFQUFNO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixlQUFBLEdBQWlCLFNBQUMsTUFBRDtNQUNiLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGVBQU8sT0FBUDs7YUFDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7ZUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO01BQVQsQ0FBdEI7SUFGYTs7aUNBSWpCLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsTUFBZDtBQUNOLFVBQUE7O1FBRG9CLFNBQVMsSUFBQyxDQUFBOztNQUM5QixLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBQTtNQUNSLElBQUcscUJBQUg7UUFDVyxJQUFHLElBQUksQ0FBQyxNQUFSO2lCQUFvQixJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFBdUIsTUFBTyxDQUFBLEtBQUEsQ0FBOUIsRUFBcEI7U0FBQSxNQUFBO2lCQUErRCxNQUFPLENBQUEsS0FBQSxFQUF0RTtTQURYO09BQUEsTUFBQTtRQUdJLElBQUMsQ0FBQSxJQUFELENBQVMsS0FBRCxHQUFPLG1CQUFQLEdBQTBCLEtBQTFCLEdBQWdDLEdBQXhDO0FBQ0EsZUFBTyxLQUpYOztJQUZNOztpQ0FRVixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixNQUFsQjtBQUNSLFVBQUE7O1FBRDBCLFNBQVMsSUFBQyxDQUFBOztNQUNwQyxJQUFHLE9BQU8sTUFBUCxLQUFpQixRQUFwQjtBQUNJ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c0IsTUFBdEI7UUFENkI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpDLEVBVko7S0FBQSxNQUFBO2FBYUksUUFBQSxJQUFDLENBQUEsYUFBRCxDQUFjLENBQUMsTUFBZixhQUFzQixNQUF0QixFQWJKOztFQVhpQjs7RUEwQnJCLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQXpCLEdBQXNDOztFQUN0QyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUE5QixHQUEyQzs7RUFDM0MsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBeEIsR0FBcUM7O0VBRXJDLElBQUcsdUJBQUg7SUFDSSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUExQixHQUF1QyxtQkFEM0M7OztFQUdBLElBQUcsd0RBQUg7SUFDSSxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUE1QixHQUF5QyxtQkFEN0M7O0FBekdBIiwiZmlsZSI6ImJhY2tib25lLWluaXRpYWxpemUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBCYWNrYm9uZUluaXRpYWxpemVcbiAgICBoYW5kbGVyczogbnVsbFxuICAgIGVudGl0eTogbnVsbFxuXG4gICAgYXJyYXlGcm9tU3RyaW5nOiAoc3RyaW5nKS0+XG4gICAgICAgIHJldHVybiBzdHJpbmcgaWYgQXJyYXkuaXNBcnJheSBzdHJpbmdcbiAgICAgICAgc3RyaW5nLnNwbGl0KCcsJykubWFwIChpdGVtKS0+IGl0ZW0udHJpbSgpXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIlxuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgICAgICBpZiBwYXJlbnRbY2hpbGRdP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBhdGgubGVuZ3RoIHRoZW4gQGdldENoaWxkKHBhdGgsIGV2ZW50LCBwYXJlbnRbY2hpbGRdKSBlbHNlIHBhcmVudFtjaGlsZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCIje2NoaWxkfSB1bmRlZmluZWQgKHRoaXMuI3tldmVudH0pXCJcbiAgICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICBhZGRIYW5kbGVyOiAoZXZlbnRzLCBoYW5kbGVyLCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGlmIHR5cGVvZiBldmVudHMgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdvYmplY3QnIGFuZCAhKEFycmF5LmlzQXJyYXkoaGFuZGxlcikpXG4gICAgICAgICAgICAgICAgQGFycmF5RnJvbVN0cmluZyhldmVudHMpLmZvckVhY2ggKGV2ZW50KT0+XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCA9IEBnZXRDaGlsZCBldmVudC5zcGxpdCgnLicpLCBldmVudCwgcGFyZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGtleSwgdmFsIG9mIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkSGFuZGxlciBrZXksIHZhbCwgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBhcHBlbmQgaGFuZGxlcnMgdG8gI3tldmVudH0gY2F1c2UgY2hpbGQgbm90IGZvdW5kXCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgaGFuZGxlciA9IEBhcnJheUZyb21TdHJpbmcgaGFuZGxlciBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXSB1bmxlc3MgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpXG4gICAgICAgICAgICBldmVudHMgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRzWzBdIGlzICdfJ1xuXG4gICAgICAgICAgICBAYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICAgICAgICBldmVudFBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGggPSBldmVudC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcGFyZW50UGF0aC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoZXZlbnRQYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIGV2ZW50UGFyZW50KSlcblxuICAgICAgICAgICAgICAgIGhhbmRsZXIuZm9yRWFjaCAoaGFuZGxlcik9PlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJQYXJlbnQgPSBAZW50aXR5XG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyTmFtZSA9IGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gaGFuZGxlci5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gY2hpbGQucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmxlc3MgKGhhbmRsZXJQYXJlbnQgPSBpZiBjaGlsZC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQoY2hpbGQsIGhhbmRsZXJOYW1lKSBlbHNlIEBlbnRpdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlclBhcmVudFtoYW5kbGVyXVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lmxpc3RlblRvIGV2ZW50UGFyZW50LCBldmVudCwgaGFuZGxlci5iaW5kKGhhbmRsZXJQYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgZmluZCBoYW5kbGVyIGZvciBcXFwiI3tldmVudH1cXFwiXCIgKyAoaWYgaGFuZGxlck5hbWUgdGhlbiBcIjogXFxcIiN7aGFuZGxlck5hbWV9XFxcIlwiIGVsc2UgJycpXG5cbiAgICBhZGRIYW5kbGVyczogLT5cbiAgICAgICAgQGFkZEhhbmRsZXIgQGVudGl0eS5oYW5kbGVycyBpZiBAZW50aXR5LmhhbmRsZXJzPyBhbmQgIUBlbnRpdHkuZGlzYWJsZUhhbmRsZXJzXG5cbiAgICBsYXVuY2g6IChwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKClcbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICAgIGNvbnN0cnVjdG9yOiAoQGVudGl0eSktPlxuICAgICAgICBAZW50aXR5LmFkZEhhbmRsZXIgPSBAYWRkSGFuZGxlci5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cblxuXG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuYmFja2JvbmVJbml0aWFsaXplID0gKHBhcmFtcy4uLiktPlxuICAgIG9wdGlvbnMgPSBAb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBwYXJhbXNbMV0gaWYgQCBpbnN0YW5jZW9mIEJhY2tib25lLkNvbGxlY3Rpb25cbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcblxuICAgIEBhZGRIYW5kbGVyKCdsYXVuY2gnLCBAbGF1bmNoKSBpZiB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nXG5cbiAgICBpZiBvcHRpb25zPy5hdHRhY2g/XG4gICAgICAgIEBbbmFtZV0gPSBvYmplY3QgZm9yIG5hbWUsIG9iamVjdCBvZiBvcHRpb25zLmF0dGFjaFxuXG4gICAgaWYgQmFja2JvbmVQcmVwYXJlLmxlbmd0aCBvciBBcnJheS5pc0FycmF5IEBwcmVwYXJlXG4gICAgICAgIEBwcmVwYXJlIHx8PSBbXVxuICAgICAgICBAcHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZS5jb25jYXQgQHByZXBhcmVcbiAgICAgICAgcHJlcGFyZSA9IEBwcmVwYXJlLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9IGlmIHR5cGVvZiBuYW1lIGlzICdmdW5jdGlvbicgdGhlbiBuYW1lIGVsc2UgQFtuYW1lXVxuICAgICAgICAgICAgdW5sZXNzIHR5cGVvZiBwcmVwYXJlRnVuY3Rpb24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBfYmJJbml0aWFsaXplLndhcm4gXCJQcmVwYXJlIGl0ZW0gI3tuYW1lfSBpc24ndCBmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gJC5ub29wO1xuICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uLmFwcGx5IEAsIHBhcmFtc1xuICAgICAgICApXG4gICAgICAgICQud2hlbi5hcHBseShudWxsLCBwcmVwYXJlKS50aGVuID0+XG4gICAgICAgICAgICBAX2JiSW5pdGlhbGl6ZS5sYXVuY2ggcGFyYW1zLi4uXG4gICAgZWxzZVxuICAgICAgICBAX2JiSW5pdGlhbGl6ZS5sYXVuY2ggcGFyYW1zLi4uXG5cbkJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgICBCYWNrYm9uZS5MYXlvdXQucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgTWFyaW9uZXR0ZT9cbiAgICBNYXJpb25ldHRlLk9iamVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG4iXX0=
