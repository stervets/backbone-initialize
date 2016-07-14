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

    TodoItem.prototype.ready = function() {};

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

    TodoCollectionView.prototype.bootstrap = ['initCollection'];

    TodoCollectionView.prototype.initCollection = function() {};

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

    ApplicationLayout.prototype.bootstrap = ['initializeTodoList'];

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

    Application.prototype.ready = function() {
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
      Global babkbone initialize bootstrap function
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

  BackboneBootstrap.push(SetTranslations);

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

//# sourceMappingURL=data:application/json;base64,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SUFBQyxDQUFBLGlCQUFmLENBQWQ7QUFBQSxhQUFBOztJQUVBLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBSSx3QkFBSCxHQUFzQiw0QkFBdEIsR0FDVCxDQUFJLElBQUMsQ0FBQSxVQUFKLEdBQW9CLDJCQUFwQixHQUFxRCxpQ0FBdEQsQ0FEUSxDQUFaLEVBQytGLGVBRC9GO0lBR0EsSUFBRyxPQUFPLElBQUMsQ0FBQSxpQkFBUixLQUE2QixVQUFoQztNQUNJLElBQUMsQ0FBQSxVQUFELENBQVksaUJBQVosRUFBK0IsbUJBQS9CLEVBREo7O0lBR0EsZUFBZSxDQUFDLElBQWhCLENBQXFCLElBQXJCLEVBQXdCLFFBQXhCO1dBQ0EsSUFBQyxDQUFBLGVBQUQsR0FBbUIsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQUcsS0FBQyxDQUFBO01BQUo7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0VBVkw7O0VBWWxCLGlCQUFpQixDQUFDLElBQWxCLENBQXVCLGVBQXZCOztFQUlBLENBQUEsQ0FBRSxTQUFBO0FBQ0UsUUFBQTtJQUFBLElBQUEsR0FBVyxJQUFBLGNBQUEsQ0FBbUIsSUFBQSxLQUFBLENBQU0sRUFBTixDQUFuQjtXQUNQLElBQUEsV0FBQSxDQUNBO01BQUEsTUFBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLElBQU47T0FESjtLQURBO0VBRk4sQ0FBRjtBQW5LQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJsYW5ndWFnZSA9ICdlbidcblxuVFJBTlNMQVRJT04gPVxuICAgIGVuOlxuICAgICAgICB0b2RvTGlzdDogJ1RvIGRvIGxpc3QnXG4gICAgICAgIGRlbGV0ZUl0ZW06ICdEZWxldGUgaXRlbSdcbiAgICAgICAgaXRlbTogJ0l0ZW0nXG4gICAgICAgIGFkZEl0ZW06ICdBZGQgaXRlbSdcbiAgICAgICAgY2hhbmdlTGFuZ3VhZ2U6ICdDaGFuZ2UgbGFuZ3VhZ2UnXG4gICAgZGU6XG4gICAgICAgIHRvZG9MaXN0OiAnQXVmZ2FiZW5saXN0ZSdcbiAgICAgICAgZGVsZXRlSXRlbTogJ0VsZW1lbnQgbMO2c2NoZW4nXG4gICAgICAgIGl0ZW06ICdBcnRpa2VsJ1xuICAgICAgICBhZGRJdGVtOiAnQXJ0aWtlbCBoaW56dWbDvGdlbidcbiAgICAgICAgY2hhbmdlTGFuZ3VhZ2U6ICdTcHJhY2hlIMOkbmRlcm4nXG5cbiMjI1xuICAgIFRvLWRvIGl0ZW0gbW9kZWxcbiMjI1xuY2xhc3MgVG9kb0l0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5Nb2RlbFxuICAgIGRlZmF1bHRzOlxuICAgICAgICB0aXRsZTogJydcbiAgICAgICAgY2hlY2tlZDogJydcblxuICAgIHRyYW5zbGF0aW9uSW1wb3J0OiBbJ2l0ZW0nXVxuXG4gICAgb25MYW5ndWFnZUNoYW5nZWQ6IC0+XG4gICAgICAgIEBzZXQgJ3RpdGxlJywgXCIje0B0cmFuc2xhdGlvbi5pdGVtfSAjI3tAY2lkfVwiXG5cbiAgICByZWFkeTogLT5cblxuIyMjXG4gICAgVG8tZG8gY29sbGVjdGlvblxuIyMjXG5jbGFzcyBUb2RvQ29sbGVjdGlvbiBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cbiAgICBtb2RlbDogVG9kb0l0ZW1cblxuXG4jIyNcbiAgICBUby1kbyBpdGVtIHZpZXdcbiMjI1xuY2xhc3MgVG9kb0l0ZW1WaWV3IGV4dGVuZHMgTWFyaW9uZXR0ZS5JdGVtVmlld1xuICAgIHRlbXBsYXRlOiAnI2pzVG9kb0l0ZW1WaWV3J1xuICAgIHVpOlxuICAgICAgICBjaGVja2JveDogJy5qc0NoZWNrYm94J1xuICAgICAgICBkZWxldGVCdXR0b246ICcuanNEZWxldGVJdGVtJ1xuXG4gICAgdHJhbnNsYXRpb25JbXBvcnQ6IFsnZGVsZXRlSXRlbSddXG5cbiAgICBldmVudHM6XG4gICAgICAgICdjbGljayBAdWkuZGVsZXRlQnV0dG9uJzogJ2RlbGV0ZUl0ZW0nXG4gICAgICAgICdjbGljayBAdWkuanNDaGVja2JveCc6ICdvbkNoZWNrYm94Q2xpY2snXG4gICAgICAgICdjbGljayc6ICdvbkl0ZW1DbGljaydcblxuICAgIGhhbmRsZXJzOlxuICAgICAgICAnbW9kZWwuY2hhbmdlJzogJ3JlbmRlcidcblxuICAgIG9uQ2hlY2tib3hDbGljazogLT4gZmFsc2VcblxuICAgIGRlbGV0ZUl0ZW06IC0+XG4gICAgICAgIEByZW1vdmUoKVxuXG4gICAgb25JdGVtQ2xpY2s6IC0+XG4gICAgICAgIEBtb2RlbC5zZXQoJ2NoZWNrZWQnLCBpZiBAbW9kZWwuZ2V0KCdjaGVja2VkJykgaXMgJ2NoZWNrZWQnIHRoZW4gJycgZWxzZSAnY2hlY2tlZCcpXG5cblxuIyMjXG4gICAgVG8tZG8gY29sbGVjdGlvbiB2aWV3XG4jIyNcbmNsYXNzIFRvZG9Db2xsZWN0aW9uVmlldyBleHRlbmRzIE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlld1xuICAgIHRlbXBsYXRlOiAnI2pzVG9kb0NvbGxlY3Rpb25WaWV3JyxcbiAgICBjaGlsZFZpZXc6IFRvZG9JdGVtVmlldyxcbiAgICBjaGlsZFZpZXdDb250YWluZXI6ICcuanNUb2RvTGlzdENvbnRhaW5lcidcblxuICAgIHRyYW5zbGF0aW9uSW1wb3J0OiBbJ3RvZG9MaXN0JywgJ2FkZEl0ZW0nLCAnY2hhbmdlTGFuZ3VhZ2UnXVxuXG4gICAgdWk6XG4gICAgICAgIGFkZEl0ZW06ICcuanNBZGRJdGVtJ1xuICAgICAgICBjaGFuZ2VMYW5ndWFnZTogJy5qc0NoYW5nZUxhbmd1YWdlJ1xuXG4gICAgZXZlbnRzOlxuICAgICAgICAnY2xpY2sgQHVpLmFkZEl0ZW0nOiAnb25BZGRJdGVtQ2xpY2snXG4gICAgICAgICdjbGljayBAdWkuY2hhbmdlTGFuZ3VhZ2UnOiAnb25DaGFuZ2VMYW5ndWFnZUNsaWNrJ1xuXG4gICAgaGFuZGxlcnM6XG4gICAgICAgICdhcHBsaWNhdGlvbi5jaGFuZ2VMYW5ndWFnZSc6ICdyZW5kZXInXG5cbiAgICBvbkFkZEl0ZW1DbGljazogLT5cbiAgICAgICAgQGNvbGxlY3Rpb24uYWRkIHt9XG5cbiAgICBvbkNoYW5nZUxhbmd1YWdlQ2xpY2s6IC0+XG4gICAgICAgIGxhbmd1YWdlID0gaWYgbGFuZ3VhZ2UgaXMgJ2VuJyB0aGVuICdkZScgZWxzZSAnZW4nXG4gICAgICAgIEBjb2xsZWN0aW9uLnRyaWdnZXIgJ2NoYW5nZUxhbmd1YWdlJywgbGFuZ3VhZ2VcbiAgICAgICAgQGFwcGxpY2F0aW9uLnRyaWdnZXIgJ2NoYW5nZUxhbmd1YWdlJywgbGFuZ3VhZ2VcblxuXG4gICAgYm9vdHN0cmFwOiBbXG4gICAgICAgICdpbml0Q29sbGVjdGlvbidcbiAgICBdXG5cbiAgICBpbml0Q29sbGVjdGlvbjogLT5cblxuXG4jIyNcbiAgICBBcHBsaWNhdGlvbiBsYXlvdXRcbiMjI1xuY2xhc3MgQXBwbGljYXRpb25MYXlvdXQgZXh0ZW5kcyBNYXJpb25ldHRlLkxheW91dFZpZXdcbiAgICBlbDogJ2JvZHknLFxuICAgIHJlZ2lvbnM6XG4gICAgICAgIHRvZG9MaXN0OiAnLmpzVG9kb0xpc3QnXG5cbiAgICBib290c3RyYXA6IFtcbiAgICAgICAgJ2luaXRpYWxpemVUb2RvTGlzdCdcbiAgICBdXG5cbiAgICBpbml0aWFsaXplVG9kb0xpc3Q6IC0+XG4gICAgICAgIEBnZXRSZWdpb24oJ3RvZG9MaXN0Jykuc2hvdyhcbiAgICAgICAgICAgIG5ldyBUb2RvQ29sbGVjdGlvblZpZXdcbiAgICAgICAgICAgICAgICBhdHRhY2g6XG4gICAgICAgICAgICAgICAgICAgIGFwcGxpY2F0aW9uOiBAXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IEB0b2RvXG4gICAgICAgIClcblxuXG4jIyNcbiAgICBUby1kbyBhcHBsaWNhdGlvblxuIyMjXG5jbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIE1hcmlvbmV0dGUuQXBwbGljYXRpb25cbiAgICBsYXlvdXQ6IG51bGxcbiAgICByZWFkeTogLT5cbiAgICAgICAgQGxheW91dCA9IG5ldyBBcHBsaWNhdGlvbkxheW91dFxuICAgICAgICAgICAgYXR0YWNoOlxuICAgICAgICAgICAgICAgIGFwcGxpY2F0aW9uOiBAXG4gICAgICAgICAgICAgICAgdG9kbzogQHRvZG9cblxuIyMjXG4gICAgXCJjaGFuZ2VMYW5ndWFnZVwiIGV2ZW50IGhhbmRsZXJcbiMjI1xuc2V0VHJhbnNsYXRpb25zID0gKGxhbmcpLT5cbiAgICBAdHJhbnNsYXRpb24gPSB7fVxuICAgIEB0cmFuc2xhdGlvbkltcG9ydC5mb3JFYWNoIChuYW1lKT0+XG4gICAgICAgIEB0cmFuc2xhdGlvbltuYW1lXSA9IFRSQU5TTEFUSU9OW2xhbmddW25hbWVdXG4gICAgQHRyaWdnZXIgJ2xhbmd1YWdlQ2hhbmdlZCcsIGxhbmdcblxuIyMjXG4gICAgR2xvYmFsIGJhYmtib25lIGluaXRpYWxpemUgYm9vdHN0cmFwIGZ1bmN0aW9uXG4jIyNcblNldFRyYW5zbGF0aW9ucyA9IC0+XG4gICAgcmV0dXJuIHVubGVzcyBBcnJheS5pc0FycmF5IEB0cmFuc2xhdGlvbkltcG9ydFxuXG4gICAgQGFkZEhhbmRsZXIgKGlmIEBhcHBsaWNhdGlvbj8gdGhlbiAnYXBwbGljYXRpb24uY2hhbmdlTGFuZ3VhZ2UnIGVsc2VcbiAgICAgICAgKGlmIEBjb2xsZWN0aW9uIHRoZW4gJ2NvbGxlY3Rpb24uY2hhbmdlTGFuZ3VhZ2UnIGVsc2UgJ21vZGVsLmNvbGxlY3Rpb24uY2hhbmdlTGFuZ3VhZ2UnKSksIHNldFRyYW5zbGF0aW9uc1xuXG4gICAgaWYgdHlwZW9mIEBvbkxhbmd1YWdlQ2hhbmdlZCBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEBhZGRIYW5kbGVyICdsYW5ndWFnZUNoYW5nZWQnLCAnb25MYW5ndWFnZUNoYW5nZWQnXG5cbiAgICBzZXRUcmFuc2xhdGlvbnMuY2FsbCBALCBsYW5ndWFnZVxuICAgIEB0ZW1wbGF0ZUhlbHBlcnMgPSA9PiBAdHJhbnNsYXRpb25cblxuQmFja2JvbmVCb290c3RyYXAucHVzaCBTZXRUcmFuc2xhdGlvbnNcblxuXG4jIGluaXRcbiQgLT5cbiAgICB0b2RvID0gbmV3IFRvZG9Db2xsZWN0aW9uKG5ldyBBcnJheSgxMCkpXG4gICAgbmV3IEFwcGxpY2F0aW9uXG4gICAgICAgIGF0dGFjaDpcbiAgICAgICAgICAgIHRvZG86IHRvZG8iXX0=
