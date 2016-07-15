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

    TodoItemView.prototype.onCheckboxClick = function() {
      return false;
    };

    TodoItemView.prototype.deleteItem = function() {
      return this.remove();
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

    TodoCollectionView.prototype.handlers = {
      'application.changeLanguage': 'render'
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

//# sourceMappingURL=data:application/json;base64,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Q0FBSSx3QkFBSCxHQUFzQiw0QkFBdEIsR0FDVCxDQUFJLElBQUMsQ0FBQSxVQUFKLEdBQW9CLDJCQUFwQixHQUFxRCxpQ0FBdEQsQ0FEUSxDQUFaLEVBQytGLGVBRC9GO0lBR0EsSUFBRyxPQUFPLElBQUMsQ0FBQSxpQkFBUixLQUE2QixVQUFoQztNQUNJLElBQUMsQ0FBQSxVQUFELENBQVksaUJBQVosRUFBK0IsbUJBQS9CLEVBREo7O0lBR0EsZUFBZSxDQUFDLElBQWhCLENBQXFCLElBQXJCLEVBQXdCLFFBQXhCO1dBQ0EsSUFBQyxDQUFBLGVBQUQsR0FBbUIsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQUcsS0FBQyxDQUFBO01BQUo7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0VBVkw7O0VBWWxCLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixlQUFyQjs7RUFJQSxDQUFBLENBQUUsU0FBQTtBQUNFLFFBQUE7SUFBQSxJQUFBLEdBQVcsSUFBQSxjQUFBLENBQW1CLElBQUEsS0FBQSxDQUFNLEVBQU4sQ0FBbkI7V0FDUCxJQUFBLFdBQUEsQ0FDQTtNQUFBLE1BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxJQUFOO09BREo7S0FEQTtFQUZOLENBQUY7QUE1SkEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsibGFuZ3VhZ2UgPSAnZW4nXG5cblRSQU5TTEFUSU9OID1cbiAgICBlbjpcbiAgICAgICAgdG9kb0xpc3Q6ICdUbyBkbyBsaXN0J1xuICAgICAgICBkZWxldGVJdGVtOiAnRGVsZXRlIGl0ZW0nXG4gICAgICAgIGl0ZW06ICdJdGVtJ1xuICAgICAgICBhZGRJdGVtOiAnQWRkIGl0ZW0nXG4gICAgICAgIGNoYW5nZUxhbmd1YWdlOiAnQ2hhbmdlIGxhbmd1YWdlJ1xuICAgIGRlOlxuICAgICAgICB0b2RvTGlzdDogJ0F1ZmdhYmVubGlzdGUnXG4gICAgICAgIGRlbGV0ZUl0ZW06ICdFbGVtZW50IGzDtnNjaGVuJ1xuICAgICAgICBpdGVtOiAnQXJ0aWtlbCdcbiAgICAgICAgYWRkSXRlbTogJ0FydGlrZWwgaGluenVmw7xnZW4nXG4gICAgICAgIGNoYW5nZUxhbmd1YWdlOiAnU3ByYWNoZSDDpG5kZXJuJ1xuXG4jIyNcbiAgICBUby1kbyBpdGVtIG1vZGVsXG4jIyNcbmNsYXNzIFRvZG9JdGVtIGV4dGVuZHMgQmFja2JvbmUuTW9kZWxcbiAgICBkZWZhdWx0czpcbiAgICAgICAgdGl0bGU6ICcnXG4gICAgICAgIGNoZWNrZWQ6ICcnXG5cbiAgICB0cmFuc2xhdGlvbkltcG9ydDogWydpdGVtJ11cblxuICAgIG9uTGFuZ3VhZ2VDaGFuZ2VkOiAtPlxuICAgICAgICBAc2V0ICd0aXRsZScsIFwiI3tAdHJhbnNsYXRpb24uaXRlbX0gIyN7QGNpZH1cIlxuXG4gICAgbGF1bmNoOiAtPlxuXG4jIyNcbiAgICBUby1kbyBjb2xsZWN0aW9uXG4jIyNcbmNsYXNzIFRvZG9Db2xsZWN0aW9uIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuICAgIG1vZGVsOiBUb2RvSXRlbVxuXG5cbiMjI1xuICAgIFRvLWRvIGl0ZW0gdmlld1xuIyMjXG5jbGFzcyBUb2RvSXRlbVZpZXcgZXh0ZW5kcyBNYXJpb25ldHRlLkl0ZW1WaWV3XG4gICAgdGVtcGxhdGU6ICcjanNUb2RvSXRlbVZpZXcnXG4gICAgdWk6XG4gICAgICAgIGNoZWNrYm94OiAnLmpzQ2hlY2tib3gnXG4gICAgICAgIGRlbGV0ZUJ1dHRvbjogJy5qc0RlbGV0ZUl0ZW0nXG5cbiAgICB0cmFuc2xhdGlvbkltcG9ydDogWydkZWxldGVJdGVtJ11cblxuICAgIGV2ZW50czpcbiAgICAgICAgJ2NsaWNrIEB1aS5kZWxldGVCdXR0b24nOiAnZGVsZXRlSXRlbSdcbiAgICAgICAgJ2NsaWNrIEB1aS5qc0NoZWNrYm94JzogJ29uQ2hlY2tib3hDbGljaydcbiAgICAgICAgJ2NsaWNrJzogJ29uSXRlbUNsaWNrJ1xuXG4gICAgaGFuZGxlcnM6XG4gICAgICAgICdtb2RlbC5jaGFuZ2UnOiAncmVuZGVyJ1xuXG4gICAgb25DaGVja2JveENsaWNrOiAtPiBmYWxzZVxuXG4gICAgZGVsZXRlSXRlbTogLT5cbiAgICAgICAgQHJlbW92ZSgpXG5cbiAgICBvbkl0ZW1DbGljazogLT5cbiAgICAgICAgQG1vZGVsLnNldCgnY2hlY2tlZCcsIGlmIEBtb2RlbC5nZXQoJ2NoZWNrZWQnKSBpcyAnY2hlY2tlZCcgdGhlbiAnJyBlbHNlICdjaGVja2VkJylcblxuXG4jIyNcbiAgICBUby1kbyBjb2xsZWN0aW9uIHZpZXdcbiMjI1xuY2xhc3MgVG9kb0NvbGxlY3Rpb25WaWV3IGV4dGVuZHMgTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3XG4gICAgdGVtcGxhdGU6ICcjanNUb2RvQ29sbGVjdGlvblZpZXcnLFxuICAgIGNoaWxkVmlldzogVG9kb0l0ZW1WaWV3LFxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogJy5qc1RvZG9MaXN0Q29udGFpbmVyJ1xuXG4gICAgdHJhbnNsYXRpb25JbXBvcnQ6IFsndG9kb0xpc3QnLCAnYWRkSXRlbScsICdjaGFuZ2VMYW5ndWFnZSddXG5cbiAgICB1aTpcbiAgICAgICAgYWRkSXRlbTogJy5qc0FkZEl0ZW0nXG4gICAgICAgIGNoYW5nZUxhbmd1YWdlOiAnLmpzQ2hhbmdlTGFuZ3VhZ2UnXG5cbiAgICBldmVudHM6XG4gICAgICAgICdjbGljayBAdWkuYWRkSXRlbSc6ICdvbkFkZEl0ZW1DbGljaydcbiAgICAgICAgJ2NsaWNrIEB1aS5jaGFuZ2VMYW5ndWFnZSc6ICdvbkNoYW5nZUxhbmd1YWdlQ2xpY2snXG5cbiAgICBoYW5kbGVyczpcbiAgICAgICAgJ2FwcGxpY2F0aW9uLmNoYW5nZUxhbmd1YWdlJzogJ3JlbmRlcidcblxuICAgIG9uQWRkSXRlbUNsaWNrOiAtPlxuICAgICAgICBAY29sbGVjdGlvbi5hZGQge31cblxuICAgIG9uQ2hhbmdlTGFuZ3VhZ2VDbGljazogLT5cbiAgICAgICAgbGFuZ3VhZ2UgPSBpZiBsYW5ndWFnZSBpcyAnZW4nIHRoZW4gJ2RlJyBlbHNlICdlbidcbiAgICAgICAgQGNvbGxlY3Rpb24udHJpZ2dlciAnY2hhbmdlTGFuZ3VhZ2UnLCBsYW5ndWFnZVxuICAgICAgICBAYXBwbGljYXRpb24udHJpZ2dlciAnY2hhbmdlTGFuZ3VhZ2UnLCBsYW5ndWFnZVxuXG5cbiMjI1xuICAgIEFwcGxpY2F0aW9uIGxheW91dFxuIyMjXG5jbGFzcyBBcHBsaWNhdGlvbkxheW91dCBleHRlbmRzIE1hcmlvbmV0dGUuTGF5b3V0Vmlld1xuICAgIGVsOiAnYm9keScsXG4gICAgcmVnaW9uczpcbiAgICAgICAgdG9kb0xpc3Q6ICcuanNUb2RvTGlzdCdcblxuICAgIHByZXBhcmU6IFtcbiAgICAgICAgJ2luaXRpYWxpemVUb2RvTGlzdCdcbiAgICBdXG5cbiAgICBpbml0aWFsaXplVG9kb0xpc3Q6IC0+XG4gICAgICAgIEBnZXRSZWdpb24oJ3RvZG9MaXN0Jykuc2hvdyhcbiAgICAgICAgICAgIG5ldyBUb2RvQ29sbGVjdGlvblZpZXdcbiAgICAgICAgICAgICAgICBhdHRhY2g6XG4gICAgICAgICAgICAgICAgICAgIGFwcGxpY2F0aW9uOiBAXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IEB0b2RvXG4gICAgICAgIClcblxuXG4jIyNcbiAgICBUby1kbyBhcHBsaWNhdGlvblxuIyMjXG5jbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIE1hcmlvbmV0dGUuQXBwbGljYXRpb25cbiAgICBsYXlvdXQ6IG51bGxcbiAgICBsYXVuY2g6IC0+XG4gICAgICAgIEBsYXlvdXQgPSBuZXcgQXBwbGljYXRpb25MYXlvdXRcbiAgICAgICAgICAgIGF0dGFjaDpcbiAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbjogQFxuICAgICAgICAgICAgICAgIHRvZG86IEB0b2RvXG5cbiMjI1xuICAgIFwiY2hhbmdlTGFuZ3VhZ2VcIiBldmVudCBoYW5kbGVyXG4jIyNcbnNldFRyYW5zbGF0aW9ucyA9IChsYW5nKS0+XG4gICAgQHRyYW5zbGF0aW9uID0ge31cbiAgICBAdHJhbnNsYXRpb25JbXBvcnQuZm9yRWFjaCAobmFtZSk9PlxuICAgICAgICBAdHJhbnNsYXRpb25bbmFtZV0gPSBUUkFOU0xBVElPTltsYW5nXVtuYW1lXVxuICAgIEB0cmlnZ2VyICdsYW5ndWFnZUNoYW5nZWQnLCBsYW5nXG5cbiMjI1xuICAgIEdsb2JhbCBiYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmUgZnVuY3Rpb25cbiMjI1xuU2V0VHJhbnNsYXRpb25zID0gLT5cbiAgICByZXR1cm4gdW5sZXNzIEFycmF5LmlzQXJyYXkgQHRyYW5zbGF0aW9uSW1wb3J0XG5cbiAgICBAYWRkSGFuZGxlciAoaWYgQGFwcGxpY2F0aW9uPyB0aGVuICdhcHBsaWNhdGlvbi5jaGFuZ2VMYW5ndWFnZScgZWxzZVxuICAgICAgICAoaWYgQGNvbGxlY3Rpb24gdGhlbiAnY29sbGVjdGlvbi5jaGFuZ2VMYW5ndWFnZScgZWxzZSAnbW9kZWwuY29sbGVjdGlvbi5jaGFuZ2VMYW5ndWFnZScpKSwgc2V0VHJhbnNsYXRpb25zXG5cbiAgICBpZiB0eXBlb2YgQG9uTGFuZ3VhZ2VDaGFuZ2VkIGlzICdmdW5jdGlvbidcbiAgICAgICAgQGFkZEhhbmRsZXIgJ2xhbmd1YWdlQ2hhbmdlZCcsICdvbkxhbmd1YWdlQ2hhbmdlZCdcblxuICAgIHNldFRyYW5zbGF0aW9ucy5jYWxsIEAsIGxhbmd1YWdlXG4gICAgQHRlbXBsYXRlSGVscGVycyA9ID0+IEB0cmFuc2xhdGlvblxuXG5CYWNrYm9uZVByZXBhcmUucHVzaCBTZXRUcmFuc2xhdGlvbnNcblxuXG4jIGluaXRcbiQgLT5cbiAgICB0b2RvID0gbmV3IFRvZG9Db2xsZWN0aW9uKG5ldyBBcnJheSgxMCkpXG4gICAgbmV3IEFwcGxpY2F0aW9uXG4gICAgICAgIGF0dGFjaDpcbiAgICAgICAgICAgIHRvZG86IHRvZG8iXX0=
