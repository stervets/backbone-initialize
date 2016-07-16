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
    if (this instanceof Backbone.Collection) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx3RUFBQTtJQUFBOztFQUFBLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFNBQUMsSUFBRDthQUFTLElBQUksQ0FBQyxJQUFMLENBQUE7SUFBVCxDQUF0QjtFQUZjOztFQUlaO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixJQUFBLEdBQU0sU0FBQyxPQUFEO2FBQ0YsT0FBTyxDQUFDLElBQVIsQ0FBYSw0QkFBQSxHQUE2QixPQUExQztJQURFOztpQ0FHTixRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE1BQWQ7QUFDTixVQUFBOztRQURvQixTQUFTLElBQUMsQ0FBQTs7TUFDOUIsS0FBQSxHQUFRLElBQUksQ0FBQyxLQUFMLENBQUE7TUFDUixJQUFHLHFCQUFIO1FBQ1csSUFBRyxJQUFJLENBQUMsTUFBUjtpQkFBb0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQWdCLEtBQWhCLEVBQXVCLE1BQU8sQ0FBQSxLQUFBLENBQTlCLEVBQXBCO1NBQUEsTUFBQTtpQkFBK0QsTUFBTyxDQUFBLEtBQUEsRUFBdEU7U0FEWDtPQUFBLE1BQUE7UUFHSSxJQUFDLENBQUEsSUFBRCxDQUFTLEtBQUQsR0FBTyxtQkFBUCxHQUEwQixLQUExQixHQUFnQyxHQUF4QztBQUNBLGVBQU8sS0FKWDs7SUFGTTs7aUNBUVYsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsTUFBbEI7QUFDUixVQUFBOztRQUQwQixTQUFTLElBQUMsQ0FBQTs7TUFDcEMsSUFBRyxPQUFPLE1BQVAsS0FBaUIsUUFBcEI7QUFDSTth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LENBQUMsS0FBUCxDQUFhLElBQWIsRUFBbUIsT0FBbkIsQ0FBMkIsQ0FBQyxJQUE1QixDQUFpQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDeEMsY0FBQTtpQkFBQSxRQUFBLEtBQUMsQ0FBQSxhQUFELENBQWMsQ0FBQyxNQUFmLGFBQXNCLE1BQXRCO1FBRHdDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQyxFQVZmO0tBQUEsTUFBQTthQWFJLFFBQUEsSUFBQyxDQUFBLGFBQUQsQ0FBYyxDQUFDLE1BQWYsYUFBc0IsTUFBdEIsRUFiSjs7RUFYaUI7O0VBMEJyQixRQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUF6QixHQUFzQzs7RUFDdEMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBOUIsR0FBMkM7O0VBQzNDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQXhCLEdBQXFDOztFQUVyQyxJQUFHLDRCQUFIO0lBQ0ksUUFBUSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBL0IsR0FBNEMsbUJBRGhEOzs7RUFHQSxJQUFHLHVCQUFIO0lBQ0ksUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBMUIsR0FBdUMsbUJBRDNDOzs7RUFHQSxJQUFHLHdEQUFIO0lBQ0ksVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBNUIsR0FBeUMsbUJBRDdDOztBQTVHQSIsImZpbGUiOiJiYWNrYm9uZS1pbml0aWFsaXplLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiYXJyYXlGcm9tU3RyaW5nID0gKHN0cmluZyktPlxuICAgIHJldHVybiBzdHJpbmcgaWYgQXJyYXkuaXNBcnJheSBzdHJpbmdcbiAgICBzdHJpbmcuc3BsaXQoJywnKS5tYXAgKGl0ZW0pLT4gaXRlbS50cmltKClcblxuY2xhc3MgQmFja2JvbmVJbml0aWFsaXplXG4gICAgaGFuZGxlcnM6IG51bGxcbiAgICBlbnRpdHk6IG51bGxcblxuICAgIHdhcm46IChtZXNzYWdlKS0+XG4gICAgICAgIGNvbnNvbGUud2FybiBcIkJhY2tib25lLWluaXRpYWxpemUgd2FybjogI3ttZXNzYWdlfVwiXG5cbiAgICBnZXRDaGlsZDogKHBhdGgsIGV2ZW50LCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGNoaWxkID0gcGF0aC5zaGlmdCgpXG4gICAgICAgIGlmIHBhcmVudFtjaGlsZF0/XG4gICAgICAgICAgICByZXR1cm4gaWYgcGF0aC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQocGF0aCwgZXZlbnQsIHBhcmVudFtjaGlsZF0pIGVsc2UgcGFyZW50W2NoaWxkXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd2FybiBcIiN7Y2hpbGR9IHVuZGVmaW5lZCAodGhpcy4je2V2ZW50fSlcIlxuICAgICAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIGFkZEhhbmRsZXI6IChldmVudHMsIGhhbmRsZXIsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgaWYgdHlwZW9mIGV2ZW50cyBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgQGFkZEhhbmRsZXIoa2V5LCB2YWx1ZSwgcGFyZW50KSBmb3Iga2V5LCB2YWx1ZSBvZiBldmVudHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrZXksIHZhbCBvZiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZEhhbmRsZXIga2V5LCB2YWwsIGNoaWxkXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgYXBwZW5kIGhhbmRsZXJzIHRvICN7ZXZlbnR9IGNhdXNlIGNoaWxkIG5vdCBmb3VuZFwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIGhhbmRsZXIgPSBhcnJheUZyb21TdHJpbmcgaGFuZGxlciBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXSB1bmxlc3MgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpXG4gICAgICAgICAgICBldmVudHMgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRzWzBdIGlzICdfJ1xuXG4gICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgIGV2ZW50UGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICBldmVudCA9IHBhcmVudFBhdGgucG9wKClcbiAgICAgICAgICAgICAgICBpZiBwYXJlbnRQYXRoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChldmVudFBhcmVudCA9IEBnZXRDaGlsZChwYXJlbnRQYXRoLCBwYXJlbnRQYXRoLmpvaW4oJy4nKSwgZXZlbnRQYXJlbnQpKVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5mb3JFYWNoIChoYW5kbGVyKT0+XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBoYW5kbGVyLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBjaGlsZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoaGFuZGxlclBhcmVudCA9IGlmIGNoaWxkLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChjaGlsZCwgaGFuZGxlck5hbWUpIGVsc2UgQGVudGl0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyUGFyZW50W2hhbmRsZXJdXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBlbnRpdHkubGlzdGVuVG8gZXZlbnRQYXJlbnQsIGV2ZW50LCBoYW5kbGVyLmJpbmQoaGFuZGxlclBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICAgIGFkZEhhbmRsZXJzOiAtPlxuICAgICAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICAgIGxhdW5jaDogKHBhcmFtcy4uLiktPlxuICAgICAgICBAYWRkSGFuZGxlcnMoKVxuICAgICAgICBAZW50aXR5LnRyaWdnZXIgJ2xhdW5jaCcsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIEBlbnRpdHkuYWRkSGFuZGxlciA9IEBhZGRIYW5kbGVyLmJpbmQgQFxuICAgICAgICBAaGFuZGxlcnMgPSB7fVxuXG5cbkBCYWNrYm9uZVByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUgPSBbXVxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSBpZiBAIGluc3RhbmNlb2YgQmFja2JvbmUuQ29sbGVjdGlvblxuICAgIEBwcmVwYXJlID0gYXJyYXlGcm9tU3RyaW5nKEBwcmVwYXJlKSBpZiB0eXBlb2YgQHByZXBhcmUgaXMgJ3N0cmluZydcbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcbiAgICBAYWRkSGFuZGxlcignbGF1bmNoJywgQGxhdW5jaCkgaWYgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJ1xuXG4gICAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgICAgICBAW25hbWVdID0gb2JqZWN0IGZvciBuYW1lLCBvYmplY3Qgb2Ygb3B0aW9ucy5hdHRhY2hcblxuICAgIGlmIEJhY2tib25lUHJlcGFyZS5sZW5ndGggb3IgQXJyYXkuaXNBcnJheSBAcHJlcGFyZVxuICAgICAgICBAcHJlcGFyZSB8fD0gW11cbiAgICAgICAgQHByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUuY29uY2F0IEBwcmVwYXJlXG4gICAgICAgIHByZXBhcmUgPSBAcHJlcGFyZS5tYXAgKChuYW1lKT0+XG4gICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSBpZiB0eXBlb2YgbmFtZSBpcyAnZnVuY3Rpb24nIHRoZW4gbmFtZSBlbHNlIEBbbmFtZV1cbiAgICAgICAgICAgIHVubGVzcyB0eXBlb2YgcHJlcGFyZUZ1bmN0aW9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICBAX2JiSW5pdGlhbGl6ZS53YXJuIFwiUHJlcGFyZSBpdGVtICN7bmFtZX0gaXNuJ3QgZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbiA9ICQubm9vcDtcbiAgICAgICAgICAgIHByZXBhcmVGdW5jdGlvbi5hcHBseSBALCBwYXJhbXNcbiAgICAgICAgKVxuICAgICAgICBAcHJvbWlzZSA9ICQud2hlbi5hcHBseShudWxsLCBwcmVwYXJlKS50aGVuID0+XG4gICAgICAgICAgICBAX2JiSW5pdGlhbGl6ZS5sYXVuY2ggcGFyYW1zLi4uXG4gICAgZWxzZVxuICAgICAgICBAX2JiSW5pdGlhbGl6ZS5sYXVuY2ggcGFyYW1zLi4uXG5cbkJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5CYWNrYm9uZS5WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLk5lc3RlZE1vZGVsP1xuICAgIEJhY2tib25lLk5lc3RlZE1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgICBCYWNrYm9uZS5MYXlvdXQucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgTWFyaW9uZXR0ZT9cbiAgICBNYXJpb25ldHRlLk9iamVjdC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG4iXX0=
