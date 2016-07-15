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

//# sourceMappingURL=data:application/json;base64,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SUFBQyxDQUFBLFVBQUosR0FBb0IsMkJBQXBCLEdBQXFELGlDQUF0RCxDQURRLENBQVosRUFDK0YsZUFEL0Y7SUFHQSxJQUFHLE9BQU8sSUFBQyxDQUFBLGlCQUFSLEtBQTZCLFVBQWhDO01BQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxpQkFBWixFQUErQixtQkFBL0IsRUFESjs7SUFHQSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsSUFBckIsRUFBd0IsUUFBeEI7V0FDQSxJQUFDLENBQUEsZUFBRCxHQUFtQixDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFBRyxLQUFDLENBQUE7TUFBSjtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7RUFWTDs7RUFZbEIsZUFBZSxDQUFDLElBQWhCLENBQXFCLGVBQXJCOztFQUlBLENBQUEsQ0FBRSxTQUFBO0FBQ0UsUUFBQTtJQUFBLElBQUEsR0FBVyxJQUFBLGNBQUEsQ0FBbUIsSUFBQSxLQUFBLENBQU0sRUFBTixDQUFuQjtXQUNQLElBQUEsV0FBQSxDQUNBO01BQUEsTUFBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLElBQU47T0FESjtLQURBO0VBRk4sQ0FBRjtBQXpKQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJsYW5ndWFnZSA9ICdlbidcblxuVFJBTlNMQVRJT04gPVxuICAgIGVuOlxuICAgICAgICB0b2RvTGlzdDogJ1RvIGRvIGxpc3QnXG4gICAgICAgIGRlbGV0ZUl0ZW06ICdEZWxldGUgaXRlbSdcbiAgICAgICAgaXRlbTogJ0l0ZW0nXG4gICAgICAgIGFkZEl0ZW06ICdBZGQgaXRlbSdcbiAgICAgICAgY2hhbmdlTGFuZ3VhZ2U6ICdDaGFuZ2UgbGFuZ3VhZ2UnXG4gICAgZGU6XG4gICAgICAgIHRvZG9MaXN0OiAnQXVmZ2FiZW5saXN0ZSdcbiAgICAgICAgZGVsZXRlSXRlbTogJ0VsZW1lbnQgbMO2c2NoZW4nXG4gICAgICAgIGl0ZW06ICdBcnRpa2VsJ1xuICAgICAgICBhZGRJdGVtOiAnQXJ0aWtlbCBoaW56dWbDvGdlbidcbiAgICAgICAgY2hhbmdlTGFuZ3VhZ2U6ICdTcHJhY2hlIMOkbmRlcm4nXG5cbiMjI1xuICAgIFRvLWRvIGl0ZW0gbW9kZWxcbiMjI1xuY2xhc3MgVG9kb0l0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5Nb2RlbFxuICAgIGRlZmF1bHRzOlxuICAgICAgICB0aXRsZTogJydcbiAgICAgICAgY2hlY2tlZDogJydcblxuICAgIHRyYW5zbGF0aW9uSW1wb3J0OiBbJ2l0ZW0nXVxuXG4gICAgb25MYW5ndWFnZUNoYW5nZWQ6IC0+XG4gICAgICAgIEBzZXQgJ3RpdGxlJywgXCIje0B0cmFuc2xhdGlvbi5pdGVtfSAjI3tAY2lkfVwiXG5cbiAgICBsYXVuY2g6IC0+XG5cbiMjI1xuICAgIFRvLWRvIGNvbGxlY3Rpb25cbiMjI1xuY2xhc3MgVG9kb0NvbGxlY3Rpb24gZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG4gICAgbW9kZWw6IFRvZG9JdGVtXG5cbiMjI1xuICAgIFRvLWRvIGl0ZW0gdmlld1xuIyMjXG5jbGFzcyBUb2RvSXRlbVZpZXcgZXh0ZW5kcyBNYXJpb25ldHRlLkl0ZW1WaWV3XG4gICAgdGVtcGxhdGU6ICcjanNUb2RvSXRlbVZpZXcnXG4gICAgdWk6XG4gICAgICAgIGNoZWNrYm94OiAnLmpzQ2hlY2tib3gnXG4gICAgICAgIGRlbGV0ZUJ1dHRvbjogJy5qc0RlbGV0ZUl0ZW0nXG5cbiAgICB0cmFuc2xhdGlvbkltcG9ydDogWydkZWxldGVJdGVtJ11cblxuICAgIGV2ZW50czpcbiAgICAgICAgJ2NsaWNrIEB1aS5kZWxldGVCdXR0b24nOiAnZGVsZXRlSXRlbSdcbiAgICAgICAgJ2NsaWNrIEB1aS5qc0NoZWNrYm94JzogJ29uQ2hlY2tib3hDbGljaydcbiAgICAgICAgJ2NsaWNrJzogJ29uSXRlbUNsaWNrJ1xuXG4gICAgaGFuZGxlcnM6XG4gICAgICAgICdtb2RlbC5jaGFuZ2UnOiAncmVuZGVyJ1xuXG4gICAgZGVsZXRlSXRlbTogLT5cbiAgICAgICAgQHJlbW92ZSgpXG5cbiAgICBvbkl0ZW1DbGljazogLT5cbiAgICAgICAgQG1vZGVsLnNldCgnY2hlY2tlZCcsIGlmIEBtb2RlbC5nZXQoJ2NoZWNrZWQnKSBpcyAnY2hlY2tlZCcgdGhlbiAnJyBlbHNlICdjaGVja2VkJylcblxuXG4jIyNcbiAgICBUby1kbyBjb2xsZWN0aW9uIHZpZXdcbiMjI1xuY2xhc3MgVG9kb0NvbGxlY3Rpb25WaWV3IGV4dGVuZHMgTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3XG4gICAgdGVtcGxhdGU6ICcjanNUb2RvQ29sbGVjdGlvblZpZXcnLFxuICAgIGNoaWxkVmlldzogVG9kb0l0ZW1WaWV3LFxuICAgIGNoaWxkVmlld0NvbnRhaW5lcjogJy5qc1RvZG9MaXN0Q29udGFpbmVyJ1xuXG4gICAgdHJhbnNsYXRpb25JbXBvcnQ6IFsndG9kb0xpc3QnLCAnYWRkSXRlbScsICdjaGFuZ2VMYW5ndWFnZSddXG5cbiAgICB1aTpcbiAgICAgICAgYWRkSXRlbTogJy5qc0FkZEl0ZW0nXG4gICAgICAgIGNoYW5nZUxhbmd1YWdlOiAnLmpzQ2hhbmdlTGFuZ3VhZ2UnXG5cbiAgICBldmVudHM6XG4gICAgICAgICdjbGljayBAdWkuYWRkSXRlbSc6ICdvbkFkZEl0ZW1DbGljaydcbiAgICAgICAgJ2NsaWNrIEB1aS5jaGFuZ2VMYW5ndWFnZSc6ICdvbkNoYW5nZUxhbmd1YWdlQ2xpY2snXG5cbiAgICBoYW5kbGVyczpcbiAgICAgICAgJ2FwcGxpY2F0aW9uLmNoYW5nZUxhbmd1YWdlJzogJ3JlbmRlcidcblxuICAgIG9uQWRkSXRlbUNsaWNrOiAtPlxuICAgICAgICBAY29sbGVjdGlvbi5hZGQge31cblxuICAgIG9uQ2hhbmdlTGFuZ3VhZ2VDbGljazogLT5cbiAgICAgICAgbGFuZ3VhZ2UgPSBpZiBsYW5ndWFnZSBpcyAnZW4nIHRoZW4gJ2RlJyBlbHNlICdlbidcbiAgICAgICAgQGNvbGxlY3Rpb24udHJpZ2dlciAnY2hhbmdlTGFuZ3VhZ2UnLCBsYW5ndWFnZVxuICAgICAgICBAYXBwbGljYXRpb24udHJpZ2dlciAnY2hhbmdlTGFuZ3VhZ2UnLCBsYW5ndWFnZVxuXG5cbiMjI1xuICAgIEFwcGxpY2F0aW9uIGxheW91dFxuIyMjXG5jbGFzcyBBcHBsaWNhdGlvbkxheW91dCBleHRlbmRzIE1hcmlvbmV0dGUuTGF5b3V0Vmlld1xuICAgIGVsOiAnYm9keScsXG4gICAgcmVnaW9uczpcbiAgICAgICAgdG9kb0xpc3Q6ICcuanNUb2RvTGlzdCdcblxuICAgIHByZXBhcmU6IFtcbiAgICAgICAgJ2luaXRpYWxpemVUb2RvTGlzdCdcbiAgICBdXG5cbiAgICBpbml0aWFsaXplVG9kb0xpc3Q6IC0+XG4gICAgICAgIEBnZXRSZWdpb24oJ3RvZG9MaXN0Jykuc2hvdyhcbiAgICAgICAgICAgIG5ldyBUb2RvQ29sbGVjdGlvblZpZXdcbiAgICAgICAgICAgICAgICBhdHRhY2g6XG4gICAgICAgICAgICAgICAgICAgIGFwcGxpY2F0aW9uOiBAXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IEB0b2RvXG4gICAgICAgIClcblxuXG4jIyNcbiAgICBUby1kbyBhcHBsaWNhdGlvblxuIyMjXG5jbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIE1hcmlvbmV0dGUuQXBwbGljYXRpb25cbiAgICBsYXlvdXQ6IG51bGxcbiAgICBsYXVuY2g6IC0+XG4gICAgICAgIEBsYXlvdXQgPSBuZXcgQXBwbGljYXRpb25MYXlvdXRcbiAgICAgICAgICAgIGF0dGFjaDpcbiAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbjogQFxuICAgICAgICAgICAgICAgIHRvZG86IEB0b2RvXG5cbiMjI1xuICAgIFwiY2hhbmdlTGFuZ3VhZ2VcIiBldmVudCBoYW5kbGVyXG4jIyNcbnNldFRyYW5zbGF0aW9ucyA9IChsYW5nKS0+XG4gICAgQHRyYW5zbGF0aW9uID0ge31cbiAgICBAdHJhbnNsYXRpb25JbXBvcnQuZm9yRWFjaCAobmFtZSk9PlxuICAgICAgICBAdHJhbnNsYXRpb25bbmFtZV0gPSBUUkFOU0xBVElPTltsYW5nXVtuYW1lXVxuICAgIEB0cmlnZ2VyICdsYW5ndWFnZUNoYW5nZWQnLCBsYW5nXG5cbiMjI1xuICAgIEdsb2JhbCBiYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmUgZnVuY3Rpb25cbiMjI1xuU2V0VHJhbnNsYXRpb25zID0gLT5cbiAgICByZXR1cm4gdW5sZXNzIEFycmF5LmlzQXJyYXkgQHRyYW5zbGF0aW9uSW1wb3J0XG5cbiAgICBAYWRkSGFuZGxlciAoaWYgQGFwcGxpY2F0aW9uPyB0aGVuICdhcHBsaWNhdGlvbi5jaGFuZ2VMYW5ndWFnZScgZWxzZVxuICAgICAgICAoaWYgQGNvbGxlY3Rpb24gdGhlbiAnY29sbGVjdGlvbi5jaGFuZ2VMYW5ndWFnZScgZWxzZSAnbW9kZWwuY29sbGVjdGlvbi5jaGFuZ2VMYW5ndWFnZScpKSwgc2V0VHJhbnNsYXRpb25zXG5cbiAgICBpZiB0eXBlb2YgQG9uTGFuZ3VhZ2VDaGFuZ2VkIGlzICdmdW5jdGlvbidcbiAgICAgICAgQGFkZEhhbmRsZXIgJ2xhbmd1YWdlQ2hhbmdlZCcsICdvbkxhbmd1YWdlQ2hhbmdlZCdcblxuICAgIHNldFRyYW5zbGF0aW9ucy5jYWxsIEAsIGxhbmd1YWdlXG4gICAgQHRlbXBsYXRlSGVscGVycyA9ID0+IEB0cmFuc2xhdGlvblxuXG5CYWNrYm9uZVByZXBhcmUucHVzaCBTZXRUcmFuc2xhdGlvbnNcblxuXG4jIGluaXRcbiQgLT5cbiAgICB0b2RvID0gbmV3IFRvZG9Db2xsZWN0aW9uKG5ldyBBcnJheSgxMCkpXG4gICAgbmV3IEFwcGxpY2F0aW9uXG4gICAgICAgIGF0dGFjaDpcbiAgICAgICAgICAgIHRvZG86IHRvZG8iXX0=
