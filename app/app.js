(function() {
  var Application, ApplicationLayout, SetTranslations, TRANSLATION, TodoCollection, TodoCollectionView, TodoItem, TodoItemView, language, setTranslations,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  language = 'en';

  TRANSLATION = {
    en: {
      todoList: 'To do list',
      deleteItem: 'Delete item',
      item: 'Item',
      addItem: 'Add item',
      changeLanguage: 'Change language'
    },
    de: {
      todoList: 'Aufgabenliste',
      deleteItem: 'Element löschen',
      item: 'Artikel',
      addItem: 'Artikel hinzufügen',
      changeLanguage: 'Sprache ändern'
    }
  };


  /*
      To-do item model
   */

  TodoItem = (function(superClass) {
    extend(TodoItem, superClass);

    function TodoItem() {
      return TodoItem.__super__.constructor.apply(this, arguments);
    }

    TodoItem.prototype.defaults = {
      title: '',
      checked: ''
    };

    TodoItem.prototype.translationImport = ['item'];

    TodoItem.prototype.onLanguageChanged = function() {
      return this.set('title', this.translation.item + " #" + this.cid);
    };

    TodoItem.prototype.launch = function() {};

    return TodoItem;

  })(Backbone.Model);


  /*
      To-do collection
   */

  TodoCollection = (function(superClass) {
    extend(TodoCollection, superClass);

    function TodoCollection() {
      return TodoCollection.__super__.constructor.apply(this, arguments);
    }

    TodoCollection.prototype.model = TodoItem;

    return TodoCollection;

  })(Backbone.Collection);


  /*
      To-do item view
   */

  TodoItemView = (function(superClass) {
    extend(TodoItemView, superClass);

    function TodoItemView() {
      return TodoItemView.__super__.constructor.apply(this, arguments);
    }

    TodoItemView.prototype.template = '#jsTodoItemView';

    TodoItemView.prototype.ui = {
      checkbox: '.jsCheckbox',
      deleteButton: '.jsDeleteItem'
    };

    TodoItemView.prototype.translationImport = ['deleteItem'];

    TodoItemView.prototype.events = {
      'click @ui.deleteButton': 'deleteItem',
      'click @ui.jsCheckbox': 'onCheckboxClick',
      'click': 'onItemClick'
    };

    TodoItemView.prototype.handlers = {
      'model.change': 'render'
    };

    TodoItemView.prototype.deleteItem = function() {
      return this.model.destroy();
    };

    TodoItemView.prototype.onItemClick = function() {
      return this.model.set('checked', this.model.get('checked') === 'checked' ? '' : 'checked');
    };

    return TodoItemView;

  })(Marionette.ItemView);


  /*
      To-do collection view
   */

  TodoCollectionView = (function(superClass) {
    extend(TodoCollectionView, superClass);

    function TodoCollectionView() {
      return TodoCollectionView.__super__.constructor.apply(this, arguments);
    }

    TodoCollectionView.prototype.template = '#jsTodoCollectionView';

    TodoCollectionView.prototype.childView = TodoItemView;

    TodoCollectionView.prototype.childViewContainer = '.jsTodoListContainer';

    TodoCollectionView.prototype.translationImport = ['todoList', 'addItem', 'changeLanguage'];

    TodoCollectionView.prototype.ui = {
      addItem: '.jsAddItem',
      changeLanguage: '.jsChangeLanguage'
    };

    TodoCollectionView.prototype.events = {
      'click @ui.addItem': 'onAddItemClick',
      'click @ui.changeLanguage': 'onChangeLanguageClick'
    };

    TodoCollectionView.prototype.onAddItemClick = function() {
      return this.collection.add({});
    };

    TodoCollectionView.prototype.onChangeLanguageClick = function() {
      language = language === 'en' ? 'de' : 'en';
      this.collection.trigger('changeLanguage', language);
      return this.application.trigger('changeLanguage', language);
    };

    return TodoCollectionView;

  })(Marionette.CompositeView);


  /*
      Application layout
   */

  ApplicationLayout = (function(superClass) {
    extend(ApplicationLayout, superClass);

    function ApplicationLayout() {
      return ApplicationLayout.__super__.constructor.apply(this, arguments);
    }

    ApplicationLayout.prototype.el = 'body';

    ApplicationLayout.prototype.regions = {
      todoList: '.jsTodoList'
    };

    ApplicationLayout.prototype.prepare = ['initializeTodoList'];

    ApplicationLayout.prototype.initializeTodoList = function() {
      return this.getRegion('todoList').show(new TodoCollectionView({
        attach: {
          application: this,
          collection: this.todo
        }
      }));
    };

    return ApplicationLayout;

  })(Marionette.LayoutView);


  /*
      To-do application
   */

  Application = (function(superClass) {
    extend(Application, superClass);

    function Application() {
      return Application.__super__.constructor.apply(this, arguments);
    }

    Application.prototype.layout = null;

    Application.prototype.launch = function() {
      return this.layout = new ApplicationLayout({
        attach: {
          application: this,
          todo: this.todo
        }
      });
    };

    return Application;

  })(Marionette.Application);


  /*
      "changeLanguage" event handler
   */

  setTranslations = function(lang) {
    this.translation = {};
    this.translationImport.forEach((function(_this) {
      return function(name) {
        return _this.translation[name] = TRANSLATION[lang][name];
      };
    })(this));
    return this.trigger('languageChanged', lang);
  };


  /*
      Global backbone initialize prepare function
   */

  SetTranslations = function() {
    if (!Array.isArray(this.translationImport)) {
      return;
    }
    this.addHandler((this.application != null ? 'application.changeLanguage' : (this.collection ? 'collection.changeLanguage' : 'model.collection.changeLanguage')), setTranslations);
    if (typeof this.onLanguageChanged === 'function') {
      this.addHandler('languageChanged', 'onLanguageChanged');
    }
    setTranslations.call(this, language);
    return this.templateHelpers = (function(_this) {
      return function() {
        return _this.translation;
      };
    })(this);
  };

  BackbonePrepare.push(SetTranslations);

  $(function() {
    var todo;
    todo = new TodoCollection(new Array(10));
    return new Application({
      attach: {
        todo: todo
      }
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,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cUQsaUNBQXRELENBRFEsQ0FBWixFQUMrRixlQUQvRjtJQUdBLElBQUcsT0FBTyxJQUFDLENBQUEsaUJBQVIsS0FBNkIsVUFBaEM7TUFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLGlCQUFaLEVBQStCLG1CQUEvQixFQURKOztJQUdBLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixJQUFyQixFQUF3QixRQUF4QjtXQUNBLElBQUMsQ0FBQSxlQUFELEdBQW1CLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtlQUFHLEtBQUMsQ0FBQTtNQUFKO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtFQVZMOztFQVlsQixlQUFlLENBQUMsSUFBaEIsQ0FBcUIsZUFBckI7O0VBSUEsQ0FBQSxDQUFFLFNBQUE7QUFDRSxRQUFBO0lBQUEsSUFBQSxHQUFXLElBQUEsY0FBQSxDQUFtQixJQUFBLEtBQUEsQ0FBTSxFQUFOLENBQW5CO1dBQ1AsSUFBQSxXQUFBLENBQ0E7TUFBQSxNQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sSUFBTjtPQURKO0tBREE7RUFGTixDQUFGO0FBdEpBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbImxhbmd1YWdlID0gJ2VuJ1xuXG5UUkFOU0xBVElPTiA9XG4gICAgZW46XG4gICAgICAgIHRvZG9MaXN0OiAnVG8gZG8gbGlzdCdcbiAgICAgICAgZGVsZXRlSXRlbTogJ0RlbGV0ZSBpdGVtJ1xuICAgICAgICBpdGVtOiAnSXRlbSdcbiAgICAgICAgYWRkSXRlbTogJ0FkZCBpdGVtJ1xuICAgICAgICBjaGFuZ2VMYW5ndWFnZTogJ0NoYW5nZSBsYW5ndWFnZSdcbiAgICBkZTpcbiAgICAgICAgdG9kb0xpc3Q6ICdBdWZnYWJlbmxpc3RlJ1xuICAgICAgICBkZWxldGVJdGVtOiAnRWxlbWVudCBsw7ZzY2hlbidcbiAgICAgICAgaXRlbTogJ0FydGlrZWwnXG4gICAgICAgIGFkZEl0ZW06ICdBcnRpa2VsIGhpbnp1ZsO8Z2VuJ1xuICAgICAgICBjaGFuZ2VMYW5ndWFnZTogJ1NwcmFjaGUgw6RuZGVybidcblxuIyMjXG4gICAgVG8tZG8gaXRlbSBtb2RlbFxuIyMjXG5jbGFzcyBUb2RvSXRlbSBleHRlbmRzIEJhY2tib25lLk1vZGVsXG4gICAgZGVmYXVsdHM6XG4gICAgICAgIHRpdGxlOiAnJ1xuICAgICAgICBjaGVja2VkOiAnJ1xuXG4gICAgdHJhbnNsYXRpb25JbXBvcnQ6IFsnaXRlbSddXG5cbiAgICBvbkxhbmd1YWdlQ2hhbmdlZDogLT5cbiAgICAgICAgQHNldCAndGl0bGUnLCBcIiN7QHRyYW5zbGF0aW9uLml0ZW19ICMje0BjaWR9XCJcblxuICAgIGxhdW5jaDogLT5cblxuIyMjXG4gICAgVG8tZG8gY29sbGVjdGlvblxuIyMjXG5jbGFzcyBUb2RvQ29sbGVjdGlvbiBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cbiAgICBtb2RlbDogVG9kb0l0ZW1cblxuIyMjXG4gICAgVG8tZG8gaXRlbSB2aWV3XG4jIyNcbmNsYXNzIFRvZG9JdGVtVmlldyBleHRlbmRzIE1hcmlvbmV0dGUuSXRlbVZpZXdcbiAgICB0ZW1wbGF0ZTogJyNqc1RvZG9JdGVtVmlldydcbiAgICB1aTpcbiAgICAgICAgY2hlY2tib3g6ICcuanNDaGVja2JveCdcbiAgICAgICAgZGVsZXRlQnV0dG9uOiAnLmpzRGVsZXRlSXRlbSdcblxuICAgIHRyYW5zbGF0aW9uSW1wb3J0OiBbJ2RlbGV0ZUl0ZW0nXVxuXG4gICAgZXZlbnRzOlxuICAgICAgICAnY2xpY2sgQHVpLmRlbGV0ZUJ1dHRvbic6ICdkZWxldGVJdGVtJ1xuICAgICAgICAnY2xpY2sgQHVpLmpzQ2hlY2tib3gnOiAnb25DaGVja2JveENsaWNrJ1xuICAgICAgICAnY2xpY2snOiAnb25JdGVtQ2xpY2snXG5cbiAgICBoYW5kbGVyczpcbiAgICAgICAgJ21vZGVsLmNoYW5nZSc6ICdyZW5kZXInXG5cbiAgICBkZWxldGVJdGVtOiAtPlxuICAgICAgICBAbW9kZWwuZGVzdHJveSgpXG5cbiAgICBvbkl0ZW1DbGljazogLT5cbiAgICAgICAgQG1vZGVsLnNldCgnY2hlY2tlZCcsIGlmIEBtb2RlbC5nZXQoJ2NoZWNrZWQnKSBpcyAnY2hlY2tlZCcgdGhlbiAnJyBlbHNlICdjaGVja2VkJylcblxuXG4jIyNcbiAgICBUby1kbyBjb2xsZWN0aW9uIHZpZXdcbiMjI1xuY2xhc3MgVG9kb0NvbGxlY3Rpb25WaWV3IGV4dGVuZHMgTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3XG4gICAgdGVtcGxhdGU6ICcjanNUb2RvQ29sbGVjdGlvblZpZXcnLFxuICAgIGNoaWxkVmlldzogVG9kb0l0ZW1WaWV3LFxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogJy5qc1RvZG9MaXN0Q29udGFpbmVyJ1xuXG4gICAgdHJhbnNsYXRpb25JbXBvcnQ6IFsndG9kb0xpc3QnLCAnYWRkSXRlbScsICdjaGFuZ2VMYW5ndWFnZSddXG5cbiAgICB1aTpcbiAgICAgICAgYWRkSXRlbTogJy5qc0FkZEl0ZW0nXG4gICAgICAgIGNoYW5nZUxhbmd1YWdlOiAnLmpzQ2hhbmdlTGFuZ3VhZ2UnXG5cbiAgICBldmVudHM6XG4gICAgICAgICdjbGljayBAdWkuYWRkSXRlbSc6ICdvbkFkZEl0ZW1DbGljaydcbiAgICAgICAgJ2NsaWNrIEB1aS5jaGFuZ2VMYW5ndWFnZSc6ICdvbkNoYW5nZUxhbmd1YWdlQ2xpY2snXG5cbiAgICBvbkFkZEl0ZW1DbGljazogLT5cbiAgICAgICAgQGNvbGxlY3Rpb24uYWRkIHt9XG5cbiAgICBvbkNoYW5nZUxhbmd1YWdlQ2xpY2s6IC0+XG4gICAgICAgIGxhbmd1YWdlID0gaWYgbGFuZ3VhZ2UgaXMgJ2VuJyB0aGVuICdkZScgZWxzZSAnZW4nXG4gICAgICAgIEBjb2xsZWN0aW9uLnRyaWdnZXIgJ2NoYW5nZUxhbmd1YWdlJywgbGFuZ3VhZ2VcbiAgICAgICAgQGFwcGxpY2F0aW9uLnRyaWdnZXIgJ2NoYW5nZUxhbmd1YWdlJywgbGFuZ3VhZ2VcblxuXG4jIyNcbiAgICBBcHBsaWNhdGlvbiBsYXlvdXRcbiMjI1xuY2xhc3MgQXBwbGljYXRpb25MYXlvdXQgZXh0ZW5kcyBNYXJpb25ldHRlLkxheW91dFZpZXdcbiAgICBlbDogJ2JvZHknLFxuICAgIHJlZ2lvbnM6XG4gICAgICAgIHRvZG9MaXN0OiAnLmpzVG9kb0xpc3QnXG5cbiAgICBwcmVwYXJlOiBbXG4gICAgICAgICdpbml0aWFsaXplVG9kb0xpc3QnXG4gICAgXVxuXG4gICAgaW5pdGlhbGl6ZVRvZG9MaXN0OiAtPlxuICAgICAgICBAZ2V0UmVnaW9uKCd0b2RvTGlzdCcpLnNob3coXG4gICAgICAgICAgICBuZXcgVG9kb0NvbGxlY3Rpb25WaWV3XG4gICAgICAgICAgICAgICAgYXR0YWNoOlxuICAgICAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbjogQFxuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBAdG9kb1xuICAgICAgICApXG5cblxuIyMjXG4gICAgVG8tZG8gYXBwbGljYXRpb25cbiMjI1xuY2xhc3MgQXBwbGljYXRpb24gZXh0ZW5kcyBNYXJpb25ldHRlLkFwcGxpY2F0aW9uXG4gICAgbGF5b3V0OiBudWxsXG4gICAgbGF1bmNoOiAtPlxuICAgICAgICBAbGF5b3V0ID0gbmV3IEFwcGxpY2F0aW9uTGF5b3V0XG4gICAgICAgICAgICBhdHRhY2g6XG4gICAgICAgICAgICAgICAgYXBwbGljYXRpb246IEBcbiAgICAgICAgICAgICAgICB0b2RvOiBAdG9kb1xuXG4jIyNcbiAgICBcImNoYW5nZUxhbmd1YWdlXCIgZXZlbnQgaGFuZGxlclxuIyMjXG5zZXRUcmFuc2xhdGlvbnMgPSAobGFuZyktPlxuICAgIEB0cmFuc2xhdGlvbiA9IHt9XG4gICAgQHRyYW5zbGF0aW9uSW1wb3J0LmZvckVhY2ggKG5hbWUpPT5cbiAgICAgICAgQHRyYW5zbGF0aW9uW25hbWVdID0gVFJBTlNMQVRJT05bbGFuZ11bbmFtZV1cbiAgICBAdHJpZ2dlciAnbGFuZ3VhZ2VDaGFuZ2VkJywgbGFuZ1xuXG4jIyNcbiAgICBHbG9iYWwgYmFja2JvbmUgaW5pdGlhbGl6ZSBwcmVwYXJlIGZ1bmN0aW9uXG4jIyNcblNldFRyYW5zbGF0aW9ucyA9IC0+XG4gICAgcmV0dXJuIHVubGVzcyBBcnJheS5pc0FycmF5IEB0cmFuc2xhdGlvbkltcG9ydFxuXG4gICAgQGFkZEhhbmRsZXIgKGlmIEBhcHBsaWNhdGlvbj8gdGhlbiAnYXBwbGljYXRpb24uY2hhbmdlTGFuZ3VhZ2UnIGVsc2VcbiAgICAgICAgKGlmIEBjb2xsZWN0aW9uIHRoZW4gJ2NvbGxlY3Rpb24uY2hhbmdlTGFuZ3VhZ2UnIGVsc2UgJ21vZGVsLmNvbGxlY3Rpb24uY2hhbmdlTGFuZ3VhZ2UnKSksIHNldFRyYW5zbGF0aW9uc1xuXG4gICAgaWYgdHlwZW9mIEBvbkxhbmd1YWdlQ2hhbmdlZCBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEBhZGRIYW5kbGVyICdsYW5ndWFnZUNoYW5nZWQnLCAnb25MYW5ndWFnZUNoYW5nZWQnXG5cbiAgICBzZXRUcmFuc2xhdGlvbnMuY2FsbCBALCBsYW5ndWFnZVxuICAgIEB0ZW1wbGF0ZUhlbHBlcnMgPSA9PiBAdHJhbnNsYXRpb25cblxuQmFja2JvbmVQcmVwYXJlLnB1c2ggU2V0VHJhbnNsYXRpb25zXG5cblxuIyBpbml0XG4kIC0+XG4gICAgdG9kbyA9IG5ldyBUb2RvQ29sbGVjdGlvbihuZXcgQXJyYXkoMTApKVxuICAgIG5ldyBBcHBsaWNhdGlvblxuICAgICAgICBhdHRhY2g6XG4gICAgICAgICAgICB0b2RvOiB0b2RvIl19
